import { limitarPuntos } from './calculos';
import { supabase } from './supabase';
import { Insignia, Reto } from './tipos';

export const PORCENTAJE_APROBACION = 60;

export interface ResultadoFinalizacion {
  aprobado: boolean;
  puntosOtorgados: number;
  puntosTotales: number;
  porcentajeGeneral: number;
  nivelActual: number;
  rachaActual: number;
  insigniasNuevas: Insignia[];
  nivelDesbloqueado: string | null;
}

interface ParametrosFinalizacion {
  intentoId: number;
  reto: Reto;
  puntos: number;
  aciertos: number;
  totalPreguntas: number;
}

function esFuncionNoDisponible(codigo?: string) {
  return codigo === 'PGRST202' || codigo === '42883';
}

export async function finalizarRetoSeguro(parametros: ParametrosFinalizacion) {
  const { data, error } = await supabase.rpc('finalizar_reto', {
    p_intento_id: parametros.intentoId,
    p_puntos_externos: limitarPuntos(parametros.puntos, parametros.reto.puntos_maximos),
    p_aciertos_externos: parametros.aciertos,
    p_total_externos: parametros.totalPreguntas,
  });

  if (error) {
    if (esFuncionNoDisponible(error.code)) {
      throw new Error('La base de datos no tiene la función segura finalizar_reto. Aplica las migraciones de Supabase.');
    }
    throw new Error(error.message || 'No se pudo finalizar el reto.');
  }
  if (!data) throw new Error('La base de datos no devolvió el resultado del reto.');

  return data as ResultadoFinalizacion;
}
