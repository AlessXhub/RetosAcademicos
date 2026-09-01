import assert from 'node:assert/strict';
import test from 'node:test';
import { esCorreoValido, validarContrasena } from '../lib/validaciones';

test('valida correos electrónicos', () => {
  assert.equal(esCorreoValido('estudiante@colegio.edu'), true);
  assert.equal(esCorreoValido('correo-incompleto'), false);
});

test('rechaza contraseñas débiles', () => {
  assert.match(validarContrasena('corta1') ?? '', /8 caracteres/);
  assert.match(validarContrasena('sololetras') ?? '', /número/);
  assert.equal(validarContrasena('Aprender2026'), null);
});
