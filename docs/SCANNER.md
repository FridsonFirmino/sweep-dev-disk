# Contrato da análise de projectos

Este documento define o comportamento esperado para a primeira versão do scanner local. É a referência para os adaptadores Tauri, a lógica Rust e a integração com o frontend. A especificação não significa que o scanner já esteja implementado.

## Âmbito e garantias

- A análise é só de leitura: não cria, altera, move nem elimina ficheiros ou directórios.
- A análise corre localmente e não envia caminhos ou resultados para serviços remotos.
- O scanner recebe uma cópia das definições no início da operação. Alterações feitas nas definições durante uma análise só se aplicam à análise seguinte.
- O scanner nunca usa privilégios adicionais aos da conta que executa a aplicação.
- A detecção de marcadores de projectos e os padrões de artefactos são definidos nas tarefas próprias; este contrato define como percorrer os caminhos e comunicar resultados.

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
- Ordenar os resultados finais por caminho canónico para produzir resultados estáveis entre execuções.

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

`completed` e `total` contam os directórios de análise válidos concluídos e totais. O scanner emite progresso ao começar cada raiz e ao terminar cada uma. Os contadores nunca diminuem. `currentPath` é o caminho local actualmente percorrido e só é enviado à janela local.

O cancelamento é verificado entre entradas e directórios. Após o cancelamento ser aceite, não se emitem novos eventos de progresso e a chamada `scan_projects` termina com `scan_cancelled`. O frontend trata esse resultado como cancelamento normal, não como erro. Um cancelamento não desfaz a leitura já efectuada e, por ser uma operação só de leitura, não deixa alterações no sistema de ficheiros.

## Resultado e avisos

Uma conclusão normal devolve `ScanResult` com:

- `projects`: projectos detectados, com caminhos absolutos e artefactos encontrados;
- `completedAt`: instante de conclusão em ISO 8601 UTC;
- `warnings`: avisos não fatais, cada um com um `code` estável e um `path` opcional.

Os códigos iniciais de aviso são `no_scan_directories`, `invalid_scan_directory`, `directory_unavailable` e `symlink_outside_scan_roots`. Um erro numa raiz não descarta resultados de outras raízes. Os códigos são identificadores de contrato; o frontend é responsável pelas mensagens em português.

Os erros fatais do comando ficam reservados a falhas que impedem iniciar ou manter a análise, incluindo `scan_already_running` e `scan_cancelled`. Os erros não devem incluir conteúdo de ficheiros nem dados pessoais além dos caminhos locais necessários para diagnóstico na interface.

## Critérios para considerar o contrato implementado

- Os argumentos, eventos, resultados, avisos e erros coincidem com as definições deste documento.
- O scanner respeita exclusões, preferências de directórios ocultos e a política de ligações simbólicas em Ubuntu e Windows.
- Caminhos inválidos ou inacessíveis não interrompem a análise das restantes raízes.
- O cancelamento termina a operação sem deixar tarefas activas nem continuar a emitir progresso.
- A operação não modifica o sistema de ficheiros nem acede a caminhos fora das raízes permitidas.
