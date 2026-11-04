# Releases

As releases seguem o SemVer (`MAJOR.MINOR.PATCH`), com o prefixo `v` nas tags Git. `MAJOR` representa alterações incompatíveis, `MINOR` novas funcionalidades compatíveis e `PATCH` correcções compatíveis.

A versão da aplicação está definida em `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`. Mantenha os três valores iguais. Antes de criar uma tag, actualize os três ficheiros no mesmo commit e confirme que não há divergências; a CI rejeita versões diferentes.

## Passo a passo

### 1. Actualizar a versão

Edite os três ficheiros no mesmo commit e use Conventional Commits, por exemplo `chore: actualizar versão para 1.0.0`. Confirme o resultado:

```bash
node -e 'const fs=require("fs"); console.log(require("./package.json").version, fs.readFileSync("src-tauri/Cargo.toml","utf8").match(/^version = "([^"]+)"/m)[1], require("./src-tauri/tauri.conf.json").version)'
```

As três saídas têm de ser iguais.

### 2. Integrar em `main`

Integre as alterações revistas da branch de desenvolvimento em `main` através de um pull request e espere a CI ficar verde (`frontend quality`, `rust quality` e `build validation` em Ubuntu e Windows). Pushes sem tag não publicam releases.

### 3. Executar as verificações localmente

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all
```

### 4. Criar a tag no commit de `main`

```bash
git checkout main && git pull origin main
git tag -a v1.0.0 -m "Release 1.0.0"
```

A tag tem de ter exactamente o formato `vMAJOR.MINOR.PATCH`, sem zeros à esquerda nem sufixos: o workflow rejeita `v01.0.0` e `v1.0.0-rc1`.

### 5. Enviar `main` e a tag

```bash
git push origin main
git push origin v1.0.0
```

### 6. Acompanhar o workflow da tag

O push de uma tag `v*` dispara o workflow `.github/workflows/release.yml`:

- Job `release`, em matriz: `ubuntu-24.04` usa `src-tauri/tauri.conf.json` e `windows-latest` usa `src-tauri/tauri.windows.conf.json`.
- Em Ubuntu, valida o formato SemVer da tag e que as três versões coincidem com a tag.
- Executa as verificações de qualidade do frontend e do Rust.
- Compila os instaladores em runners nativos: `.deb` e `.AppImage` em Ubuntu, `.msi` e NSIS em Windows.
- Job `publish`, depois de ambos os jobs de compilação passarem: cria a GitHub Release com notas geradas e anexa os instaladores.

### 7. Verificar a publicação

- Actions: o workflow **Release** verde para a tag.
- Releases: a versão publicada com as notas e os instaladores anexados.
- Descarregue e instale um instalador de cada plataforma como teste final.

### 8. Corrigir falhas

Se o workflow falhar antes do job `publish`, nada é publicado. Apague a tag, corrija e repita os passos 4 e 5:

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

Se a GitHub Release já estiver publicada, não reutilize a tag: corrija e corte uma nova versão `PATCH`.

## Pré-condições no repositório

Pushes sem uma tag `v*` não publicam releases. O workflow de release requer que GitHub Actions e GitHub Releases estejam activos no repositório, e em Settings → Actions → General as permissões do `GITHUB_TOKEN` têm de ser _Read and write_ para o job `publish` criar a release.
