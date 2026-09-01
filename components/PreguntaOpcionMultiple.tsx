// Componente para preguntas de opcion multiple y verdadero/falso.
// Reutilizable porque ambos tipos comparten la misma estructura de opciones.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Pregunta, OpcionRespuesta } from '../lib/tipos';

interface Props {
  pregunta: Pregunta;
  opciones: OpcionRespuesta[];
  opcionSeleccionada: number | null;
  onSeleccionar: (opcionId: number) => void;
}

export default function PreguntaOpcionMultiple({
  pregunta, opciones, opcionSeleccionada, onSeleccionar,
}: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.enunciado}>{pregunta.enunciado}</Text>
      {opciones.map((opcion) => (
        <Pressable
          key={opcion.id}
          style={[
            styles.opcion,
            opcionSeleccionada === opcion.id && styles.opcionSeleccionada,
          ]}
          onPress={() => onSeleccionar(opcion.id)}
        >
          <Text style={[styles.textoOpcion, opcionSeleccionada === opcion.id && styles.textoSeleccionado]}>
            {opcion.texto_opcion}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginVertical: 12 },
  enunciado: { fontSize: 17, fontWeight: '600', marginBottom: 14 },
  opcion: {
    padding: 14, borderRadius: 10, backgroundColor: '#f2f4f8', marginBottom: 8,
  },
  opcionSeleccionada: { backgroundColor: '#2f5496' },
  textoOpcion: { fontSize: 15, color: '#111' },
  textoSeleccionado: { color: '#fff', fontWeight: '600' },
});
