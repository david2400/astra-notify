"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable as SharedDataTable } from "@repo/ui/table";
import { cn } from "@repo/ui/utils";
import { EmptyState } from "@/components/feedback/empty-state";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  headerTable?: () => ReactNode;
  className?: string;
  /** Título del estado vacío; si se omite se usa un texto genérico. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Acción sugerida cuando no hay datos (normalmente "crear el primero"). */
  emptyAction?: ReactNode;
}

/**
 * Envoltura local de la tabla compartida `@repo/ui/table`.
 *
 * Añade dos cosas que la tabla compartida no cubre y que afectan a todas las
 * pantallas de listado de la app:
 *
 *  1. Estado vacío. Con cero registros la tabla sólo pintaba la fila de
 *     encabezados, sin explicar qué ocurría.
 *  2. Comportamiento responsive. La tabla usa `w-full`, así que en móvil las
 *     columnas se comprimían hasta ser ilegibles. Aquí se le fija un ancho
 *     mínimo y se permite el desplazamiento horizontal.
 *
 * Las dos utilidades con selector descendente existen porque este paquete se
 * comparte con otras aplicaciones del monorepo y no se puede modificar desde
 * aquí. Recomendación: mover ambos comportamientos a `@repo/ui/table` cuando
 * se pueda coordinar el cambio con `libra` y `portal_clientes`.
 */
export function DataTable<T>({
  data,
  columns,
  headerTable,
  className,
  emptyTitle = "Todavía no hay registros",
  emptyDescription = "Cuando se cree el primer registro aparecerá en esta tabla.",
  emptyAction,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {headerTable ? headerTable() : null}
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full [&_.overflow-hidden]:overflow-x-auto [&_table]:min-w-[44rem]",
        className,
      )}>
      <SharedDataTable
        data={data}
        columns={columns as ColumnDef<unknown>[]}
        headerTable={headerTable}
      />
    </div>
  );
}
