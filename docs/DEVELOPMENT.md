# Desenvolvimento

## Requisitos para Linux

Instale Node.js 24 LTS, pnpm 12, Rust stable e Cargo, além das bibliotecas de desenvolvimento do Tauri para a sua distribuição. No Ubuntu, a CI instala `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libxdo-dev`, `libssl-dev`, `librsvg2-dev` e `libayatana-appindicator3-dev`.

As dependências de sistema do Tauri variam conforme a distribuição e podem mudar. Consulte os requisitos oficiais do Tauri para a sua versão do Linux se a compilação indicar a falta de uma biblioteca GTK ou WebKit.

## Instalar e executar

```bash
pnpm install --frozen-lockfile
pnpm dev
```

O comando `pnpm dev:web` inicia apenas o Vite em `http://localhost:1420`. A porta é fixa para que a webview do Tauri e o HMR usem um endereço previsível.

## Compilar e verificar

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all
pnpm tauri build --bundles deb,appimage
```

## Problemas frequentes

- A porta Vite 1420 está ocupada: pare o processo que a está a utilizar. O modo de porta estrita falha intencionalmente em vez de escolher outra porta.
- Erro de compilação WebKit/GTK: instale as bibliotecas de desenvolvimento do Tauri correspondentes à sua distribuição Linux.
- Erro de dependência ou target Rust: execute `rustup show` e confirme que tem a toolchain stable e o target da plataforma instalados.
- A criação de um AppImage pode exigir ferramentas de empacotamento do sistema; o ambiente de CI é a referência para as releases.
