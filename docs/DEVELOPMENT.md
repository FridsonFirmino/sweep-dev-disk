# Desenvolvimento

O projecto valida a aplicação de ambiente de trabalho em Ubuntu Linux e Windows. Os instaladores devem ser compilados no sistema operativo de destino; o workflow de release usa runners próprios para cada plataforma.

## Requisitos comuns

- Node.js 24 LTS.
- pnpm 12 (a versão exacta está definida em `package.json`).
- Rust stable e Cargo.

## Ubuntu Linux

Instale as bibliotecas de desenvolvimento do Tauri e as ferramentas de compilação:

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl wget file libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev libwebkit2gtk-4.1-dev
```

Estas são as dependências usadas pelo CI em Ubuntu 24.04. Para outras versões de Ubuntu, confirme os requisitos actuais na [documentação oficial do Tauri](https://v2.tauri.app/start/prerequisites/).

## Windows

Instale o Visual Studio Build Tools com a carga de trabalho **Desenvolvimento para ambiente de trabalho com C++**, o WebView2 Runtime e Rust stable com a toolchain MSVC (por exemplo, `x86_64-pc-windows-msvc`). Consulte os [pré-requisitos oficiais do Tauri para Windows](https://v2.tauri.app/start/prerequisites/).

Execute ou compile a partir do PowerShell ou do terminal do Visual Studio Developer:

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
pnpm tauri build --config src-tauri/tauri.windows.conf.json
```

O pacote Windows é configurado para produzir instaladores MSI e NSIS. A compilação nativa em Windows também verifica a integração com WebView2 e as dependências específicas do Windows.

## Instalar e executar

```bash
pnpm install --frozen-lockfile
pnpm tauri dev   # inicia a aplicação Tauri (desktop)
pnpm run dev     # inicia apenas o frontend Vite
```

O comando `pnpm tauri dev` compila e abre a aplicação de ambiente de desktop; o Vite arranca automaticamente como `beforeDevCommand`. O comando `pnpm run dev` inicia apenas o Vite em `http://localhost:1420`, útil para trabalhar só na interface do utilizador. A porta é fixa para que a webview do Tauri e o HMR usem um endereço previsível.

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
```

Em Ubuntu, `pnpm tauri build` gera `.deb` e AppImage. Em Windows, use `pnpm tauri build --config src-tauri/tauri.windows.conf.json` para gerar MSI e NSIS.

## Problemas frequentes

- A porta Vite 1420 está ocupada: pare o processo que a está a utilizar. O modo de porta estrita falha intencionalmente em vez de escolher outra porta.
- Erro de compilação WebKit/GTK em Ubuntu: instale as bibliotecas de desenvolvimento indicadas acima.
- Erro de compilação Windows relacionado com `link.exe`: confirme que a carga de trabalho C++ do Visual Studio Build Tools está instalada e que Rust usa a toolchain MSVC.
- Erro de dependência ou target Rust: execute `rustup show` e confirme que tem a toolchain stable e o target da plataforma instalados.
