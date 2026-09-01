import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularNivel,
  calcularPorcentaje,
  limitarPuntos,
  normalizarRespuesta,
  siguienteEnteroPositivo,
} from '../lib/calculos';

test('calcula porcentaje y protege límites', () => {
  assert.equal(calcularPorcentaje(3, 5), 60);
  assert.equal(calcularPorcentaje(0, 0), 0);
  assert.equal(calcularPorcentaje(7, 5), 100);
});

test('cada 100 puntos incrementan el nivel global', () => {
  assert.equal(calcularNivel(0), 1);
  assert.equal(calcularNivel(99), 1);
  assert.equal(calcularNivel(100), 2);
  assert.equal(calcularNivel(500), 6);
});

test('los puntos nunca superan el máximo del reto', () => {
  assert.equal(limitarPuntos(80, 50), 50);
  assert.equal(limitarPuntos(-10, 50), 0);
  assert.equal(limitarPuntos(35, 50), 35);
});

test('normaliza respuestas escritas', () => {
  assert.equal(normalizarRespuesta('  San Salvador  '), 'san salvador');
});

test('calcula el siguiente orden aunque existan huecos', () => {
  assert.equal(siguienteEnteroPositivo([]), 1);
  assert.equal(siguienteEnteroPositivo([1, 3]), 4);
  assert.equal(siguienteEnteroPositivo([4, 2, 1]), 5);
});
