# Contrato da limpeza de artefactos

Este documento regista o contrato e o comportamento da operação de limpeza local. É a referência para os adaptadores Tauri, a lógica Rust e a integração com o frontend. O contrato da análise permanece em [SCANNER.md](SCANNER.md).

## Âmbito e garantias

- A limpeza remove apenas directórios de artefactos seleccionados pelo utilizador e revalidados imediatamente antes da remoção.
- Cada destino é enviado para o lixo do sistema operativo (XDG Trash em Ubuntu, Recycle Bin em Windows) através da crate `trash`; não usa eliminação irreversível directa.
- A limpeza corre localmente e não envia caminhos, resultados nem histórico para serviços remotos.
- O backend recebe uma cópia das definições de validação em cada pedido, tal como o scanner. Não guarda preferências do utilizador.
- O scanner continua a ser só de leitura; a limpeza é a única operação que altera o sistema de ficheiros.
- A operação não usa privilégios adicionais aos da conta que executa a aplicação.
- Uma falha num artefacto não impede a processagem dos restantes artefactos do mesmo pedido.

## Pedido Tauri

O frontend invoca `cleanup_artifacts` com a selecção e as definições actuais:

```ts
interface CleanupRequest {
  selection: CleanupSelection;
  projectDirectories: string[];
  excludedDirectories: string[];
  dryRun: boolean;
}

interface CleanupSelection {
  projectId: string;
  artifactIds: string[];
}
```

Os nomes no IPC usam camelCase. O identificador do projecto e de cada artefacto é o caminho canónico produzido pelo scanner.

### Modo de simulação

Com `dryRun: true`, o backend executa todas as validações e medições mas não altera o sistema de ficheiros. O resultado lista os destinos que seriam removidos e o espaço que seria recuperado. A simulação usa o mesmo código de revalidação da remoção real.

### Revalidação imediatamente antes da remoção

Para cada artefacto seleccionado, imediatamente antes de o enviar para o lixo, o backend verifica:

1. O caminho é absoluto e resolve para um caminho canónico sem `..` residuais.
2. O caminho canónico permanece dentro de pelo menos um dos `projectDirectories` válidos (após expansão de `~` e normalização).
3. O caminho não está contido em nenhum dos `excludedDirectories`.
4. O último componente do caminho corresponde a um nome de `src/data/supported-artifacts.json`, com igualdade sensível a maiúsculas/minúsculas apenas em Windows.
5. O caminho é um directório existente e não é uma ligação simbólica que resolva para fora das raízes permitidas.
6. O caminho não é igual a uma raiz de projecto configurada, a uma raiz de volume nem ao directório pessoal do utilizador.

Se qualquer verificação falhar, o artefacto é registado em `failures` com um código estável e a operação continua com os restantes.

### Remoção

- A remoção usa a crate `trash` para respeitar o lixo do sistema operativo.
- Quando a operação de lixo falha, o artefacto é registado em `failures` com o código `cleanup_trash_unavailable` ou `cleanup_failed`.
- O backend limita cada pedido a um número máximo de artefactos (definido no código) para conter o tempo de execução.
- Só pode existir uma limpeza activa por aplicação.

## Comando e erros

- `cleanup_artifacts({ selection, projectDirectories, excludedDirectories, dryRun })` executa a limpeza ou a simulação e devolve o resultado final.

Erros fatais do comando (a chamada inteira falha):

| Código                      | Significado                                         |
| --------------------------- | --------------------------------------------------- |
| `cleanup_already_running`   | Já existe uma limpeza activa.                       |
| `cleanup_state_unavailable` | O estado partilhado do comando não está disponível. |
| `cleanup_failed`            | Falha inesperada ao iniciar ou concluir o pedido.   |
| `cleanup_invalid_request`   | Pedido malformado (selecção ausente ou inválida).   |

Falhas por artefacto (não abortam o lote; entram em `failures`):

| Código                       | Significado                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `cleanup_path_outside_roots` | O caminho está fora dos directórios de projectos configurados. |
| `cleanup_path_excluded`      | O caminho está contido num directório excluído.                |
| `cleanup_not_an_artifact`    | O nome não corresponde ao catálogo de artefactos.              |
| `cleanup_invalid_target`     | O alvo não é um directório válido ou é uma raiz protegida.     |
| `cleanup_trash_unavailable`  | O lixo do sistema operativo não está disponível.               |
| `cleanup_failed`             | Falha ao remover ou medir o artefacto.                         |
| `cleanup_limit_reached`      | O pedido excede o número máximo de artefactos.                 |

Os códigos são identificadores de contrato; o frontend é responsável pelas mensagens em português. Os erros não devem incluir conteúdo de ficheiros nem dados pessoais além dos caminhos locais necessários para diagnóstico na interface.

## Resultado

Uma conclusão normal devolve:

```ts
interface CleanupResult {
  dryRun: boolean;
  removedArtifactIds: string[];
  wouldRemoveArtifactIds: string[];
  reclaimedBytes: number;
  failures: Array<{ artifactId: string; code: string; message?: string }>;
}
```

- `removedArtifactIds`: artefactos efectivamente enviados para o lixo (vazio em simulação).
- `wouldRemoveArtifactIds`: artefactos que passaram na revalidação (preenchido em simulação; também pode ser preenchido em remoção real para os que foram tratados).
- `reclaimedBytes`: soma dos tamanhos reais medidos na revalidação dos artefactos removidos (ou que seriam removidos na simulação). Não é garantia de espaço livre no volume por causa de hard links, ficheiros esparsos ou compressão.
- `failures`: falhas por artefacto com `artifactId` e `code`.

## Histórico local

- Após cada pedido não simulado, o backend acrescenta uma entrada a `cleanup-history.json` no directório de dados da aplicação.
- A entrada regista o instante UTC, o projecto, os caminhos tratados, `reclaimedBytes`, as falhas e se o restauro do lixo é suportado.
- A retenção predefinição limita o histórico a um número máximo de entradas e a um número máximo de dias; as entradas mais antigas são removidas primeiro.
- Falhas de leitura ou escrita do histórico não falham a limpeza; são ignoradas ou produzem um aviso não fatal.
- A opção de anular restaura o conteúdo a partir do lixo do sistema operativo quando a plataforma e a crate `trash` o permitem. Quando não é possível, a interface apresenta a entrada como não restaurável.

## Critérios para considerar o contrato implementado

- Os argumentos, resultado e códigos de erro coincidem com as definições deste documento.
- Nenhum caminho fora das raízes, excluído ou não correspondente ao catálogo é removido.
- O modo de simulação não altera o sistema de ficheiros e devolve os mesmos alvos válidos da remoção real.
- Uma falha num artefacto não impede os restantes.
- O envio para o lixo funciona em Ubuntu e Windows; o comportamento alternativo (lixo indisponível) é reportado sem perda silenciosa.
- O histórico é escrito, limitado pela retenção e degradado graciosamente quando inacessível.
- A operação não acede a caminhos fora das raízes permitidas nem envia dados para fora do dispositivo.
