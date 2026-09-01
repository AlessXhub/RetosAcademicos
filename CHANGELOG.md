# Cambios realizados

## Unificación de vistas

- Se integró la nueva interfaz visual en inicio, asignaturas, desafíos, ranking, logros y perfil.
- Se centralizó la paleta en `lib/colores.ts` y la navegación inferior en un componente reutilizable.
- Se eliminó el acceso y la vista independiente de contenido de asignatura; cada materia abre únicamente sus desafíos.
- Se agregó edición de nombre, usuario y foto de perfil con Expo Image Picker y Supabase Storage.
- Se agregó la migración `003_perfil_avatar.sql` con el bucket, RLS y una función segura de actualización.

## Correcciones funcionales

- Se corrigió el arranque con una sesión persistente para redirigir siempre a inicio.
- Se centralizaron sesión, perfil y rol en `AuthContext`.
- Se protegieron todas las rutas `/admin/*` mediante un layout administrativo.
- Se separaron preferencias de notificación por usuario.
- Se corrigió la solicitud de permisos y creación del canal Android.
- Se evita duplicar recordatorios y se cancelan al desactivarlos.
- Se añadieron las dependencias nativas requeridas por Expo Router y Reanimated.
- Se registró el plugin de Expo Notifications.
- Se añadieron validaciones de correo, contraseña débil y cuenta existente.

## Retos y gamificación

- Un reto requiere 60% para aprobar.
- Un intento reprobado no entrega puntos ni desbloquea contenido.
- Solo la primera aprobación entrega puntos.
- Los puntos quedan limitados por `puntos_maximos`.
- Se recalculan nivel global, progreso, racha, ranking e insignias.
- Se impide el doble envío de respuestas y se muestran errores de persistencia.
- La finalización puede ejecutarse mediante la función transaccional `finalizar_reto`.
- La finalización exige la función SQL transaccional incluida en las migraciones; ya no existe una ruta cliente menos segura.

## Datos, API y contenido

- Se agregó un esquema completo de Supabase con relaciones, RLS y trigger de registro.
- Se agregaron ocho asignaturas e insignias iniciales.
- Se añadieron imagen, video, texto y PDF al administrador de contenido.
- El contenido puede asociarse a toda una asignatura o a un nivel.
- El material de toda la asignatura aparece también dentro de cada uno de sus niveles.
- El ranking y el perfil calculan la posición con el mismo orden, sin depender de una columna obsoleta.
- Los retos aprobados pueden volver a abrirse en modo práctica.
- La API externa ahora tiene tiempo máximo de espera, validación de respuesta y mejor decodificación HTML.

## Calidad y documentación

- Se agregó `.env.example` y se protegió `.env` en `.gitignore`.
- Se añadieron scripts de TypeScript, pruebas y Expo Doctor.
- Se añadieron pruebas unitarias para nivel, porcentaje, límites de puntos, correo y contraseña.
- Se crearon README, explicación técnica y manuales.

## Archivos principales modificados

- `app/_layout.tsx`, `app/admin/_layout.tsx`
- `app/reto/[id].tsx`, `app/resultado/[id].tsx`
- `context/AuthContext.tsx`, `context/ProgresoContext.tsx`
- `lib/gamificacion.ts`, `lib/notificaciones.ts`, `lib/api-trivia.ts`
- `supabase/migrations/*.sql`
- `package.json`, `app.json`, `.gitignore`

## Pendiente fuera del código

- Aplicar las migraciones SQL al Supabase remoto.
- Probar login, RLS y notificaciones con cuentas y dispositivos reales.
