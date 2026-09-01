# Manual de usuario y administrador

## Manual del estudiante

### Crear una cuenta

1. Abrir la aplicación y seleccionar **Crear cuenta**.
2. Escribir nombre, apellido, correo y una contraseña de ocho caracteres o más con letras y números.
3. Abrir el correo de confirmación enviado por Supabase.
4. Confirmar la cuenta y volver al inicio de sesión.

### Completar un reto

1. Seleccionar una asignatura.
2. Abrir un nivel desbloqueado.
3. Revisar el material disponible.
4. Seleccionar un reto y responder todas las preguntas.
5. Obtener al menos 60% para aprobar.

Los puntos se entregan una sola vez por reto aprobado. Las repeticiones sirven como práctica. Al aprobar todos los retos de un nivel se desbloquea el siguiente.

### Consultar progreso

- **Perfil:** nivel, puntos, racha, retos e insignias.
- **Logros:** insignias obtenidas y pendientes.
- **Ranking:** posición relativa por puntos.
- **Notificaciones:** el interruptor del perfil activa o cancela recordatorios.

## Manual del administrador

### Obtener acceso

La cuenta debe tener `rol = 'administrador'` en `public.usuarios`. El cambio se realiza desde Supabase SQL Editor, no desde la aplicación.

### Administrar contenido

1. Entrar a **Perfil → Panel de administración**.
2. En **Asignaturas**, crear, activar, desactivar o eliminar asignaturas.
3. Tocar una asignatura para administrar sus niveles.
4. Entrar en un nivel para administrar retos.
5. Entrar en un reto para crear preguntas, opciones y marcar la respuesta correcta.
6. Usar el acceso multimedia para crear imágenes, videos, texto o PDF y asignarlos a toda la asignatura o a un nivel.

Se recomienda desactivar registros que ya tengan historial en lugar de eliminarlos.

### Insignias y progreso

- En **Insignias**, definir el nombre, criterio y puntos requeridos.
- En **Progreso**, corregir puntos únicamente cuando exista una justificación. La función actualiza también nivel y ranking.

## Lista de prueba manual

1. Registrar y confirmar una cuenta estudiante.
2. Cerrar y volver a abrir la app; debe entrar correctamente con la sesión persistente.
3. Reprobar un reto; no debe desbloquear ni entregar puntos.
4. Aprobarlo; debe entregar puntos.
5. Repetirlo; no debe volver a entregar puntos.
6. Completar todos los retos del nivel; debe desbloquear el siguiente.
7. Verificar perfil, ranking e insignias.
8. Activar y desactivar notificaciones en un dispositivo físico.
9. Intentar abrir `/admin` con un estudiante; debe regresar a inicio.
10. Entrar con administrador y probar cada operación CRUD.
