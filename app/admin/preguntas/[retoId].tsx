// CRUD de preguntas de un reto, y de las opciones de respuesta de cada
// pregunta (para tipo opcion_multiple o verdadero_falso). Para tipo
// "completar" se guarda la respuesta esperada como texto. Cada pregunta
// se puede ocultar (baja logica) o eliminar por completo.
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Pregunta, OpcionRespuesta } from '../../../lib/tipos';
import { siguienteEnteroPositivo } from '../../../lib/calculos';

const TIPOS: Pregunta['tipo'][] = ['opcion_multiple', 'verdadero_falso', 'completar'];

interface PreguntaConOpciones extends Pregunta {
  opciones_respuesta: OpcionRespuesta[];
}

export default function AdminPreguntas() {
  const { retoId, titulo } = useLocalSearchParams<{ retoId: string; titulo?: string }>();
  const [preguntas, setPreguntas] = useState<PreguntaConOpciones[]>([]);
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState<Pregunta['tipo']>('opcion_multiple');
  const [puntos, setPuntos] = useState('10');
  const [respuestaEsperada, setRespuestaEsperada] = useState('');

  const [textoOpcion, setTextoOpcion] = useState<Record<number, string>>({});

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('preguntas')
      .select('*, opciones_respuesta(*)')
      .eq('reto_id', Number(retoId))
      .order('orden');
    setPreguntas((data as PreguntaConOpciones[]) ?? []);
  }, [retoId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function crearPregunta() {
    if (!enunciado.trim()) {
      Alert.alert('Falta el enunciado', 'Escribe la pregunta.');
      return;
    }
    if (tipo === 'completar' && !respuestaEsperada.trim()) {
      Alert.alert('Falta la respuesta', 'Escribe cuál es la respuesta correcta esperada.');
      return;
    }
    const { error } = await supabase.from('preguntas').insert({
      reto_id: Number(retoId),
      enunciado: enunciado.trim(),
      tipo,
      puntos: Number(puntos) || 10,
      orden: siguienteEnteroPositivo(preguntas.map((pregunta) => pregunta.orden)),
      respuesta_esperada: tipo === 'completar' ? respuestaEsperada.trim() : null,
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setEnunciado('');
    setPuntos('10');
    setRespuestaEsperada('');
    cargar();
  }

  async function alternarEstado(item: Pregunta) {
    const { error } = await supabase
      .from('preguntas')
      .update({ estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      .eq('id', item.id);
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    cargar();
  }

  async function eliminarPregunta(item: Pregunta) {
    Alert.alert('Eliminar pregunta', '¿Eliminar esta pregunta y sus opciones? Si prefieres conservarla pero no usarla, mejor ocúltala con el ícono del ojo.', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('preguntas').delete().eq('id', item.id);
          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }
          cargar();
        },
      },
    ]);
  }

  async function agregarOpcion(pregunta: PreguntaConOpciones) {
    const texto = (textoOpcion[pregunta.id] ?? '').trim();
    if (!texto) return;
    await supabase.from('opciones_respuesta').insert({
      pregunta_id: pregunta.id,
      texto_opcion: texto,
      orden: siguienteEnteroPositivo(pregunta.opciones_respuesta.map((opcion) => opcion.orden)),
    });
    setTextoOpcion((prev) => ({ ...prev, [pregunta.id]: '' }));
    cargar();
  }

  async function marcarCorrecta(pregunta: PreguntaConOpciones, opcion: OpcionRespuesta) {
    await Promise.all(
      pregunta.opciones_respuesta.map((o) =>
        supabase.from('opciones_respuesta').update({ es_correcta: o.id === opcion.id }).eq('id', o.id)
      )
    );
    cargar();
  }

  async function eliminarOpcion(opcion: OpcionRespuesta) {
    await supabase.from('opciones_respuesta').delete().eq('id', opcion.id);
    cargar();
  }

  return (
    <View style={styles.contenedor}>
      <Pressable onPress={() => router.back()} style={styles.volver}>
        <Ionicons name="arrow-back-outline" size={22} />
      </Pressable>
      <Text style={styles.titulo}>Preguntas de {titulo ?? 'el reto'}</Text>

      <TextInput style={styles.input} placeholder="Enunciado de la pregunta" value={enunciado} onChangeText={setEnunciado} multiline />
      <View style={styles.filaTipos}>
        {TIPOS.map((t) => (
          <Pressable key={t} style={[styles.chip, tipo === t && styles.chipActivo]} onPress={() => setTipo(t)}>
            <Text style={[styles.chipTexto, tipo === t && styles.chipTextoActivo]}>{t.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Puntos" value={puntos} onChangeText={setPuntos} keyboardType="numeric" />

      {tipo === 'completar' && (
        <TextInput
          style={styles.input}
          placeholder="Respuesta correcta esperada"
          value={respuestaEsperada}
          onChangeText={setRespuestaEsperada}
        />
      )}

      <Pressable style={styles.boton} onPress={crearPregunta}>
        <Text style={styles.textoBoton}>Agregar pregunta</Text>
      </Pressable>

      <FlatList
        data={preguntas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.tarjetaPregunta, item.estado === 'inactivo' && styles.tarjetaInactiva]}>
            <View style={styles.filaPregunta}>
              <Text style={[styles.enunciado, item.estado === 'inactivo' && styles.textoInactivo]}>{item.enunciado}</Text>
              <Pressable onPress={() => alternarEstado(item)}>
                <Ionicons name={item.estado === 'activo' ? 'eye-outline' : 'eye-off-outline'} size={18} color="#666" />
              </Pressable>
              <Pressable onPress={() => eliminarPregunta(item)}>
                <Ionicons name="trash-outline" size={18} color="#b3261e" />
              </Pressable>
            </View>
            <Text style={styles.meta}>{item.tipo.replace('_', ' ')} · {item.puntos} pts{item.estado === 'inactivo' ? ' · oculta' : ''}</Text>

            {item.tipo === 'completar' && (
              <Text style={styles.respuestaEsperada}>Respuesta correcta: {item.respuesta_esperada ?? '(no definida)'}</Text>
            )}

            {item.tipo !== 'completar' && (
              <View style={styles.opciones}>
                {item.opciones_respuesta.map((op) => (
                  <View key={op.id} style={styles.filaOpcion}>
                    <Pressable onPress={() => marcarCorrecta(item, op)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons
                        name={op.es_correcta ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={op.es_correcta ? '#2e7d32' : '#999'}
                      />
                      <Text style={styles.opcionTexto}>{op.texto_opcion}</Text>
                    </Pressable>
                    <Pressable onPress={() => eliminarOpcion(op)}>
                      <Ionicons name="close-outline" size={18} color="#b3261e" />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.filaNuevaOpcion}>
                  <TextInput
                    style={styles.inputOpcion}
                    placeholder="Nueva opción"
                    value={textoOpcion[item.id] ?? ''}
                    onChangeText={(texto) => setTextoOpcion((prev) => ({ ...prev, [item.id]: texto }))}
                  />
                  <Pressable onPress={() => agregarOpcion(item)}>
                    <Ionicons name="add-circle-outline" size={24} color="#2f5496" />
                  </Pressable>
                </View>
                <Text style={styles.ayuda}>Toca el círculo para marcar la opción correcta.</Text>
              </View>
            )}
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
  filaTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#eee' },
  chipActivo: { backgroundColor: '#2f5496' },
  chipTexto: { fontSize: 12 },
  chipTextoActivo: { color: '#fff', fontWeight: '700' },
  boton: { backgroundColor: '#2f5496', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  tarjetaPregunta: { backgroundColor: '#f2f4f8', borderRadius: 10, padding: 12, marginBottom: 10 },
  tarjetaInactiva: { opacity: 0.5 },
  filaPregunta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  enunciado: { fontSize: 14, fontWeight: '600', flex: 1 },
  textoInactivo: { textDecorationLine: 'line-through' },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  respuestaEsperada: { fontSize: 12, marginTop: 6, color: '#2e7d32', fontWeight: '600' },
  opciones: { marginTop: 8 },
  filaOpcion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  opcionTexto: { fontSize: 13, marginLeft: 6 },
  filaNuevaOpcion: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  inputOpcion: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 6, backgroundColor: '#fff' },
  ayuda: { fontSize: 10, opacity: 0.5, marginTop: 4 },
});
