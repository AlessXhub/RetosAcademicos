// Consulta y correccion del progreso registrado de cada estudiante
// (registros de progreso, requerimiento de CRUD sobre progreso_global).
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface FilaProgreso {
  usuario_id: string;
  puntos_totales: number;
  nivel_actual: number;
  racha_actual: number;
  usuarios: { nombre: string; apellido: string };
}

export default function AdminProgreso() {
  const [filas, setFilas] = useState<FilaProgreso[]>([]);
  const [edicion, setEdicion] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('progreso_global')
      .select('usuario_id, puntos_totales, nivel_actual, racha_actual, usuarios(nombre, apellido)')
      .order('puntos_totales', { ascending: false });
    setFilas((data as unknown as FilaProgreso[]) ?? []);
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // UPDATE puntos (correccion manual, por ejemplo si hubo un error del sistema)
  async function corregirPuntos(usuarioId: string) {
    const nuevoValor = Number(edicion[usuarioId]);
    if (!Number.isInteger(nuevoValor) || nuevoValor < 0) {
      Alert.alert('Valor inválido', 'Escribe un número entero igual o mayor que cero.');
      return;
    }
    const { error } = await supabase.rpc('corregir_puntos_usuario', {
      p_usuario_id: usuarioId,
      p_puntos: nuevoValor,
    });
    if (error) {
      Alert.alert('No se pudo corregir', 'Aplica la migración de Supabase y verifica los permisos administrativos.');
      return;
    }
    setEdicion((prev) => ({ ...prev, [usuarioId]: '' }));
    cargar();
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Progreso de estudiantes</Text>
      <Text style={styles.ayuda}>Puedes corregir los puntos totales si es necesario.</Text>

      <FlatList
        data={filas}
        keyExtractor={(item) => item.usuario_id}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombreFila}>{item.usuarios.nombre} {item.usuarios.apellido}</Text>
              <Text style={styles.meta}>Nivel {item.nivel_actual} · {item.puntos_totales} pts · racha {item.racha_actual}</Text>
            </View>
            <TextInput
              style={styles.inputCorreccion}
              placeholder="Nuevo puntaje"
              keyboardType="numeric"
              value={edicion[item.usuario_id] ?? ''}
              onChangeText={(texto) => setEdicion((prev) => ({ ...prev, [item.usuario_id]: texto }))}
            />
            <Pressable onPress={() => corregirPuntos(item.usuario_id)}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#2f5496" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  volver: { marginBottom: 8 },
  titulo: { fontSize: 20, fontWeight: '700' },
  ayuda: { fontSize: 12, opacity: 0.6, marginBottom: 10 },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  nombreFila: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  inputCorreccion: { width: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 6, textAlign: 'center' },
});
