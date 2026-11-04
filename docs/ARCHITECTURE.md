# Arquitectura

## Fundação actual

A aplicação é uma estrutura de ambiente de trabalho Tauri 2, local e autónoma. O React apresenta as páginas e o Rust inicia o runtime do Tauri. Inclui um scanner local só de leitura e uma ferramenta de limpeza que revalida destinos e envia artefactos para o lixo do sistema operativo. O serviço de rede e a base de dados de negócio ainda não existem.

## Responsabilidades

- `src/`: apresentação, componentes de interface, funcionalidades e testes do frontend.
- `src/data/`: catálogo partilhado de artefactos suportados, lido pelo scanner e pela limpeza Rust (`include_str!`) e pelas páginas React (import directo do JSON).
- `src-tauri/src/commands`: adaptadores de pedido e resposta, com âmbito limitado, expostos à webview.
- `src-tauri/src/core`: lógica da aplicação independente do Tauri (`scanner`, `cleanup`, `history`, `paths`).
- `src-tauri/src/database`: futura camada de persistência de negócio (SQLite continua reservado).
- `src-tauri/src/models`: tipos de dados serializados entre frontend e backend.

A interface comunica com o Rust através de comandos Tauri. O scanner valida os caminhos escolhidos pelo utilizador, aplica exclusões, trata ligações simbólicas segundo as preferências e não altera o sistema de ficheiros. A limpeza revalida cada destino imediatamente antes de o enviar para o lixo do sistema, pode ser executada em modo de simulação e regista um histórico local em ficheiro JSON. A capability da webview não concede acesso directo ao sistema de ficheiros.

## Persistência

O histórico de limpezas é gravado em `cleanup-history.json` no directório de dados da aplicação, com retenção limitada. O SQLite é uma opção planeada para a persistência de negócio; esta versão não inclui dependências de base de dados nem migrações.

## Decisões iniciais

- Manter o frontend e o backend Rust no mesmo repositório.
- Usar TypeScript em modo strict e limites explícitos entre módulos.
- Manter as capabilities do Tauri reduzidas; adicionar permissões apenas quando uma funcionalidade as justificar.
- Usar o tema escuro por predefinição e definir tokens para o tema claro.
- Publicar versões apenas a partir de tags SemVer criadas explicitamente.
- Enviar artefactos para o lixo do SO com a crate `trash` em vez de eliminação directa.
