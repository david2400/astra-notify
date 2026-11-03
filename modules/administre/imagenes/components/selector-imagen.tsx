/** @format */

'use client';

import { useState } from 'react';
import { HiOutlinePhoto } from 'react-icons/hi2';
import { Modal } from '@repo/ui/modals/scenes';
import type { IImagen } from '@/server/domains/administre/imagenes/types';
import { BibliotecaImagenes } from './biblioteca-imagenes';

/** Botón "Biblioteca" junto a un campo de URL: abre la biblioteca y devuelve la imagen elegida. */
export function BotonElegirImagen({ onElegir, texto = 'Biblioteca', className }: { onElegir: (img: IImagen) => void; texto?: string; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type='button'
        onClick={() => setAbierto(true)}
        title='Elegir o subir una imagen de la biblioteca'
        className={
          className ??
          'inline-flex shrink-0 items-center gap-1 rounded-lg border border-input px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        }>
        <HiOutlinePhoto className='h-4 w-4' /> {texto}
      </button>
      <Modal size='xl' title='Biblioteca de imágenes' open={abierto} onOpenChange={setAbierto} hideDefaultFooter>
        {abierto ? (
          <BibliotecaImagenes
            modo='seleccionar'
            onSeleccionar={(img) => {
              setAbierto(false);
              onElegir(img);
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}
