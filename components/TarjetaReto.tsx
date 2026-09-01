// Tarjeta interactiva para listar retos dentro de un nivel.
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reto } from '../lib/tipos';

const ICONO_POR_TIPO: Record<Reto['tipo'], keyof typeof Ionicons.glyphMap> = {
  quiz: 'help-circle-outline',
  verdadero_falso: 'checkmark-circle-outline',
  trivia: 'bulb-outline',
  desafio_reloj: 'timer-outline',
};

interface Props {
  reto: Reto;
  bloqueado?: boolean;
  onPress: () => void;
}

export default function TarjetaReto({ reto, bloqueado, onPress }: Props) {
  return (
    <Pressable
      style={[styles.tarjeta, bloqueado && styles.bloqueada]}
      onPress={bloqueado ? undefined : onPress}
      disabled={bloqueado}
    >
      <Ionicons
        name={bloqueado ? 'lock-closed-outline' : ICONO_POR_TIPO[reto.tipo]}
        size={24}
        color={bloqueado ? '#999' : '#2f5496'}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.titulo}>{reto.titulo}</Text>
        <Text style={styles.meta}>{reto.tipo.replace('_', ' ')} - {reto.puntos_maximos} pts</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 10, backgroundColor: '#f2f4f8', marginVertical: 6,
  },
  bloqueada: { opacity: 0.5 },
  titulo: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.6, marginTop: 2 },
});
