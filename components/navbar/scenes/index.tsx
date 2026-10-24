"use client";

import * as React from "react";
import { BiMenu, BiLogOut } from "react-icons/bi";
import { MenuModal } from "@repo/ui/modals/scenes/menu/menuModal";
import { Buttons } from "@repo/ui/buttons/scenes/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/menu/scenes/dropdown-menu";
import { Avatar, AvatarFallback } from "@repo/ui/avatar/scenes/avatar";
import { cn } from "@repo/ui/utils";
import { ContextoMenu } from "./contexto-menu";
import { cerrarSesion, usuarioActual, type IUsuarioActual } from "@/server/domains/auth/contexto";
import { Link, usePathname } from "@/shared/i18n/routing";
import { NAV_ITEMS, type NavItem } from "@/shared/navegacion";

// El menu (rutas, iconos y textos) vive en shared/navegacion.ts: lo usan esta barra y la pagina de inicio.

const linkClasses =
  "group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-border/70 hover:bg-background/80 hover:text-foreground";
const activeLinkClasses =
  "border-border/70 bg-background text-foreground shadow-sm";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon,
  onNavigate,
  active,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  onNavigate?: () => void;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(linkClasses, active && activeLinkClasses)}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const options = item.options ?? [];
  const groupActive = options.some((option) => isActive(pathname, option.href));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label={item.label}
          className={cn(
            linkClasses,
            "data-[state=open]:border-border/70 data-[state=open]:bg-background/80 data-[state=open]:text-foreground",
            groupActive && activeLinkClasses,
          )}>
          <item.icon className='h-4 w-4' aria-hidden='true' />
          <span>{item.label}</span>
          <span aria-hidden='true' className='text-muted-foreground/80'>
            ▾
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' sideOffset={8} className='min-w-[14rem] p-2'>
        {options.map((option) => {
          const active = isActive(pathname, option.href);
          return (
            <DropdownMenuItem key={option.href} asChild className='px-3 py-2'>
              <Link
                href={option.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg text-sm no-underline",
                  active && "font-semibold text-foreground",
                )}>
                {option.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavList({
  orientation = "horizontal",
  onNavigate,
  pathname,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
  pathname: string;
}) {
  const baseClasses =
    orientation === "vertical"
      ? "flex flex-col gap-1"
      : "flex flex-row items-center gap-1";

  return (
    <ul className={cn("relative z-40", baseClasses)}>
      {NAV_ITEMS.map((item) => (
        <li key={item.label}>
          {item.options?.length ? (
            <NavGroup item={item} pathname={pathname} onNavigate={onNavigate} />
          ) : (
            <NavLink
              href={item.href ?? "/"}
              label={item.label}
              icon={<item.icon className='h-4 w-4' aria-hidden='true' />}
              onNavigate={onNavigate}
              active={isActive(pathname, item.href ?? "/")}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Iniciales para el avatar: "Ana Prueba" -> "AP", "demo" -> "DE". */
function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
  return (partes[0] ?? "?").slice(0, 2).toUpperCase();
}

function ProfileMenu() {
  const [usuario, setUsuario] = React.useState<IUsuarioActual | null>(null);
  const [saliendo, startSalir] = React.useTransition();

  React.useEffect(() => {
    let vivo = true;
    usuarioActual()
      .then((u) => {
        if (vivo) setUsuario(u);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  const nombre = usuario?.nombre ?? "Usuario";
  const contexto = [usuario?.empresa, usuario?.aplicacion].filter(Boolean).join(" · ");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Buttons
          variant='ghost'
          size='icon'
          aria-label={`Abrir menú de la cuenta de ${nombre}`}
          className='rounded-full border border-transparent p-0 transition hover:border-border/70'>
          <Avatar className='h-10 w-10 border border-border/70 shadow-sm shadow-primary/30'>
            <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
              {iniciales(nombre)}
            </AvatarFallback>
          </Avatar>
        </Buttons>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64 p-2' align='end'>
        <div className='flex items-center gap-3 px-3 py-2'>
          <Avatar className='h-10 w-10 border border-border/70'>
            <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
              {iniciales(nombre)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-foreground'>{nombre}</p>
            {usuario?.usuario && usuario.usuario !== nombre && (
              <p className='truncate text-xs text-muted-foreground'>@{usuario.usuario}</p>
            )}
            {contexto && <p className='truncate text-xs text-muted-foreground'>{contexto}</p>}
          </div>
        </div>
        {usuario?.roles?.length ? (
          <div className='flex flex-wrap gap-1 px-3 pb-2'>
            {usuario.roles.map((rol) => (
              <span
                key={rol}
                className='rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground'>
                {rol}
              </span>
            ))}
          </div>
        ) : null}
        <DropdownMenuSeparator className='my-2' />
        <ContextoMenu />
        <DropdownMenuItem
          className='rounded-lg px-3 py-2 text-sm text-destructive focus:text-destructive'
          disabled={saliendo}
          onSelect={(e) => {
            // Se deja el menu abierto mientras se cierra la sesion (muestra "Cerrando sesión…").
            e.preventDefault();
            startSalir(() => cerrarSesion());
          }}>
          <BiLogOut className='mr-2 h-4 w-4' aria-hidden='true' />
          {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Nav() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70'>
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground'>
        Saltar al contenido
      </a>

      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6'>
        <Link
          href='/'
          className='text-lg font-semibold tracking-tight text-foreground'>
          Astra Notify
        </Link>

        <nav aria-label='Navegación principal' className='hidden lg:flex'>
          <NavList pathname={pathname} />
        </nav>

        <div className='flex items-center gap-4'>
          <div className='lg:hidden'>
            <Buttons
              variant='ghost'
              size='icon'
              aria-label='Abrir menú principal'
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}>
              <BiMenu className='h-6 w-6' aria-hidden='true' />
            </Buttons>
          </div>

          <ProfileMenu />
        </div>
      </div>

      <MenuModal
        placement='left'
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        className='w-80'
        title='Menú principal'>
        <nav aria-label='Navegación principal' className='flex flex-col gap-3 py-2'>
          <NavList
            orientation='vertical'
            pathname={pathname}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </nav>
      </MenuModal>
    </header>
  );
}
