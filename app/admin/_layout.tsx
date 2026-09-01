import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { session, usuario, cargando, perfilCargando } = useAuth();

  if (cargando || perfilCargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth/login" />;
  if (usuario?.rol !== 'administrador') return <Redirect href="/inicio" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
