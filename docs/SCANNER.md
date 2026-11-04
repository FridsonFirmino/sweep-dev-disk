# Contrato da análise de projectos

Este documento regista o contrato e o comportamento da primeira versão do scanner local. É a referência para os adaptadores Tauri, a lógica Rust e a integração com o frontend. Os limites ainda não cobertos estão assinalados nas tarefas de desenvolvimento.

## Âmbito e garantias

- A análise é só de leitura: não cria, altera, move nem elimina ficheiros ou directórios.
- A análise corre localmente e não envia caminhos ou resultados para serviços remotos.
- O scanner recebe uma cópia das definições no início da operação. Alterações feitas nas definições durante uma análise só se aplicam à análise seguinte.
- O scanner nunca usa privilégios adicionais aos da conta que executa a aplicação.
- A primeira versão reconhece os marcadores e padrões listados neste documento. A lista pode evoluir em tarefas próprias, sem alterar as regras de percurso e comunicação.

## Pedido Tauri

O frontend invoca `scan_projects` com as definições actuais:

```ts
interface ScanOptions {
  projectDirectories: string[];
  excludedDirectories: string[];
  followSymbolicLinks: boolean;
  scanHiddenDirectories: boolean;
}
```

Os nomes no IPC usam camelCase, correspondendo a `SettingsPreferences` no frontend. As definições não são persistidas pelo backend: o frontend envia-as em cada análise.

### Preparação dos caminhos

1. Expandir `~` e `~/...` para o directório pessoal do utilizador actual.
2. Aceitar apenas caminhos absolutos depois da expansão. Caminhos relativos são inválidos.
3. Resolver cada caminho existente para o seu caminho canónico antes de percorrer ou comparar exclusões.
4. Remover caminhos de análise duplicados depois da normalização. Um caminho excluído corresponde ao próprio directório e a todos os seus descendentes, com comparação por componentes de caminho e não por prefixo textual.
5. Um caminho inexistente, inválido ou sem permissões produz um aviso associado ao caminho; não impede a análise dos outros caminhos válidos.
6. Se não houver caminhos de análise configurados, terminar sem percorrer o sistema e devolver um resultado vazio com o aviso `no_scan_directories`.

## Regras de percurso

- Percorrer apenas os directórios de análise configurados e os seus descendentes.
- Ignorar qualquer caminho excluído, incluindo os seus descendentes.
- Por predefinição, não seguir ligações simbólicas. Quando activada a opção, seguir apenas destinos canónicos que permaneçam dentro de um dos directórios de análise e fora de exclusões.
- Manter um conjunto de caminhos canónicos já visitados para evitar ciclos e visitas duplicadas, incluindo ciclos de ligações simbólicas.
- Por predefinição, ignorar directórios ocultos: nomes iniciados por ponto em Ubuntu e directórios com o atributo Hidden em Windows. Com a opção activa, incluí-los.
- Se um directório descendente ficar inacessível durante a análise, registar um aviso e continuar os restantes caminhos.
- Limitar a profundidade a 64 níveis e a análise a 250 000 entradas. Ao atingir um limite, devolver os resultados parciais com o aviso correspondente.
- Limitar a 100 avisos detalhados por análise; se existirem mais, acrescentar `warnings_truncated`.
- Ordenar os resultados finais por caminho canónico para produzir resultados estáveis entre execuções.

## Detecção inicial

Um directório é considerado projecto quando contém pelo menos um dos seguintes marcadores: `package.json` (Node.js), `Cargo.toml` (Rust), `pyproject.toml` ou `requirements.txt` (Python), `go.mod` (Go), `composer.json` (PHP), `Gemfile` (Ruby), `pom.xml` (Java/Maven), `build.gradle` (Java/Kotlin), `build.gradle.kts` (Kotlin), `mix.exs` (Elixir), `pubspec.yaml` (Dart/Flutter), `CMakeLists.txt` (C/C++) ou um ficheiro `.csproj`/`.sln` (C#/.NET). O nome do projecto é o nome do directório; a tecnologia apresenta os marcadores reconhecidos.

Dentro de um projecto, os seguintes nomes de directório são reconhecidos como artefactos: `node_modules`, `.next`, `__pycache__`, `.venv`, `venv`, `coverage`, `.gradle`, `Pods`, `DerivedData`, `target`, `dist`, `build` e `vendor`. Os primeiros nove têm risco `low`; `target`, `dist`, `build` e `vendor` têm risco `medium`. Ao encontrar um artefacto, o scanner mede-o e não percorre o seu conteúdo à procura de projectos.

A medição de um artefacto inclui também os seus subdirectórios ocultos, como `.pnpm` dentro de `node_modules`. A preferência para analisar directórios ocultos controla a descoberta de projectos fora dos artefactos. Ligações simbólicas dentro dos artefactos continuam a respeitar a preferência de as seguir e o limite das raízes analisadas.

O tamanho é a soma do tamanho lógico dos ficheiros alcançáveis dentro do artefacto, respeitando exclusões, limites e a opção de ligações simbólicas. `reclaimableBytes` corresponde a esta estimativa. Pode diferir do espaço efectivamente libertado por causa de hard links, ficheiros esparsos ou compressão do sistema de ficheiros; não deve ser usado como garantia de espaço recuperável numa operação destrutiva.

O identificador do projecto e do artefacto é o caminho canónico. `lastActivity` usa a data de modificação do directório raiz do projecto.

## Comandos, progresso e cancelamento

O contrato IPC usa os comandos e o evento já reservados pelo frontend:

- `scan_projects({ options })` inicia uma análise e devolve o resultado final.
- `scan-progress` comunica progresso para a janela que iniciou a análise.
- `cancel_scan()` pede o cancelamento da análise activa e é idempotente: chamar o comando sem uma análise activa não causa erro.

Só pode existir uma análise activa por aplicação. Uma segunda chamada a `scan_projects` enquanto a primeira está activa termina com `scan_already_running`.

O payload de `scan-progress` mantém os campos usados por `ScanProgress`:

```ts
interface ScanProgress {
  currentPath: string;
  projectsFound: number;
  artifactsFound: number;
  completed?: number;
  total?: number;
}
```

`completed` e `total` contam os directórios de análise válidos concluídos e totais. O scanner emite progresso ao começar cada raiz, ao terminar cada uma e durante percursos longos. Os contadores nunca diminuem. `currentPath` é o caminho local actualmente percorrido e só é enviado à janela local.

O cancelamento é verificado entre entradas e directórios. Após o cancelamento ser aceite, não se emitem novos eventos de progresso e a chamada `scan_projects` termina com `scan_cancelled`. O frontend trata esse resultado como cancelamento normal, não como erro. Um cancelamento não desfaz a leitura já efectuada e, por ser uma operação só de leitura, não deixa alterações no sistema de ficheiros.

## Resultado e avisos

Uma conclusão normal devolve `ScanResult` com:

- `projects`: projectos detectados, com caminhos absolutos e artefactos encontrados;
- `disks`: capacidade e espaço disponível, em bytes, nos volumes que contêm directórios de análise válidos; volumes repetidos são contados uma única vez;
- `completedAt`: instante de conclusão em ISO 8601 UTC;
- `warnings`: avisos não fatais, cada um com um `code` estável e um `path` opcional.

O resumo apresenta a soma da capacidade e do espaço disponível nos volumes analisados. O espaço potencialmente recuperável é calculado a partir dos artefactos encontrados e não é subtraído do espaço disponível, porque a limpeza ainda não foi executada.

Os códigos de aviso são `no_scan_directories`, `all_scan_directories_excluded`, `invalid_scan_directory`, `invalid_excluded_directory`, `directory_unavailable`, `symlink_outside_scan_roots`, `max_depth_reached`, `scan_limit_reached`, `size_overflow` e `warnings_truncated`. Um erro numa raiz não descarta resultados de outras raízes. Os códigos são identificadores de contrato; o frontend é responsável pelas mensagens em português.

Os erros fatais do comando ficam reservados a falhas que impedem iniciar ou manter a análise, incluindo `scan_already_running` e `scan_cancelled`. Os erros não devem incluir conteúdo de ficheiros nem dados pessoais além dos caminhos locais necessários para diagnóstico na interface.

## Critérios para considerar o contrato implementado

- Os argumentos, eventos, resultados, avisos e erros coincidem com as definições deste documento.
- O scanner respeita exclusões, preferências de directórios ocultos e a política de ligações simbólicas em Ubuntu e Windows.
- Caminhos inválidos ou inacessíveis não interrompem a análise das restantes raízes.
- O cancelamento termina a operação sem deixar tarefas activas nem continuar a emitir progresso.
- A operação não modifica o sistema de ficheiros nem acede a caminhos fora das raízes permitidas.
