# Explicación técnica para defensa

## Expo y navegación

Expo SDK 54 proporciona el entorno de ejecución, herramientas de desarrollo y módulos nativos. `expo-router/entry` inicia Expo Router, que construye la navegación a partir de la carpeta `app/` y utiliza React Navigation internamente.

Las carpetas dinámicas, como `app/reto/[id].tsx`, reciben el identificador por URL. `app/_layout.tsx` envuelve toda la aplicación y decide si el usuario debe ir al login o al inicio. `app/admin/_layout.tsx` verifica que el perfil tenga rol `administrador` antes de mostrar rutas administrativas.

## Autenticación

Supabase Auth administra correo, contraseña, sesión persistente y confirmación. `AuthContext` escucha cambios de sesión y carga el perfil de `public.usuarios`. El trigger `crear_perfil_usuario` crea automáticamente el perfil, progreso y ranking cuando aparece un usuario en `auth.users`.

Ocultar un botón no se considera seguridad. El layout protege la navegación y las políticas RLS protegen la base de datos incluso ante solicitudes manuales.

## Estado global

`AuthContext` contiene sesión, perfil y rol. `ProgresoContext` contiene progreso, insignias, retos aprobados y preferencias. Los datos académicos se consultan desde Supabase; las preferencias locales se guardan con AsyncStorage usando una clave distinta por usuario.

## Retos y puntaje

Al abrir un reto se crea un intento `en_progreso`. Cada respuesta se registra y al finalizar se ejecuta `finalizar_reto`:

1. Verifica que el intento pertenece al usuario autenticado.
2. Recalcula respuestas correctas y puntos.
3. Calcula el porcentaje.
4. Considera aprobado un resultado de 60% o más.
5. Entrega puntos únicamente en la primera aprobación.
6. Actualiza racha, nivel, porcentaje general y ranking.
7. Entrega insignias por umbral de puntos.
8. Desbloquea el siguiente nivel cuando todos los retos actuales están aprobados.

La función es transaccional: si una operación falla, PostgreSQL revierte el conjunto completo.

## Nivel, progreso y racha

- Nivel global: `floor(puntos_totales / 100) + 1`.
- Progreso: retos activos aprobados distintos dividido entre retos activos totales.
- Racha: aumenta si la última actividad fue ayer, se conserva si fue hoy y vuelve a uno si hubo más de un día de diferencia.

## Ranking

`ranking_global` conserva los puntos sincronizados. La pantalla ordena de mayor a menor y usa el índice resultante como posición visible, evitando depender de una posición almacenada que podría quedar obsoleta.

## API externa

`lib/api-trivia.ts` consume Open Trivia DB mediante `fetch`. Incluye tiempo máximo de diez segundos, verificación HTTP, validación de `response_code`, manejo de resultado vacío y decodificación de entidades HTML. Se usa como alternativa en retos de tipo trivia sin preguntas locales.

## Notificaciones

Expo Notifications solicita permiso, configura primero el canal Android y programa identificadores estables. Antes de programar un recordatorio diario se cancela el anterior, evitando duplicados. Desactivar la preferencia cancela recordatorio y alerta de racha.

## Base de datos y RLS

Las migraciones contienen todas las tablas, claves foráneas, restricciones y datos iniciales. RLS permite al estudiante consultar sus propios intentos, progreso, insignias y desbloqueos. Solo los administradores pueden modificar catálogos o progreso de otros usuarios.

## Manejo de errores

Las operaciones críticas revisan los errores de Supabase. El reto no avanza si una respuesta no se guarda y muestra un mensaje recuperable. La API externa informa indisponibilidad en lugar de dejar la pantalla cargando indefinidamente.
