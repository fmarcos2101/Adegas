import path from "node:path";

export function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = url.replace(/^file:/, "");
  return path.isAbsolute(relative)
    ? relative
    : path.join(process.cwd(), relative);
}
