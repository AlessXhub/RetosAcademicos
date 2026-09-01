// Menu de administracion: punto de entrada a la gestion de cada catalogo.
// Solo deberia mostrarse a usuarios con rol = 'administrador' (ver perfil.tsx).
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const OPCIONES = [
  { ruta: '/admin/asignaturas', icono: 'book-outline', titulo: 'Asignaturas', desc: 'Crear y desactivar asignaturas. Desde aqui entras a sus niveles.' },
  { ruta: '/admin/insignias', icono: 'ribbon-outline', titulo: 'Insignias', desc: 'Catalogo de recompensas por puntos.' },
  { ruta: '/admin/progreso', icono: 'stats-chart-outline', titulo: 'Progreso de estudiantes', desc: 'Consultar y corregir el progreso registrado.' },
] as const;

export default function AdminInicio() {
  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Panel de administración</Text>

      {OPCIONES.map((op) => (
        <Pressable key={op.ruta} style={styles.tarjeta} onPress={() => router.push(op.ruta)}>
          <Ionicons name={op.icono} size={26} color="#2f5496" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.tarjetaTitulo}>{op.titulo}</Text>
            <Text style={styles.tarjetaDesc}>{op.desc}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  volver: { marginBottom: 8 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 14 },
  tarjeta: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, backgroundColor: '#f2f4f8', marginBottom: 10,
  },
  tarjetaTitulo: { fontSize: 15, fontWeight: '700' },
  tarjetaDesc: { fontSize: 12, opacity: 0.7, marginTop: 2 },
});
