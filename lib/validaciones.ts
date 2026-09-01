export function esCorreoValido(correo: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    return 'La contraseña debe incluir letras y al menos un número.';
  }
  return null;
}

export function mensajeErrorRegistro(mensaje: string) {
  const normalizado = mensaje.toLowerCase();
  if (normalizado.includes('already') || normalizado.includes('registered')) {
    return 'Ya existe una cuenta asociada a este correo.';
  }
  if (normalizado.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.';
  if (normalizado.includes('email')) return 'El correo electrónico no es válido.';
  return 'No se pudo crear la cuenta. Revisa tu conexión e inténtalo nuevamente.';
}
