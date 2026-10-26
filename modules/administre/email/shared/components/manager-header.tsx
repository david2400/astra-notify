/** @format */

'use client';

import type { ReactNode } from 'react';
import { HiOutlinePlusCircle } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';

interface ManagerHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Texto del botón principal (crear). Sin texto no se muestra. */
  actionLabel?: string;
  onAction?: () => void;
  /** Buscador local sobre la tabla. */
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  /** Filtros extra a la derecha del buscador. */
  filters?: ReactNode;
}

/** Encabezado común de cada pantalla de administración: título, botón crear, buscador y filtros. */
export function ManagerHeader({ icon, title, description, actionLabel, onAction, search, filters }: ManagerHeaderProps) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div className='rounded-2xl bg-primary/10 p-3 text-primary'>{icon}</div>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>{title}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
          </div>
        </div>
        {actionLabel && onAction ? (
          <Buttons className='inline-flex items-center gap-2' onClick={onAction}>
            <HiOutlinePlusCircle className='h-4 w-4' />
            {actionLabel}
          </Buttons>
        ) : null}
      </div>

      {search || filters ? (
        <div className='flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 md:flex-row md:items-end'>
          {search ? (
            <div className='w-full max-w-md space-y-1.5'>
              <Label htmlFor='admin-search'>Buscar</Label>
              <Input
                id='admin-search'
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder}
              />
            </div>
          ) : null}
          {filters}
        </div>
      ) : null}
    </div>
  );
}
