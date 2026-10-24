"use client";

import { useEffect } from "react";

/**
 * Último recurso: se activa cuando falla el layout raíz, por lo que debe
 * renderizar su propio <html>/<body> y no puede depender de los providers.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang='es'>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f5f7fb",
          color: "#252a35",
        }}>
        <main
          style={{ maxWidth: "32rem", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            La aplicación no pudo cargarse
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#5a6072" }}>
            Ocurrió un error inesperado. Reintenta la carga; si el problema
            persiste, avisa al equipo de soporte.
          </p>
          <button
            type='button'
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#4a7ceb",
              color: "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
