/** @format */

import type { Metadata } from 'next';
import { BibliotecaImagenes } from '@/modules/administre/imagenes';

export const metadata: Metadata = { title: 'Biblioteca de imágenes' };

/** Imágenes propias para correos: se cargan en el cliente (la misma biblioteca se abre dentro del editor). */
export default function ImagenesEmailPage() {
  return <BibliotecaImagenes modo='administrar' />;
}
