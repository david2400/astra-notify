/** @format */

import { BiMessageSquareDetail } from 'react-icons/bi';
import { EmptyState } from '@/components/feedback/empty-state';

/** Sin resultados para los filtros actuales. */
export function EnviosVacio({ canal = 'SMS' }: { canal?: string }) {
  return (
    <EmptyState
      icon={<BiMessageSquareDetail className='size-8' />}
      title={`No hay envíos de ${canal}`}
      description='Ajusta los filtros o realiza un envío desde las pestañas Enviar SMS o Enviar correo.'
    />
  );
}
