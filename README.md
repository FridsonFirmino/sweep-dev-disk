# SweepDevDisk

<img src="public/icon.png" alt="SweepDevDisk" width="96" />

![CI](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml/badge.svg) ![Rust](https://img.shields.io/badge/Rust-stable-orange) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tauri](https://img.shields.io/badge/Tauri-2-ffc131) ![License](https://img.shields.io/badge/license-MIT-green)

O SweepDevDisk é uma aplicação de ambiente de trabalho para Ubuntu Linux e Windows, planeada para auditar o espaço em disco ocupado por artefactos de desenvolvimento que podem ser gerados novamente. Foi concebida como uma ferramenta local, sem servidor remoto.

## Demo

https://github.com/user-attachments/assets/4c7fb66b-1b7e-4646-804a-1e2372cf0183

## Objectivo do produto

A aplicação deverá ajudar os programadores a identificar diretórios de projectos e a perceber o espaço ocupado por artefactos como `node_modules`, `.next`, resultados de compilação, diretórios `vendor` e caches de ferramentas. A limpeza manual e automática está planeada; nenhuma destas funcionalidades está implementada nesta fundação.

## Funcionalidades actuais (versão 1.0.0)

- Análise só de leitura dos directórios configurados, com exclusões, política de ligações simbólicas e limites documentados em [docs/SCANNER.md](docs/SCANNER.md).
- Painel de detalhe do projecto com os artefactos detectados, o nível de risco e uma nota de recuperação (`Reinstalável`, `Regenerável` ou `Requer revisão`), derivada do campo `recovery` de `src/data/supported-artifacts.json`.
- Página "Artefactos suportados" com o catálogo completo do scanner, incluindo a coluna Recuperação com a mesma nota de cada artefacto.

## Tecnologias e arquitectura

- Tauri 2 e Rust para a aplicação de ambiente de trabalho e futuras operações locais.
- React 19, TypeScript em modo strict, Vite 8, Tailwind CSS 4, aliases preparados para shadcn/ui, Lucide React, Vitest e React Testing Library.
- SQLite está reservado para uma futura etapa de persistência; ainda não existe integração com uma base de dados nem esquema definido.
- A comunicação entre a interface e o backend será feita através de comandos Tauri com permissões limitadas.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para mais informações.

## Requisitos

Node.js 24 LTS, pnpm 12 e Rust stable com Cargo. Para compilar a aplicação de ambiente de trabalho, instale também os requisitos do Tauri para [Ubuntu](docs/DEVELOPMENT.md#ubuntu-linux) ou [Windows](docs/DEVELOPMENT.md#windows).

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

Compilação do frontend: `pnpm build`. Em Ubuntu, compile os pacotes `.deb` e AppImage com `pnpm tauri build`; em Windows, compile os instaladores `.msi` e NSIS com `pnpm tauri build --config src-tauri/tauri.windows.conf.json`.

## Contribuição e roteiro

Leia [CONTRIBUTING.md](docs/CONTRIBUTING.md) e a [lista central de tarefas](docs/TASKS.md). O plano inclui a análise de projectos, a detecção de artefactos, a análise de armazenamento, um painel, limpeza segura, histórico, regras, agendamento, segurança e distribuição para Ubuntu e Windows.

## Licença

MIT. Consulte [LICENSE](LICENSE); o titular dos direitos de autor e o ano permanecem como marcadores por preencher.

> As ligações dos emblemas usam os marcadores `OWNER/REPOSITORY`. Actualize-os quando o URL oficial do repositório for conhecido.
