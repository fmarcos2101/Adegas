/**
 * Segredo usado para assinar/verificar os JWTs de sessão.
 *
 * Não existe valor padrão: se `AUTH_SECRET` estiver ausente ou fraco, o
 * módulo lança um erro na inicialização e o processo (build/dev/start) é
 * encerrado. Um segredo fixo no código permitiria falsificar sessões de
 * qualquer usuário, inclusive do dono da plataforma.
 */
function loadAuthSecret(): string {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina uma variável de ambiente " +
        "AUTH_SECRET forte (>= 32 caracteres) antes de iniciar o sistema. " +
        'Gere um valor com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  if (value.length < 32) {
    throw new Error(
      "AUTH_SECRET muito curto (mínimo 32 caracteres). Gere um novo valor seguro.",
    );
  }
  return value;
}

export const AUTH_SECRET = loadAuthSecret();
export const AUTH_SECRET_BYTES = new TextEncoder().encode(AUTH_SECRET);
