// Componente reutilizable con el logo y nombre de la aplicacion.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LogoApp() {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="trophy" size={48} color="#2f5496" />
      <Text style={styles.titulo}>Retos Academicos</Text>
      <Text style={styles.subtitulo}>Aprende jugando</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', marginBottom: 30 },
  titulo: { fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitulo: { fontSize: 14, opacity: 0.6, marginTop: 4 },
});
