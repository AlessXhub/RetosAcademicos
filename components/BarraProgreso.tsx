// Barra de progreso reutilizable (usada en niveles, retos y perfil).
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  porcentaje: number; // 0 a 100
  etiqueta?: string;
}

export default function BarraProgreso({ porcentaje, etiqueta }: Props) {
  const valor = Math.max(0, Math.min(100, porcentaje));
  return (
    <View style={styles.contenedor}>
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      <View style={styles.fondo}>
        <View style={[styles.relleno, { width: `${valor}%` }]} />
      </View>
      <Text style={styles.porcentaje}>{valor.toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginVertical: 8 },
  etiqueta: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  fondo: { height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  relleno: { height: '100%', backgroundColor: '#2f5496' },
  porcentaje: { fontSize: 12, marginTop: 4, textAlign: 'right' },
});
