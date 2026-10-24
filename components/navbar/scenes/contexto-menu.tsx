"use client";

import * as React from "react";
import { BiBuildings, BiCheck } from "react-icons/bi";
import { DropdownMenuItem, DropdownMenuSeparator } from "@repo/ui/menu/scenes/dropdown-menu";
import { cambiarContexto, contextoActual, listarContextos, type IContexto } from "@/server/domains/auth/contexto";

/**
 * Empresas/aplicaciones del usuario dentro del menu de la cuenta. Elegir otra pide a
 * access_control un token para ese contexto (sin volver a pedir la contraseña). Solo
 * aparece con login OIDC y cuando hay mas de un contexto.
 */
export function ContextoMenu() {
  const [contextos, setContextos] = React.useState<IContexto[]>([]);
  const [actual, setActual] = React.useState<number | null>(null);
  const [cambiando, startTransition] = React.useTransition();

  React.useEffect(() => {
    let vivo = true;
    Promise.all([listarContextos(), contextoActual()]).then(([lista, id]) => {
      if (vivo) {
        setContextos(lista);
        setActual(id);
      }
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (contextos.length < 2) return null;

  return (
    <>
      <div className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">Empresa</div>
      {contextos.map((c) => {
        const esActual = c.user_application_id === actual;
        return (
          <DropdownMenuItem
            key={c.user_application_id}
            className="rounded-lg px-3 py-2 text-sm"
            disabled={esActual || cambiando}
            onSelect={() => startTransition(() => cambiarContexto(c.user_application_id))}>
            {esActual ? (
              <BiCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <BiBuildings className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            <span className="flex flex-col">
              <span>{c.company_name}</span>
              <span className="text-xs text-muted-foreground">{c.application_name}</span>
            </span>
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator className="my-2" />
    </>
  );
}
