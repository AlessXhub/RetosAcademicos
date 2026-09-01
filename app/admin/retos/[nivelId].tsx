// CRUD de retos de un nivel. Tocar un reto entra a gestionar sus preguntas.
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Reto } from '../../../lib/tipos';
import { siguienteEnteroPositivo } from '../../../lib/calculos';

const TIPOS: Reto['tipo'][] = ['quiz', 'verdadero_falso', 'trivia', 'desafio_reloj'];

export default function AdminRetos() {
  const { nivelId, nombre } = useLocalSearchParams<{ nivelId: string; nombre?: string }>();
  const [retos, setRetos] = useState<Reto[]>([]);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<Reto['tipo']>('quiz');
  const [puntos, setPuntos] = useState('10');

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('retos').select('*').eq('nivel_id', Number(nivelId)).order('orden');
    setRetos(data ?? []);
  }, [nivelId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // CREATE
  async function crearReto() {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Escribe el título del reto.');
      return;
    }
    const { error } = await supabase.from('retos').insert({
      nivel_id: Number(nivelId),
      titulo: titulo.trim(),
      tipo,
      puntos_maximos: Number(puntos) || 10,
      orden: siguienteEnteroPositivo(retos.map((reto) => reto.orden)),
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setTitulo('');
    setPuntos('10');
    cargar();
  }

  // UPDATE
  async function alternarEstado(item: Reto) {
    await supabase.from('retos').update({ estado: item.estado === 'activo' ? 'inactivo' : 'activo' }).eq('id', item.id);
    cargar();
  }

  // DELETE
  async function eliminarReto(item: Reto) {
    Alert.alert('Eliminar', `¿Eliminar "${item.titulo}"?`, [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('retos').delete().eq('id', item.id); cargar(); } },
    ]);
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Retos de {nombre ?? 'el nivel'}</Text>
      <Text style={styles.ayuda}>Toca un reto para administrar sus preguntas.</Text>

      <TextInput style={styles.input} placeholder="Título del reto" value={titulo} onChangeText={setTitulo} />

      <Text style={styles.etiqueta}>Tipo de reto</Text>
      <View style={styles.filaTipos}>
        {TIPOS.map((t) => (
          <Pressable key={t} style={[styles.chip, tipo === t && styles.chipActivo]} onPress={() => setTipo(t)}>
            <Text style={[styles.chipTexto, tipo === t && styles.chipTextoActivo]}>{t.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Puntos máximos" value={puntos} onChangeText={setPuntos} keyboardType="numeric" />
      <Pressable style={styles.boton} onPress={crearReto}>
        <Text style={styles.textoBoton}>Agregar reto</Text>
      </Pressable>

      <FlatList
        data={retos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/admin/preguntas/[retoId]', params: { retoId: item.id, titulo: item.titulo } })}
            >
              <Text style={[styles.nombreFila, item.estado === 'inactivo' && styles.inactivo]}>{item.titulo}</Text>
              <Text style={styles.meta}>{item.tipo.replace('_', ' ')} · {item.puntos_maximos} pts</Text>
            </Pressable>
            <Pressable onPress={() => alternarEstado(item)}>
              <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => eliminarReto(item)}>
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
  etiqueta: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  filaTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#eee' },
  chipActivo: { backgroundColor: '#2f5496' },
  chipTexto: { fontSize: 12 },
  chipTextoActivo: { color: '#fff', fontWeight: '700' },
  boton: { backgroundColor: '#2f5496', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  nombreFila: { fontSize: 15 },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  inactivo: { opacity: 0.4, textDecorationLine: 'line-through' },
});
