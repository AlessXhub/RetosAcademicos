import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProgresoProvider, useProgreso } from '../context/ProgresoContext';
import { pedirPermisoNotificaciones, programarRecordatorioDiario } from '../lib/notificaciones';

function ControladorApp({ children }: { children: React.ReactNode }) {
  const { session, cargando } = useAuth();
  const { preferencias, preferenciasCargadas } = useProgreso();
  const segments = useSegments();
  const recordatorioConfigurado = useRef<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    const enAuth = segments[0] === 'auth';
    const rutaActual = segments.join('/');
    const enIndice = rutaActual === '' || rutaActual === 'index';
    if (!session && !enAuth) router.replace('/auth/login');
    if (session && (enAuth || enIndice)) router.replace('/inicio');
  }, [session, cargando, segments]);

  useEffect(() => {
    const usuarioId = session?.user.id;
    if (!usuarioId || !preferenciasCargadas || !preferencias.notificacionesActivadas) return;
    if (recordatorioConfigurado.current === usuarioId) return;
    recordatorioConfigurado.current = usuarioId;
    pedirPermisoNotificaciones().then((concedido) => {
      if (concedido) void programarRecordatorioDiario(usuarioId);
    });
  }, [session?.user.id, preferencias.notificacionesActivadas, preferenciasCargadas]);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProgresoProvider>
        <ControladorApp>
          <Stack screenOptions={{ headerShown: false }} />
        </ControladorApp>
      </ProgresoProvider>
    </AuthProvider>
  );
}
