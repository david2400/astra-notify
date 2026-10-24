/** @format */

import { BiMessageSquareDetail } from 'react-icons/bi';
import { EmptyState } from '@/components/feedback/empty-state';

/** Estado inicial mientras no hay envíos (o aún no se conecta el backend). */
export function EnviosVacio() {
  return (
    <EmptyState
      icon={<BiMessageSquareDetail className='size-8' />}
      title='Todavía no hay envíos'
      description='Cuando se conecte el gateway de notificaciones, aquí verás cada SMS, WhatsApp o correo con su estado.'
    />
  );
}
