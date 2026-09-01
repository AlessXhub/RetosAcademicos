// Muestra el resultado de un intento ya completado. Si "repetido" viene en
// true, se avisa que esa vez no sumo puntos (ya se habia completado antes).
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { IntentoReto } from '../../lib/tipos';

export default function Resultado() {
  const { id, repetido, aprobado: aprobadoParam, puntosOtorgados } = useLocalSearchParams<{
    id: string;
    repetido?: string;
    aprobado?: string;
    puntosOtorgados?: string;
  }>();
  const [intento, setIntento] = useState<IntentoReto | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function cargar() {
        const { data } = await supabase.from('intentos_reto').select('*').eq('id', Number(id)).single();
        setIntento(data);
      }
      cargar();
    }, [id])
  );

  if (!intento) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const aprobado = aprobadoParam ? aprobadoParam === '1' : (intento.porcentaje ?? 0) >= 60;
  const fuePractica = repetido === '1';

  return (
    <View style={styles.centro}>
      <Ionicons
        name={aprobado ? 'trophy' : 'refresh-circle-outline'}
        size={64}
        color={aprobado ? '#d4a017' : '#2f5496'}
      />
      <Text style={styles.titulo}>{aprobado ? '¡Reto completado!' : 'Sigue practicando'}</Text>
      <Text style={styles.dato}>Puntos del intento: {intento.puntos_obtenidos}</Text>
      {puntosOtorgados !== undefined && (
        <Text style={styles.dato}>Puntos agregados al progreso: {puntosOtorgados}</Text>
      )}
      <Text style={styles.dato}>Porcentaje de acierto: {(intento.porcentaje ?? 0).toFixed(0)}%</Text>

      {fuePractica && (
        <Text style={styles.avisoPractica}>
          Esta fue una repetición de práctica: los puntos no se sumaron a tu progreso ni al ranking.
        </Text>
      )}
      {!aprobado && (
        <Text style={styles.avisoPractica}>Necesitas al menos 60% para aprobar y desbloquear progreso.</Text>
      )}

      <Pressable style={styles.boton} onPress={() => router.replace('/inicio')}>
        <Text style={styles.textoBoton}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  titulo: { fontSize: 22, fontWeight: '700', marginTop: 14 },
  dato: { fontSize: 15, marginTop: 8, opacity: 0.8 },
  avisoPractica: { fontSize: 12, textAlign: 'center', marginTop: 14, color: '#b3261e' },
  boton: { backgroundColor: '#2f5496', padding: 14, borderRadius: 10, marginTop: 24, paddingHorizontal: 30 },
  textoBoton: { color: '#fff', fontWeight: '700' },
});
