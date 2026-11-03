import { readFileSync } from "node:fs";

const message = readFileSync(process.argv[2], "utf8").trim();
const conventional =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([\w.-]+\))?!?: .+/;

if (!conventional.test(message)) {
  console.error(
    "Commit subject must follow Conventional Commits, e.g. 'feat: add project scanner'.",
  );
  process.exit(1);
}
