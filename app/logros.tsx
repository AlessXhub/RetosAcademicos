import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import NavegacionInferior from '../components/NavegacionInferior';
import { useProgreso } from '../context/ProgresoContext';
import { COLOR_AMARILLO, COLOR_AZUL, COLOR_AZUL_CLARO, COLOR_FONDO, COLOR_FONDO_CAMPO, COLOR_TEXTO, COLOR_TEXTO_SUAVE } from '../lib/colores';
import { supabase } from '../lib/supabase';
import { Insignia } from '../lib/tipos';

export default function Logros() {
  const { width } = useWindowDimensions();
  const { insignias } = useProgreso();
  const [todas, setTodas] = useState<Insignia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const escala = Math.min(Math.max(width / 390, 0.85), 1.25);

  useFocusEffect(useCallback(() => {
    async function cargar() {
      setCargando(true);
      setErrorCarga(null);
      const { data, error } = await supabase.from('insignias').select('*').eq('estado', 'activo').order('id');
      if (error) setErrorCarga('No se pudieron cargar los logros.');
      else setTodas((data as Insignia[]) ?? []);
      setCargando(false);
    }
    void cargar();
  }, []));

  const idsObtenidas = new Set(insignias.map((item) => item.insignia_id));
  const totalObtenidas = todas.filter((item) => idsObtenidas.has(item.id)).length;
  const tamanoCirculo = Math.min(Math.max(width * 0.42, 140), 220);

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/inicio')} hitSlop={12}>
          <Ionicons name="arrow-back-outline" size={24} color={COLOR_TEXTO} />
        </Pressable>
        <Text style={[styles.titulo, { fontSize: 20 * escala }]}>Logros</Text><View style={styles.espaciador} />
      </View>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingHorizontal: width * 0.05 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.resumenFila}>
          <View style={[styles.circuloResumen, { width: tamanoCirculo, height: tamanoCirculo, borderRadius: tamanoCirculo / 2 }]}>
            <Text style={[styles.circuloNumero, { fontSize: 30 * escala }]}>{totalObtenidas}/{todas.length}</Text>
            <Text style={[styles.circuloEtiqueta, { fontSize: 14 * escala }]}>Logros</Text>
          </View>
        </View>
        <Text style={[styles.subtitulo, { fontSize: 15 * escala }]}>Logros disponibles</Text>
        {cargando && <Text style={styles.estado}>Cargando logros…</Text>}
        {errorCarga && <Text style={styles.error}>{errorCarga}</Text>}
        {!cargando && !errorCarga && todas.length === 0 && <Text style={styles.estado}>Todavía no hay logros configurados.</Text>}
        {todas.map((insignia) => {
          const obtenida = idsObtenidas.has(insignia.id);
          return (
            <View key={insignia.id} style={styles.fila}>
              <View style={[styles.iconoCirculo, obtenida && styles.iconoObtenido]}>
                {insignia.icono_url ? <Image source={{ uri: insignia.icono_url }} style={styles.iconoImagen} /> : (
                  <Ionicons name={obtenida ? 'trophy' : 'lock-closed'} size={20} color={obtenida ? COLOR_AMARILLO : '#9A9A9A'} />
                )}
              </View>
              <View style={styles.filaTextos}>
                <Text style={styles.filaEstado}>{obtenida ? 'Logro obtenido' : 'Sin obtener'}</Text>
                <Text style={styles.filaTitulo}>{insignia.nombre}</Text>
                {insignia.descripcion && <Text style={styles.filaDescripcion} numberOfLines={2}>{insignia.descripcion}</Text>}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <NavegacionInferior activa="logros" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO }, encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  titulo: { fontWeight: '800', color: COLOR_TEXTO }, espaciador: { width: 24 }, contenido: { paddingBottom: 24, paddingTop: 8 },
  resumenFila: { alignItems: 'center', marginVertical: 20 }, circuloResumen: { backgroundColor: COLOR_AZUL, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: COLOR_AZUL_CLARO },
  circuloNumero: { fontWeight: '900', color: COLOR_TEXTO }, circuloEtiqueta: { color: COLOR_TEXTO, fontWeight: '600', marginTop: 4 },
  subtitulo: { fontWeight: '800', color: COLOR_TEXTO, marginBottom: 12 }, estado: { textAlign: 'center', color: COLOR_TEXTO_SUAVE, marginTop: 16 }, error: { textAlign: 'center', color: '#B3261E', marginTop: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 10 },
  iconoCirculo: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E7E4F2', justifyContent: 'center', alignItems: 'center' }, iconoObtenido: { backgroundColor: '#FFF3D0' },
  iconoImagen: { width: 46, height: 46, borderRadius: 23 }, filaTextos: { flex: 1 }, filaEstado: { fontSize: 11, color: COLOR_TEXTO_SUAVE, fontWeight: '600' },
  filaTitulo: { fontSize: 14, color: COLOR_TEXTO, fontWeight: '700', marginTop: 2 }, filaDescripcion: { fontSize: 11, color: COLOR_TEXTO_SUAVE, marginTop: 2 },
});
