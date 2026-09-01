// Tipos TypeScript que reflejan las tablas de la base de datos (Supabase)
// Documentar los tipos aqui evita repetir interfaces en cada pantalla.

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string | null;
  foto_url: string | null;
  rol: 'estudiante' | 'administrador';
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

export interface ProgresoGlobal {
  id: number;
  usuario_id: string;
  puntos_totales: number;
  nivel_actual: number;
  porcentaje_progreso: number;
  racha_actual: number;
  racha_maxima: number;
  fecha_ultimo_acceso: string | null;
}

export interface RankingGlobal {
  id: number;
  usuario_id: string;
  puntos_totales: number;
  posicion: number | null;
  fecha_actualizacion: string;
}

export interface Notificacion {
  id: number;
  usuario_id: string;
  tipo: 'nuevo_reto' | 'felicitacion_logro' | 'alerta_racha_riesgo' | 'recordatorio_estudio';
  titulo: string;
  mensaje: string;
  fecha_programada: string;
  fecha_envio: string | null;
  leida: boolean;
}

export interface Asignatura {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
  estado: 'activo' | 'inactivo';
}

export interface Nivel {
  id: number;
  asignatura_id: number;
  numero_nivel: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  estado: 'activo' | 'inactivo';
}

export interface Reto {
  id: number;
  nivel_id: number;
  titulo: string;
  descripcion: string | null;
  tipo: 'quiz' | 'verdadero_falso' | 'trivia' | 'desafio_reloj';
  puntos_maximos: number;
  orden: number;
  estado: 'activo' | 'inactivo';
  fecha_creacion: string;
}

export interface ContenidoMultimedia {
  id: number;
  asignatura_id: number;
  nivel_id: number | null;
  tipo: 'video' | 'imagen' | 'texto' | 'pdf';
  titulo: string;
  descripcion: string | null;
  url_recurso: string;
  orden: number;
  estado: 'activo' | 'inactivo';
}

export interface Pregunta {
  id: number;
  reto_id: number;
  enunciado: string;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'completar';
  puntos: number;
  orden: number;
  respuesta_esperada: string | null;
  estado: 'activo' | 'inactivo';
}

export interface OpcionRespuesta {
  id: number;
  pregunta_id: number;
  texto_opcion: string;
  es_correcta: boolean;
  orden: number;
}

export interface IntentoReto {
  id: number;
  usuario_id: string;
  reto_id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  puntos_obtenidos: number;
  porcentaje: number | null;
  estado: 'en_progreso' | 'completado' | 'abandonado';
}

export interface RespuestaUsuario {
  id: number;
  intento_id: number;
  pregunta_id: number;
  opcion_id: number | null;
  respuesta_texto: string | null;
  es_correcta: boolean | null;
  puntos_obtenidos: number;
}

export interface Insignia {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
  criterio_obtencion: string;
  puntos_requeridos: number | null;
  estado: 'activo' | 'inactivo';
}

export interface UsuarioInsignia {
  id: number;
  usuario_id: string;
  insignia_id: number;
  fecha_obtenida: string;
}
