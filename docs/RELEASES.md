# Releases

As releases seguem o SemVer (`MAJOR.MINOR.PATCH`), com o prefixo `v` nas tags Git. `MAJOR` representa alterações incompatíveis, `MINOR` novas funcionalidades compatíveis e `PATCH` correcções compatíveis.

A versão da aplicação está definida em `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`. Mantenha os três valores iguais. Antes de criar uma tag, actualize os três ficheiros no mesmo commit e confirme que não há divergências; a CI rejeita versões diferentes.

Para criar uma release:

1. Integre as alterações revistas em `main` e actualize os três campos de versão.
2. Crie e envie uma tag explícita, por exemplo: `git tag v1.0.0 && git push origin v1.0.0`.
3. O workflow da tag valida o SemVer e a consistência das versões, executa as verificações de qualidade e compila os instaladores em runners nativos: `.deb` e `.AppImage` em Ubuntu, `.msi` e NSIS em Windows. Depois publica uma GitHub Release com notas geradas e os artefactos anexados.
4. Reveja os ficheiros e as notas publicados.

Pushes sem uma tag `v*` não publicam releases. O workflow de release requer que GitHub Actions e GitHub Releases estejam activos no repositório.
