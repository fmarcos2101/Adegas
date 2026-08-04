"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#171717" }}>
            Ocorreu um erro inesperado
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#737373" }}>
            Isso pode acontecer se o sistema foi atualizado enquanto esta
            página estava aberta. Recarregue a página para continuar.
          </p>
          {error.digest ? (
            <p style={{ marginTop: 8, fontSize: 12, color: "#a3a3a3" }}>
              Código: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: "#db2777",
                color: "#fff",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Recarregar página
            </button>
            <button
              onClick={() => unstable_retry()}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "1px solid #d4d4d4",
                background: "#fff",
                color: "#171717",
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
