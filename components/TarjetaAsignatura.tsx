// Tarjeta interactiva para listar asignaturas en la pantalla de inicio.
import { Pressable, Text, StyleSheet, Image, View } from 'react-native';
import { Asignatura } from '../lib/tipos';

interface Props {
  asignatura: Asignatura;
  onPress: () => void;
}

export default function TarjetaAsignatura({ asignatura, onPress }: Props) {
  return (
    <Pressable style={styles.tarjeta} onPress={onPress}>
      {asignatura.icono_url ? (
        <Image source={{ uri: asignatura.icono_url }} style={styles.icono} />
      ) : (
        <View style={styles.iconoVacio} />
      )}
      <Text style={styles.nombre}>{asignatura.nombre}</Text>
      {asignatura.descripcion && (
        <Text style={styles.descripcion} numberOfLines={2}>{asignatura.descripcion}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: 160, padding: 14, margin: 6, borderRadius: 12,
    backgroundColor: '#f2f4f8', justifyContent: 'flex-start',
  },
  icono: { width: 40, height: 40, marginBottom: 8, borderRadius: 8 },
  iconoVacio: { width: 40, height: 40, marginBottom: 8, borderRadius: 8, backgroundColor: '#dfe3ea' },
  nombre: { fontSize: 15, fontWeight: '700' },
  descripcion: { fontSize: 12, opacity: 0.7, marginTop: 4 },
});
