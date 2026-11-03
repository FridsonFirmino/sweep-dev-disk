# Contribuir

## Preparar o ambiente

Siga as instruções de [DEVELOPMENT.md](DEVELOPMENT.md), instale as dependências com `pnpm install --frozen-lockfile` e confirme que os comandos de qualidade passam antes de abrir um pull request.

## Branches e nomenclatura

Use `main` para integrar alterações revistas. Crie branches de curta duração com os prefixos `feature/*`, `fix/*`, `refactor/*`, `docs/*` ou `chore/*`; use palavras em minúsculas separadas por hífen.

## Commits

Use Conventional Commits, por exemplo `feat: adicionar scanner de projectos`, `fix: corrigir cálculo do espaço`, `docs: actualizar guia de desenvolvimento` ou `chore: configurar workflows`. O Husky verifica a formatação e o lint dos ficheiros preparados e valida o assunto do commit.

## Código e testes

Mantenha o TypeScript em modo strict; evite `any` sem uma justificação documentada. Mantenha os módulos Rust focados e não adicione permissões alargadas para o sistema de ficheiros. Acrescente testes específicos para o comportamento introduzido. Quando aplicável, execute o lint, a formatação, a verificação de tipos e o Vitest no frontend, bem como o Rustfmt, o Clippy e os testes Cargo.

## Pull requests e revisão

Abra um PR dirigido a `main`, explique a motivação e o impacto, associe as issues relacionadas, inclua capturas de ecrã para alterações na interface e preencha a checklist do repositório. A CI tem de passar e os responsáveis pela manutenção têm de rever as alterações antes da integração. Não inclua segredos, resultados de compilação nem alterações sem relação com o pedido.

Reporte problemas através dos formulários de issue. Para problemas de segurança, siga [SECURITY.md](SECURITY.md).
