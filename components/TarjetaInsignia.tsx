// Tarjeta para mostrar una insignia, obtenida o pendiente.
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Insignia } from '../lib/tipos';

interface Props {
  insignia: Insignia;
  obtenida: boolean;
}

export default function TarjetaInsignia({ insignia, obtenida }: Props) {
  return (
    <View style={[styles.tarjeta, !obtenida && styles.pendiente]}>
      {insignia.icono_url ? (
        <Image source={{ uri: insignia.icono_url }} style={styles.icono} />
      ) : (
        <Ionicons name="ribbon-outline" size={36} color={obtenida ? '#d4a017' : '#aaa'} />
      )}
      <Text style={styles.nombre}>{insignia.nombre}</Text>
      <Text style={styles.criterio} numberOfLines={2}>{insignia.criterio_obtencion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: 140, padding: 12, margin: 6, borderRadius: 12,
    backgroundColor: '#fff8e6', alignItems: 'center',
  },
  pendiente: { backgroundColor: '#f0f0f0', opacity: 0.6 },
  nombre: { fontSize: 13, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  criterio: { fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: 'center' },
  icono: { width: 36, height: 36, borderRadius: 18 },
});
