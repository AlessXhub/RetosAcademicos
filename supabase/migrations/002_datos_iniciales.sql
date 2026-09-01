insert into public.asignaturas (nombre, descripcion) values
  ('Matemáticas', 'Razonamiento numérico, álgebra y geometría.'),
  ('Ciencias Naturales', 'Biología, química, física y medio ambiente.'),
  ('Lenguaje y Literatura', 'Comprensión lectora, gramática y literatura.'),
  ('Estudios Sociales', 'Historia, geografía y ciudadanía.'),
  ('Inglés', 'Vocabulario, lectura y estructuras básicas.'),
  ('Informática', 'Tecnología, lógica y ciudadanía digital.'),
  ('Arte', 'Expresión artística, música y cultura.'),
  ('Educación Física', 'Salud, deporte y hábitos activos.')
on conflict (nombre) do nothing;

insert into public.insignias (nombre, descripcion, criterio_obtencion, puntos_requeridos) values
  ('Primer paso', 'Primera recompensa de aprendizaje.', 'Alcanzar 10 puntos.', 10),
  ('Constancia', 'Reconoce el avance continuo.', 'Alcanzar 100 puntos.', 100),
  ('Experto académico', 'Dominio destacado de los retos.', 'Alcanzar 500 puntos.', 500)
on conflict (nombre) do nothing;
