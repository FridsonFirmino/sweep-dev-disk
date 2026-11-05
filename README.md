# SweepDevDisk

<img src="public/icon.png" alt="SweepDevDisk" width="96" />

![CI](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml/badge.svg) ![Rust](https://img.shields.io/badge/Rust-stable-orange) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tauri](https://img.shields.io/badge/Tauri-2-ffc131) ![License](https://img.shields.io/badge/license-MIT-green)

O SweepDevDisk é um aplicativo para desktop destinado a auditar, localmente, o espaço em disco ocupado por artefatos de desenvolvimento. Ele permite identificar arquivos e diretórios que podem ser removidos para liberar espaço em disco, sem depender de servidores remotos.

## Demo

https://github.com/user-attachments/assets/4c7fb66b-1b7e-4646-804a-1e2372cf0183

## Objectivo do produto

O objectivo do SweepDevDisk é ajudar programadores a identificar, analisar e remover artefactos de desenvolvimento que ocupam espaço desnecessário no disco, permitindo recuperar armazenamento sem comprometer os ficheiros de código-fonte dos seus projectos.

## Funcionalidades actuais (versão 1.0.0)

- Análise só de leitura dos directórios configurados, com exclusões, política de ligações simbólicas e limites documentados em [docs/SCANNER.md](docs/SCANNER.md).
- Painel de detalhe do projecto com os artefactos detectados, o nível de risco e uma nota de recuperação (`Reinstalável`, `Regenerável` ou `Requer revisão`), derivada do campo `recovery` de `src/data/supported-artifacts.json`.
- Página "Artefactos suportados" com o catálogo completo do scanner, incluindo a coluna Recuperação com a mesma nota de cada artefacto.
- Limpeza com revisão e simulação antes da confirmação, revalidação imediata dos destinos e envio para o lixo do sistema operativo, conforme [docs/CLEANUP.md](docs/CLEANUP.md).
- Histórico local de limpezas com retenção e opção de anular a partir do lixo, quando a plataforma o permite.

## Tecnologias e arquitectura

- Tauri 2 e Rust para a aplicação de ambiente de desktop e operações locais de análise e limpeza.
- React 19, TypeScript em modo strict, Vite 8, Tailwind CSS 4, aliases preparados para shadcn/ui, Lucide React, Vitest e React Testing Library.
- O histórico de limpezas usa um ficheiro JSON no directório de dados da aplicação; o SQLite continua reservado para uma futura etapa de persistência de negócio.
- A comunicação entre a interface e o backend é feita através de comandos Tauri com permissões limitadas.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para mais informações.

## Requisitos

Node.js 24 LTS, pnpm 12 e Rust stable com Cargo. Para compilar a aplicação de ambiente de trabalho, instale também os requisitos do Tauri para [Ubuntu](docs/DEVELOPMENT.md#ubuntu-linux) ou [Windows](docs/DEVELOPMENT.md#windows).

## Instalação e execução

```bash
pnpm install --frozen-lockfile
pnpm tauri dev       # inicia a aplicação Tauri (Desktop)
pnpm run dev   # inicia apenas o frontend Vite
```

## Verificações de qualidade

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all
```

Compilação do frontend: `pnpm build`. Em Ubuntu, compile os pacotes `.deb` e AppImage com `pnpm tauri build`; em Windows, compile os instaladores `.msi` e NSIS com `pnpm tauri build --config src-tauri/tauri.windows.conf.json`.

## Como contribuir

O fluxo completo está no guia de [contribuição](docs/CONTRIBUTING.md): abra uma issue, solicite a sua implementação, faça um fork, crie a sua branch a partir de `develop` e envie o pull request. Antes de começar, consulte a [lista central de tarefas](docs/TASKS.md) e o [código de conduta](CODE_OF_CONDUCT.md).

O roteiro do produto inclui a análise de projectos, a detecção de artefactos, a análise de armazenamento, um painel, limpeza segura, histórico, regras, agendamento, segurança e distribuição para Ubuntu e Windows.
