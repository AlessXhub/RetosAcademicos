// CRUD del catalogo de insignias (recompensas por puntos).
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Insignia } from '../../lib/tipos';

export default function AdminInsignias() {
  const [insignias, setInsignias] = useState<Insignia[]>([]);
  const [nombre, setNombre] = useState('');
  const [criterio, setCriterio] = useState('');
  const [puntos, setPuntos] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('insignias').select('*').order('puntos_requeridos', { ascending: true });
    setInsignias(data ?? []);
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // CREATE
  async function crearInsignia() {
    if (!nombre.trim() || !criterio.trim()) {
      Alert.alert('Faltan datos', 'Escribe el nombre y el criterio de obtención.');
      return;
    }
    const { error } = await supabase.from('insignias').insert({
      nombre: nombre.trim(),
      criterio_obtencion: criterio.trim(),
      puntos_requeridos: puntos.trim() ? Number(puntos) : null,
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setNombre('');
    setCriterio('');
    setPuntos('');
    cargar();
  }

  // UPDATE
  async function alternarEstado(item: Insignia) {
    await supabase.from('insignias').update({ estado: item.estado === 'activo' ? 'inactivo' : 'activo' }).eq('id', item.id);
    cargar();
  }

  // DELETE
  async function eliminarInsignia(item: Insignia) {
    Alert.alert('Eliminar', `¿Eliminar "${item.nombre}"?`, [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('insignias').delete().eq('id', item.id); cargar(); } },
    ]);
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Gestionar insignias</Text>

      <TextInput style={styles.input} placeholder="Nombre de la insignia" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Criterio de obtención (texto libre)" value={criterio} onChangeText={setCriterio} />
      <TextInput style={styles.input} placeholder="Puntos requeridos (opcional)" value={puntos} onChangeText={setPuntos} keyboardType="numeric" />
      <Pressable style={styles.boton} onPress={crearInsignia}>
        <Text style={styles.textoBoton}>Agregar insignia</Text>
      </Pressable>

      <FlatList
        data={insignias}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nombreFila, item.estado === 'inactivo' && styles.inactivo]}>{item.nombre}</Text>
              <Text style={styles.meta}>{item.criterio_obtencion}{item.puntos_requeridos ? ` · ${item.puntos_requeridos} pts` : ''}</Text>
            </View>
            <Pressable onPress={() => alternarEstado(item)}>
              <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => eliminarInsignia(item)}>
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
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 8 },
  boton: { backgroundColor: '#2f5496', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  nombreFila: { fontSize: 15 },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  inactivo: { opacity: 0.4, textDecorationLine: 'line-through' },
});
