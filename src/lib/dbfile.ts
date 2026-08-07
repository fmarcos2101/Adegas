import path from "node:path";

export function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = url.replace(/^file:/, "");
  return path.isAbsolute(relative)
    ? relative
    : // O caminho do banco é sempre relativo ao diretório do projeto (nunca
      // vem de entrada do usuário), então é seguro pedir ao bundler para não
      // rastrear todo o projeto por causa deste path.join dinâmico.
      path.join(/* turbopackIgnore: true */ process.cwd(), relative);
}
