// CRUD de contenido multimedia (imagen, video, texto, pdf) de una asignatura.
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ContenidoMultimedia, Nivel } from '../../../lib/tipos';
import { siguienteEnteroPositivo } from '../../../lib/calculos';

const TIPOS: ContenidoMultimedia['tipo'][] = ['imagen', 'video', 'texto', 'pdf'];

export default function AdminContenidos() {
  const { asignaturaId, nombre } = useLocalSearchParams<{ asignaturaId: string; nombre?: string }>();
  const [contenidos, setContenidos] = useState<ContenidoMultimedia[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [tipo, setTipo] = useState<ContenidoMultimedia['tipo']>('imagen');
  const [nivelId, setNivelId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const [respuestaContenidos, respuestaNiveles] = await Promise.all([
      supabase.from('contenidos_multimedia').select('*')
        .eq('asignatura_id', Number(asignaturaId)).order('orden'),
      supabase.from('niveles').select('*').eq('asignatura_id', Number(asignaturaId)).order('orden'),
    ]);
    if (respuestaContenidos.error || respuestaNiveles.error) {
      Alert.alert('Error', 'No se pudo cargar el contenido multimedia.');
      return;
    }
    setContenidos(respuestaContenidos.data ?? []);
    setNiveles(respuestaNiveles.data ?? []);
  }, [asignaturaId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // CREATE
  async function crearContenido() {
    if (!titulo.trim() || !url.trim()) {
      Alert.alert('Faltan datos', 'Escribe el título y la URL del recurso.');
      return;
    }
    const { error } = await supabase.from('contenidos_multimedia').insert({
      asignatura_id: Number(asignaturaId),
      titulo: titulo.trim(),
      url_recurso: url.trim(),
      tipo,
      nivel_id: nivelId,
      orden: siguienteEnteroPositivo(contenidos.map((contenido) => contenido.orden)),
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setTitulo('');
    setUrl('');
    cargar();
  }

  // UPDATE
  async function alternarEstado(item: ContenidoMultimedia) {
    await supabase.from('contenidos_multimedia').update({ estado: item.estado === 'activo' ? 'inactivo' : 'activo' }).eq('id', item.id);
    cargar();
  }

  // DELETE
  async function eliminarContenido(item: ContenidoMultimedia) {
    Alert.alert('Eliminar', `¿Eliminar "${item.titulo}"?`, [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('contenidos_multimedia').delete().eq('id', item.id); cargar(); } },
    ]);
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Contenido de {nombre ?? 'la asignatura'}</Text>

      <TextInput style={styles.input} placeholder="Título del recurso" value={titulo} onChangeText={setTitulo} />
      <TextInput
        style={styles.input}
        placeholder={tipo === 'texto' ? 'Texto o URL del recurso' : 'URL del recurso'}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
      />
      <View style={styles.filaTipos}>
        {TIPOS.map((t) => (
          <Pressable key={t} style={[styles.chip, tipo === t && styles.chipActivo]} onPress={() => setTipo(t)}>
            <Text style={[styles.chipTexto, tipo === t && styles.chipTextoActivo]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.etiqueta}>Disponible en</Text>
      <View style={styles.filaTipos}>
        <Pressable style={[styles.chip, nivelId === null && styles.chipActivo]} onPress={() => setNivelId(null)}>
          <Text style={[styles.chipTexto, nivelId === null && styles.chipTextoActivo]}>Toda la asignatura</Text>
        </Pressable>
        {niveles.map((nivel) => (
          <Pressable key={nivel.id} style={[styles.chip, nivelId === nivel.id && styles.chipActivo]} onPress={() => setNivelId(nivel.id)}>
            <Text style={[styles.chipTexto, nivelId === nivel.id && styles.chipTextoActivo]}>{nivel.nombre}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.boton} onPress={crearContenido}>
        <Text style={styles.textoBoton}>Agregar contenido</Text>
      </Pressable>

      <FlatList
        data={contenidos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            {item.tipo === 'imagen' && <Image source={{ uri: item.url_recurso }} style={styles.miniatura} />}
            <View style={{ flex: 1 }}>
              <Text style={[styles.nombreFila, item.estado === 'inactivo' && styles.inactivo]}>{item.titulo}</Text>
              <Text style={styles.meta}>
                {item.tipo} · {item.nivel_id ? niveles.find((nivel) => nivel.id === item.nivel_id)?.nombre ?? 'Nivel' : 'Toda la asignatura'}
              </Text>
            </View>
            <Pressable onPress={() => alternarEstado(item)}>
              <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
            </Pressable>
            <Pressable onPress={() => eliminarContenido(item)}>
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
  titulo: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
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
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  miniatura: { width: 40, height: 40, borderRadius: 6 },
  nombreFila: { fontSize: 14 },
  meta: { fontSize: 11, opacity: 0.6 },
  inactivo: { opacity: 0.4, textDecorationLine: 'line-through' },
});
