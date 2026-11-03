# SweepDevDisk

![CI](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml/badge.svg) ![Rust](https://img.shields.io/badge/Rust-stable-orange) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tauri](https://img.shields.io/badge/Tauri-2-ffc131) ![License](https://img.shields.io/badge/license-MIT-green)

O SweepDevDisk é uma aplicação de ambiente de trabalho para Linux, planeada para auditar o espaço em disco ocupado por artefactos de desenvolvimento que podem ser gerados novamente. Foi concebida como uma ferramenta local, sem servidor remoto.

## Objectivo do produto

A aplicação deverá ajudar os programadores a identificar diretórios de projectos e a perceber o espaço ocupado por artefactos como `node_modules`, `.next`, resultados de compilação, diretórios `vendor` e caches de ferramentas. A limpeza manual e automática está planeada; nenhuma destas funcionalidades está implementada nesta fundação.

## Tecnologias e arquitectura

- Tauri 2 e Rust para a aplicação de ambiente de trabalho e futuras operações locais.
- React 19, TypeScript em modo strict, Vite 8, Tailwind CSS 4, aliases preparados para shadcn/ui, Lucide React, Vitest e React Testing Library.
- SQLite está reservado para uma futura etapa de persistência; ainda não existe integração com uma base de dados nem esquema definido.
- A comunicação entre a interface e o backend será feita através de comandos Tauri com permissões limitadas.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para mais informações.

## Requisitos

Linux, Node.js 24 LTS, pnpm 12, Rust stable com Cargo e as bibliotecas de desenvolvimento Linux do Tauri. Consulte [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Instalação e execução

```bash
pnpm install --frozen-lockfile
pnpm dev       # inicia a aplicação Tauri
pnpm dev:web   # inicia apenas o frontend Vite
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

Compilação de produção: `pnpm build`. Pacotes Linux: `pnpm tauri build --bundles deb,appimage`.

## Contribuição e roteiro

Leia [CONTRIBUTING.md](docs/CONTRIBUTING.md) e a [lista central de tarefas](docs/TASKS.md). O plano inclui a análise de projectos, a detecção de artefactos, a análise de armazenamento, um painel, limpeza segura, histórico, regras, agendamento, segurança e distribuição para Linux.

## Licença

MIT. Consulte [LICENSE](LICENSE); o titular dos direitos de autor e o ano permanecem como marcadores por preencher.

> As ligações dos emblemas usam os marcadores `OWNER/REPOSITORY`. Actualize-os quando o URL oficial do repositório for conhecido.
