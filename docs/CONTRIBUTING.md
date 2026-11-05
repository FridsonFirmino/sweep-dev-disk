# Contribuir

Obrigado por querer contribuir com o SweepDevDisk. Este guia descreve o fluxo esperado e as boas práticas para contribuir em projectos open source. Ao participar, concorda em cumprir o [Código de Conduta](../CODE_OF_CONDUCT.md).

## Fluxo de contribuição

1. **Abra uma issue** — antes de escrever código, abra uma issue que descreva o bug ou a funcionalidade proposta. Para bugs, inclua os passos de reprodução, o sistema operativo e a versão; para funcionalidades, explique o problema que resolve. Pesquise primeiro issues abertas para evitar duplicados.
2. **Solicite a implementação** — comente na issue a pedir para a implementar e aguarde a aprovação de um mantenedor antes de começar. Issues marcadas como `good first issue` ou `help wanted` estão abertas a qualquer contribuidor.
3. **Faça o fork e clone o repositório** — faça fork no GitHub e clone o seu fork, adicionando o repositório original como `upstream`:
   ```bash
   git clone https://github.com/<seu-utilizador>/sweep-dev-disk.git
   cd sweep-dev-disk
   git remote add upstream https://github.com/FridsonFirmino/sweep-dev-disk.git
   ```
4. **Crie a branch a partir de `develop`** — sincronize-se com o upstream e crie uma branch de curta duração:
   ```bash
   git fetch upstream
   git checkout -b <tipo>/<nome-curto> upstream/develop
   ```
5. **Prepare o ambiente** — siga as instruções de [DEVELOPMENT.md](DEVELOPMENT.md), instale as dependências com `pnpm install --frozen-lockfile` e confirme que a aplicação arranca com `pnpm tauri dev`.
6. **Implemente as alterações** — mantenha cada pull request focado num único tema, acrescente ou ajuste testes para o comportamento introduzido e actualize a documentação afectada.
7. **Commite com Conventional Commits** — o Husky verifica a formatação e o lint dos ficheiros preparados e valida o assunto do commit:
   ```bash
   git add <ficheiros>
   git commit -m "feat: adicionar scanner de projectos"
   ```
8. **Verifique a qualidade** — antes de enviar, execute as [verificações de qualidade](#código-e-testes).
9. **Envie a branch e abra o pull request** — faça push para o seu fork e abra um PR dirigido a `develop`:
   ```bash
   git push -u origin <tipo>/<nome-curto>
   ```
10. **Revisão** — responda aos comentários, faça os ajustes pedidos e aguarde a aprovação e a CI verde. Após a aprovação, um mantenedor integra a alteração.

## Branches e nomenclatura

Crie branches de curta duração sempre a partir de `develop`, com os prefixos `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `test/*` ou `chore/*`, seguidos de um nome em minúsculas separado por hífen, por exemplo `feature/artifact-catalog`. Não trabalhe directamente em `develop` nem em `main`.

Para actualizar a branch com as alterações mais recentes do `develop`:

```bash
git fetch upstream
git rebase upstream/develop
```

Faça o rebase apenas na sua branch de contribuição e faça o push com `--force-with-lease` se o histórico local foi reescrito.

## Commits

Use Conventional Commits, por exemplo `feat: adicionar scanner de projectos`, `fix: corrigir cálculo do espaço`, `docs: actualizar guia de desenvolvimento` ou `chore: configurar workflows`. O assunto deve ser imperativo, conciso e em minúsculas; inclua o corpo apenas quando a mudança precisar de contexto adicional.

## Código e testes

Mantenha o TypeScript em modo strict; evite `any` sem uma justificação documentada. Mantenha os módulos Rust focados e não adicione permissões alargadas para o sistema de ficheiros. Acrescente testes específicos para o comportamento introduzido. Quando aplicável, execute o lint, a formatação, a verificação de tipos e o Vitest no frontend, bem como o Rustfmt, o Clippy e os testes Cargo:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all
```

## Pull requests

Abra um PR dirigido a `develop` (nunca directamente a `main`) e preencha a checklist do repositório:

- Título claro em Conventional Commits e motivação, impacto e plano de testes na descrição.
- Associe a issue relacionada, por exemplo com `Closes #12`.
- Inclua capturas de ecrã para alterações na interface.
- Mantenha o PR limitado a um único tema; não inclua segredos, artefactos de compilação nem alterações sem relação com o pedido.
- A CI tem de passar e os mantenedores têm de rever as alterações antes da integração.

PRs em rascunho (`draft`) são bem-vindos para obter feedback precoce. Se o PR estiver associado a uma issue, comente lá quando estiver pronto para revisão.

## Problemas de segurança

Reporte problemas através dos formulários de issue. Para problemas de segurança, siga as instruções de [SECURITY.md](SECURITY.md) e não abra uma issue pública.
