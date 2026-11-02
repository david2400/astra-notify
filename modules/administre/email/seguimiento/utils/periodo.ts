/** @format */

/** Las métricas se agrupan por día en hora de Colombia (UTC-5). */
export const TZ_OFFSET = -300;

/** Últimos `dias` días hasta ahora, en ISO UTC. */
export const periodo = (dias: number) => {
  const hasta = new Date();
  return { desde: new Date(hasta.getTime() - dias * 86400000).toISOString(), hasta: hasta.toISOString() };
};
