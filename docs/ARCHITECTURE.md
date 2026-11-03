# Arquitectura

## Fundação actual

A aplicação é uma estrutura de ambiente de trabalho Tauri 2, local e autónoma. O React apresenta a página inicial e o Rust inicia o runtime do Tauri. Actualmente, ainda não existe scanner, ferramenta de limpeza, modelo de negócio, serviço de rede ou base de dados.

## Responsabilidades

- `src/`: apresentação, componentes de interface, futuras funcionalidades e testes do frontend.
- `src-tauri/src/commands`: adaptadores de pedido e resposta, com âmbito limitado, expostos à webview.
- `src-tauri/src/core`: futura lógica da aplicação, independente do Tauri.
- `src-tauri/src/database`: futura camada de persistência local.
- `src-tauri/src/models`: futuros tipos de dados do backend.

A interface deverá comunicar com o Rust através de comandos Tauri. O código que interage com o sistema de ficheiros pertence ao Rust e terá de validar os caminhos escolhidos pelo utilizador, tratar ligações simbólicas e evitar privilégios alargados. Actualmente, a capability concede apenas as permissões base do Tauri; não concede acesso ao sistema de ficheiros.

## Persistência

O SQLite é uma opção planeada para a persistência local. Esta fundação não inclui dependências de base de dados, migrações nem tabelas de negócio.

## Decisões iniciais

- Manter o frontend e o backend Rust no mesmo repositório.
- Usar TypeScript em modo strict e limites explícitos entre módulos.
- Manter as capabilities do Tauri reduzidas; adicionar permissões apenas quando uma funcionalidade as justificar.
- Usar o tema escuro por predefinição e definir tokens para o tema claro.
- Publicar versões apenas a partir de tags SemVer criadas explicitamente.
