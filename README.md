# Cómo pasar y ejecutar el proyecto por USB

## 1. Preparar la copia

Copiar la carpeta completa del proyecto al USB.

Para reducir el tamaño, no es necesario copiar estas carpetas generadas:

```text
node_modules
.expo
.expo-export-check
dist
```

No borrar `package.json`, `package-lock.json`, `app`, `components`, `context`, `lib`, `assets` ni `supabase`.

## 2. Programas que debe instalar tu amigo

- Node.js 20.19 o una versión posterior.
- Git, opcional.
- Expo Go en el teléfono Android o iPhone.
- Visual Studio Code, opcional para revisar el código.

Después debe copiar la carpeta del USB a su computadora. Es mejor no ejecutar el proyecto directamente desde el USB.

## 3. Configurar Supabase

El proyecto necesita el archivo `.env` en la raíz con estas variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Puede copiar `.env.example` y renombrarlo como `.env`, pero debe colocar la URL y la clave pública reales del proyecto Supabase.

Antes de entregar la copia, el propietario del proyecto debe ejecutar en Supabase SQL Editor estas migraciones, en orden:

```text
supabase/migrations/001_schema_seguridad_gamificacion.sql
supabase/migrations/002_datos_iniciales.sql
supabase/migrations/003_perfil_avatar.sql
supabase/migrations/004_consistencia_ranking_intentos.sql
```

Si ambos utilizarán el mismo proyecto remoto de Supabase, las migraciones se ejecutan una sola vez. Tu amigo solamente necesita el `.env` correcto.

Nunca se debe colocar una clave `service_role` dentro del `.env` de la aplicación. Solo debe utilizarse la clave pública o publishable key.

## 4. Instalar el proyecto

Abrir PowerShell o la terminal dentro de la carpeta copiada y ejecutar:

```bash
npm ci
```

Luego comprobar que todo esté correcto:

```bash
npm run typecheck
npm test
npm run lint
npm run doctor
```

## 5. Iniciar la aplicación

Ejecutar:

```bash
npx expo start --clear
```

Después:

1. Conectar la computadora y el teléfono a la misma red Wi-Fi.
2. Abrir Expo Go en el teléfono.
3. Escanear el código QR mostrado en la terminal o navegador.

Si el teléfono no logra conectarse por la red local, ejecutar:

```bash
npx expo start --tunnel
```

Para abrir la versión web puede ejecutar:

```bash
npm run web
```

## 6. Datos para probar

Cada persona debe registrarse desde la aplicación con su propio correo. Si Supabase tiene activada la confirmación por correo, debe abrir el mensaje recibido y confirmar la cuenta antes de iniciar sesión.

El ranking, puntos, niveles, logros, perfiles y asignaturas se guardan en Supabase. Por eso no basta con copiar únicamente los archivos: la aplicación también debe tener acceso al proyecto Supabase configurado en `.env`.

## Problemas comunes

### La terminal dice que no reconoce `npm`

Node.js no está instalado o se debe cerrar y abrir nuevamente la terminal después de instalarlo.

### Faltan paquetes o aparecen errores de módulos

Ejecutar nuevamente:

```bash
npm install
npx expo start --clear
```

### La aplicación abre, pero no muestra datos

Revisar que el `.env` tenga la URL y la clave pública correctas, y que las tres migraciones SQL hayan sido ejecutadas en Supabase.

### El código QR no conecta

Confirmar que ambos dispositivos estén en la misma red o utilizar:

```bash
npx expo start --tunnel
```
