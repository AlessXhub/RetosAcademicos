// CRUD de niveles de una asignatura. Tocar un nivel entra a gestionar sus retos.
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Nivel } from '../../../lib/tipos';
import { siguienteEnteroPositivo } from '../../../lib/calculos';

export default function AdminNiveles() {
  const { asignaturaId, nombre } = useLocalSearchParams<{ asignaturaId: string; nombre?: string }>();
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [nombreNivel, setNombreNivel] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('niveles')
      .select('*')
      .eq('asignatura_id', Number(asignaturaId))
      .order('orden');
    setNiveles(data ?? []);
  }, [asignaturaId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // CREATE
  async function crearNivel() {
    if (!nombreNivel.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del nivel.');
      return;
    }
    const siguienteNumero = siguienteEnteroPositivo(niveles.map((nivel) => nivel.numero_nivel));
    const siguienteOrden = siguienteEnteroPositivo(niveles.map((nivel) => nivel.orden));
    const { error } = await supabase.from('niveles').insert({
      asignatura_id: Number(asignaturaId),
      nombre: nombreNivel.trim(),
      numero_nivel: siguienteNumero,
      orden: siguienteOrden,
      estado: niveles.length === 0 ? 'activo' : 'inactivo',
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setNombreNivel('');
    cargar();
  }

  // UPDATE
  async function alternarEstado(item: Nivel) {
    await supabase.from('niveles').update({ estado: item.estado === 'activo' ? 'inactivo' : 'activo' }).eq('id', item.id);
    cargar();
  }

  // DELETE
  async function eliminarNivel(item: Nivel) {
    Alert.alert('Eliminar', `¿Eliminar "${item.nombre}"?`, [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('niveles').delete().eq('id', item.id); cargar(); } },
    ]);
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Niveles de {nombre ?? 'la asignatura'}</Text>
      <Text style={styles.ayuda}>Toca un nivel para administrar sus retos.</Text>

      <TextInput style={styles.input} placeholder="Nombre del nivel" value={nombreNivel} onChangeText={setNombreNivel} />
      <Pressable style={styles.boton} onPress={crearNivel}>
        <Text style={styles.textoBoton}>Agregar nivel</Text>
      </Pressable>

      <FlatList
        data={niveles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/admin/retos/[nivelId]', params: { nivelId: item.id, nombre: item.nombre } })}
            >
              <Text style={[styles.nombreFila, item.estado === 'inactivo' && styles.inactivo]}>
                {item.numero_nivel}. {item.nombre}
              </Text>
            </Pressable>
            <Pressable onPress={() => alternarEstado(item)}>
              <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => eliminarNivel(item)}>
              <Ionicons name="trash-outline" size={20} color="#b3261e" />
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
  titulo: { fontSize: 18, fontWeight: '700' },
  ayuda: { fontSize: 12, opacity: 0.6, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 8 },
  boton: { backgroundColor: '#2f5496', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  nombreFila: { fontSize: 15 },
  inactivo: { opacity: 0.4, textDecorationLine: 'line-through' },
});
