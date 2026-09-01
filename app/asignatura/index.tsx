// Lista de asignaturas activas y avance en sus desafíos.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import NavegacionInferior from '../../components/NavegacionInferior';
import { useProgreso } from '../../context/ProgresoContext';
import { COLOR_FONDO, COLOR_MORADO_CLARO, COLOR_TEXTO, COLOR_TEXTO_SUAVE } from '../../lib/colores';
import { supabase } from '../../lib/supabase';
import { Asignatura } from '../../lib/tipos';

interface AsignaturaConProgreso extends Asignatura {
  totalRetos: number;
  retosCompletados: number;
}

const PALETA = [
  { fondo: COLOR_MORADO_CLARO, texto: '#2B1A54' },
  { fondo: '#F5C67A', texto: '#5A3A00' },
  { fondo: '#8FD3E8', texto: '#0A3A4A' },
];

export default function ListaAsignaturas() {
  const { width } = useWindowDimensions();
  const { retosCompletados } = useProgreso();
  const [asignaturas, setAsignaturas] = useState<AsignaturaConProgreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const escala = Math.min(Math.max(width / 390, 0.85), 1.25);

  useFocusEffect(useCallback(() => {
    async function cargar() {
      setCargando(true);
      setErrorCarga(null);
      const respuestaAsignaturas = await supabase.from('asignaturas').select('*')
        .eq('estado', 'activo').order('nombre');
      if (respuestaAsignaturas.error) {
        setErrorCarga('No se pudieron cargar las asignaturas.');
        setCargando(false);
        return;
      }
      const lista = (respuestaAsignaturas.data as Asignatura[]) ?? [];
      if (lista.length === 0) {
        setAsignaturas([]);
        setCargando(false);
        return;
      }

      const respuestaNiveles = await supabase.from('niveles').select('id, asignatura_id')
        .in('asignatura_id', lista.map((item) => item.id)).eq('estado', 'activo');
      if (respuestaNiveles.error) {
        setErrorCarga('No se pudo calcular el progreso de las asignaturas.');
        setCargando(false);
        return;
      }
      const niveles = respuestaNiveles.data ?? [];
      const nivelAAsignatura = new Map(niveles.map((nivel) => [nivel.id, nivel.asignatura_id]));
      const respuestaRetos = niveles.length > 0
        ? await supabase.from('retos').select('id, nivel_id').in('nivel_id', niveles.map((nivel) => nivel.id)).eq('estado', 'activo')
        : { data: [], error: null };
      if (respuestaRetos.error) {
        setErrorCarga('No se pudo calcular el progreso de las asignaturas.');
        setCargando(false);
        return;
      }

      setAsignaturas(lista.map((asignatura) => {
        const retos = (respuestaRetos.data ?? []).filter((reto) => nivelAAsignatura.get(reto.nivel_id) === asignatura.id);
        return {
          ...asignatura,
          totalRetos: retos.length,
          retosCompletados: retos.filter((reto) => retosCompletados.has(reto.id)).length,
        };
      }));
      setCargando(false);
    }
    void cargar();
  }, [retosCompletados]));

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/inicio')} hitSlop={12}>
          <Ionicons name="arrow-back-outline" size={24} color={COLOR_TEXTO} />
        </Pressable>
        <Text style={[styles.titulo, { fontSize: 20 * escala }]}>Asignaturas</Text>
        <View style={styles.espaciador} />
      </View>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingHorizontal: width * 0.05 }]} showsVerticalScrollIndicator={false}>
        {cargando && <Text style={styles.estado}>Cargando asignaturas…</Text>}
        {errorCarga && <Text style={styles.error}>{errorCarga}</Text>}
        {!cargando && !errorCarga && asignaturas.length === 0 && <Text style={styles.estado}>Aún no hay asignaturas disponibles.</Text>}

        {asignaturas.map((asignatura, indice) => {
          const color = PALETA[indice % PALETA.length];
          const porcentaje = asignatura.totalRetos > 0
            ? Math.round((asignatura.retosCompletados / asignatura.totalRetos) * 100) : 0;
          return (
            <View key={asignatura.id} style={[styles.tarjeta, { backgroundColor: color.fondo }]}>
              <View style={styles.filaSuperior}>
                {asignatura.icono_url ? <Image source={{ uri: asignatura.icono_url }} style={styles.icono} /> : (
                  <View style={styles.iconoVacio}><Ionicons name="school-outline" size={24} color={color.texto} /></View>
                )}
                <View style={styles.textos}>
                  <Text style={[styles.nombre, { color: color.texto, fontSize: 17 * escala }]} numberOfLines={1}>{asignatura.nombre}</Text>
                  <View style={styles.barraFondo}><View style={[styles.barraRelleno, { width: `${porcentaje}%` }]} /></View>
                  <Text style={[styles.progresoTexto, { color: color.texto }]}>{asignatura.retosCompletados}/{asignatura.totalRetos} desafíos · {porcentaje}%</Text>
                </View>
              </View>
              <Pressable style={styles.boton} onPress={() => router.push({ pathname: '/asignatura/[id]', params: { id: asignatura.id } })}>
                <Text style={styles.botonTexto}>Desafíos</Text>
                <Ionicons name="chevron-forward" size={17} color={COLOR_TEXTO} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <NavegacionInferior activa="asignaturas" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  titulo: { fontWeight: '800', color: COLOR_TEXTO }, espaciador: { width: 24 },
  contenido: { paddingBottom: 24, paddingTop: 8 }, estado: { textAlign: 'center', color: COLOR_TEXTO_SUAVE, marginTop: 24 },
  error: { textAlign: 'center', color: '#B3261E', marginTop: 24 },
  tarjeta: { borderRadius: 20, padding: 14, marginBottom: 16 }, filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLOR_FONDO },
  iconoVacio: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1 }, nombre: { fontWeight: '800', marginBottom: 8 },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.58)', overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: COLOR_FONDO, borderRadius: 4 }, progresoTexto: { fontSize: 11, marginTop: 5, fontWeight: '600' },
  boton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.62)', borderRadius: 12, paddingVertical: 11, marginTop: 14 },
  botonTexto: { fontSize: 13, fontWeight: '800', color: COLOR_TEXTO },
});
