# Arquitectura

## Fundação actual

A aplicação é uma estrutura de ambiente de trabalho Tauri 2, local e autónoma. O React apresenta as páginas e o Rust inicia o runtime do Tauri. A primeira versão inclui um scanner local só de leitura; a ferramenta de limpeza real, a persistência de negócio, o serviço de rede e a base de dados ainda não existem.

## Responsabilidades

- `src/`: apresentação, componentes de interface, futuras funcionalidades e testes do frontend.
- `src/data/`: catálogo partilhado de artefactos suportados, lido pelo scanner Rust (`include_str!`) e pelas páginas React (import directo do JSON).
- `src-tauri/src/commands`: adaptadores de pedido e resposta, com âmbito limitado, expostos à webview.
- `src-tauri/src/core`: futura lógica da aplicação, independente do Tauri.
- `src-tauri/src/database`: futura camada de persistência local.
- `src-tauri/src/models`: futuros tipos de dados do backend.

A interface comunica com o Rust através de comandos Tauri. O scanner no Rust valida os caminhos escolhidos pelo utilizador, aplica exclusões, trata ligações simbólicas segundo as preferências e não altera o sistema de ficheiros. A capability da webview não concede acesso directo ao sistema de ficheiros; a ferramenta de limpeza ainda não está implementada.

## Persistência

O SQLite é uma opção planeada para a persistência local. Esta fundação não inclui dependências de base de dados, migrações nem tabelas de negócio.

## Decisões iniciais

- Manter o frontend e o backend Rust no mesmo repositório.
- Usar TypeScript em modo strict e limites explícitos entre módulos.
- Manter as capabilities do Tauri reduzidas; adicionar permissões apenas quando uma funcionalidade as justificar.
- Usar o tema escuro por predefinição e definir tokens para o tema claro.
- Publicar versões apenas a partir de tags SemVer criadas explicitamente.
