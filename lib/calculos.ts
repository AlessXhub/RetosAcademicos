export function calcularPorcentaje(aciertos: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (aciertos / total) * 100));
}

export function calcularNivel(puntosTotales: number) {
  return Math.floor(Math.max(0, puntosTotales) / 100) + 1;
}

export function limitarPuntos(puntos: number, puntosMaximos: number) {
  return Math.max(0, Math.min(puntos, Math.max(0, puntosMaximos)));
}

export function normalizarRespuesta(respuesta: string) {
  return respuesta.trim().toLocaleLowerCase('es');
}

export function siguienteEnteroPositivo(valores: readonly number[]) {
  return valores.reduce(
    (maximo, valor) => Number.isInteger(valor) && valor > maximo ? valor : maximo,
    0
  ) + 1;
}
