// Integracion con API externa (Open Trivia Database) para complementar
// los retos de tipo "trivia" con una pregunta adicional cuando se requiera.
// Documentacion: https://opentdb.com/api_config.php

export interface PreguntaExterna {
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string;
}

// decodeHTMLEntities: la API devuelve texto con entidades HTML (&quot; &amp; etc).
function decodificarEntidades(texto: string): string {
  const entidades: Record<string, string> = {
    quot: '"', apos: "'", '#039': "'", amp: '&', lt: '<', gt: '>',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  };
  return texto.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (coincidencia, entidad: string) => {
    if (entidades[entidad]) return entidades[entidad];
    if (entidad.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entidad.slice(2), 16));
    if (entidad.startsWith('#')) return String.fromCodePoint(Number.parseInt(entidad.slice(1), 10));
    return coincidencia;
  });
}

// Consulta una pregunta de opcion multiple de cultura general/ciencia.
export async function obtenerPreguntaTriviaExterna(
  categoria?: number
): Promise<PreguntaExterna> {
  const url =
    `https://opentdb.com/api.php?amount=1&type=multiple` +
    (categoria ? `&category=${categoria}` : '');

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 10000);
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { signal: controlador.signal });
  } catch {
    throw new Error('La trivia externa no está disponible. Inténtalo nuevamente.');
  } finally {
    clearTimeout(temporizador);
  }
  if (!respuesta.ok) throw new Error('No se pudo obtener la pregunta externa.');

  const datos = await respuesta.json();
  if (datos.response_code !== 0) throw new Error('La API externa no encontró una pregunta disponible.');
  const item = datos.results?.[0];
  if (!item) {
    throw new Error('La API no devolvio preguntas.');
  }

  const opciones = [...item.incorrect_answers, item.correct_answer]
    .map(decodificarEntidades)
    .sort(() => Math.random() - 0.5);

  return {
    enunciado: decodificarEntidades(item.question),
    opciones,
    respuestaCorrecta: decodificarEntidades(item.correct_answer),
  };
}
