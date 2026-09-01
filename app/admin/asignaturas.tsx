// CRUD de asignaturas. Tocar el nombre entra a gestionar los niveles de esa
// asignatura; el icono de imagen entra a gestionar su contenido multimedia.
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Asignatura } from '../../lib/tipos';

export default function AdminAsignaturas() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('asignaturas').select('*').order('nombre');
    setAsignaturas(data ?? []);
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // CREATE
  async function crearAsignatura() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre de la asignatura.');
      return;
    }
    const { error } = await supabase.from('asignaturas').insert({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setNombre('');
    setDescripcion('');
    cargar();
  }

  // UPDATE (baja logica: activo/inactivo)
  async function alternarEstado(item: Asignatura) {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    await supabase.from('asignaturas').update({ estado: nuevoEstado }).eq('id', item.id);
    cargar();
  }

  // DELETE
  async function eliminarAsignatura(item: Asignatura) {
    Alert.alert('Eliminar', `¿Eliminar "${item.nombre}"? Si tiene niveles asociados, mejor desactívala.`, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await supabase.from('asignaturas').delete().eq('id', item.id);
          cargar();
        },
      },
    ]);
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Gestionar asignaturas</Text>
      <Text style={styles.ayuda}>Toca el nombre para administrar sus niveles.</Text>

      <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} />
      <Pressable style={styles.boton} onPress={crearAsignatura}>
        <Text style={styles.textoBoton}>Agregar asignatura</Text>
      </Pressable>

      <FlatList
        data={asignaturas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/admin/niveles/[asignaturaId]', params: { asignaturaId: item.id, nombre: item.nombre } })}
            >
              <Text style={[styles.nombreFila, item.estado === 'inactivo' && styles.inactivo]}>{item.nombre}</Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/admin/contenidos/[asignaturaId]', params: { asignaturaId: item.id, nombre: item.nombre } })}>
              <Ionicons name="images-outline" size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => alternarEstado(item)}>
              <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => eliminarAsignatura(item)}>
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
  titulo: { fontSize: 20, fontWeight: '700' },
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
