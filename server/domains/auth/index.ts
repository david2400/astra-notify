import "server-only";
import { auth } from "@/auth";

export interface ICurrentUser {
  id: number;
  username: string;
  companyId: number | null;
  userType?: string;
  roles: string[];
}

/**
 * Usuario autenticado en la sesión actual (next-auth), leído del lado del
 * servidor. Antes era un stub que siempre devolvía null; ahora lee la
 * sesión real que arma auth.ts a partir del login contra access_control.
 */
export const getCurrentUser = async (): Promise<ICurrentUser | null> => {
  const session = await auth();
  if (!session?.user) return null;

  const id = Number(session.user.id);
  if (!id || Number.isNaN(id)) return null;

  return {
    id,
    username: session.user.name ?? "",
    companyId: session.user.companyId ?? null,
    userType: session.user.userType,
    roles: session.user.roles ?? [],
  };
};
