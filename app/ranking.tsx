import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import NavegacionInferior from '../components/NavegacionInferior';
import {
  COLOR_AMARILLO, COLOR_AZUL, COLOR_AZUL_CLARO, COLOR_FONDO,
  COLOR_FONDO_CAMPO, COLOR_MORADO, COLOR_MORADO_CLARO, COLOR_TEXTO, COLOR_TEXTO_SUAVE,
} from '../lib/colores';
import { supabase } from '../lib/supabase';

interface FilaRanking {
  usuario_id: string;
  puntos_totales: number;
  usuarios: { nombre: string; apellido: string; foto_url: string | null } | null;
}

function Avatar({ fila, lugar }: { fila?: FilaRanking; lugar: 1 | 2 | 3 }) {
  const estilo = lugar === 1 ? styles.avatarPrimero : lugar === 2 ? styles.avatarSegundo : styles.avatarTercero;
  if (fila?.usuarios?.foto_url) return <Image source={{ uri: fila.usuarios.foto_url }} style={[styles.avatar, estilo]} />;
  return <View style={[styles.avatar, estilo]}><Ionicons name="person" size={lugar === 1 ? 31 : 25} color={COLOR_FONDO} /></View>;
}

export default function Ranking() {
  const [filas, setFilas] = useState<FilaRanking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    async function cargar() {
      setCargando(true);
      setErrorCarga(null);
      const { data, error } = await supabase.from('ranking_global')
        .select('usuario_id, puntos_totales, fecha_actualizacion, usuarios(nombre, apellido, foto_url)')
        .order('puntos_totales', { ascending: false })
        .order('fecha_actualizacion', { ascending: true });
      if (error) setErrorCarga('No se pudo cargar el ranking.');
      else setFilas((data as unknown as FilaRanking[]) ?? []);
      setCargando(false);
    }
    void cargar();
  }, []));

  const [primero, segundo, tercero] = filas;
  const podio = [segundo, primero, tercero];
  const lugares: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/inicio')} hitSlop={12}>
          <Ionicons name="arrow-back-outline" size={24} color={COLOR_TEXTO} />
        </Pressable>
        <Text style={styles.titulo}>Ranking</Text><View style={styles.espaciador} />
      </View>
      <View style={styles.filtro}><Text style={styles.filtroTexto}>Clasificación general</Text></View>
      {errorCarga && <Text style={styles.error}>{errorCarga}</Text>}
      {!cargando && !errorCarga && filas.length === 0 && <Text style={styles.estado}>Todavía no hay participantes.</Text>}

      {filas.length > 0 && (
        <View style={styles.podio}>
          {podio.map((fila, indice) => {
            const lugar = lugares[indice];
            return (
              <View key={lugar} style={styles.podioColumna}>
                {fila ? <Avatar fila={fila} lugar={lugar} /> : <View style={styles.avatarEspacio} />}
                <Text style={styles.podioNombre} numberOfLines={1}>{fila?.usuarios?.nombre ?? '—'}</Text>
                <Text style={styles.podioPuntos}>{fila ? `${fila.puntos_totales} pts` : ''}</Text>
                <View style={[styles.escalon, lugar === 1 ? styles.escalonPrimero : lugar === 2 ? styles.escalonSegundo : styles.escalonTercero]}>
                  <Text style={styles.numeroEscalon}>{lugar}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={filas.slice(3)}
        keyExtractor={(item) => item.usuario_id}
        contentContainerStyle={styles.lista}
        renderItem={({ item, index }) => (
          <View style={styles.fila}>
            <Text style={styles.posicion}>{index + 4}</Text>
            {item.usuarios?.foto_url ? <Image source={{ uri: item.usuarios.foto_url }} style={styles.filaAvatar} /> : (
              <View style={styles.filaAvatar}><Ionicons name="person" size={18} color={COLOR_TEXTO_SUAVE} /></View>
            )}
            <Text style={styles.nombre} numberOfLines={1}>{item.usuarios ? `${item.usuarios.nombre} ${item.usuarios.apellido}`.trim() : 'Usuario'}</Text>
            <Text style={styles.puntos}>{item.puntos_totales} pts</Text>
          </View>
        )}
      />
      <NavegacionInferior activa="ranking" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO }, encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14 },
  titulo: { fontSize: 22, fontWeight: '900', color: COLOR_TEXTO }, espaciador: { width: 24 },
  filtro: { alignSelf: 'center', backgroundColor: COLOR_MORADO, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8, marginTop: 14 }, filtroTexto: { color: COLOR_FONDO, fontSize: 13, fontWeight: '700' },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingHorizontal: 12, marginTop: 20, marginBottom: 18 },
  podioColumna: { alignItems: 'center', width: 96 }, avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR_MORADO_CLARO, marginBottom: 6 },
  avatarPrimero: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLOR_AMARILLO }, avatarSegundo: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLOR_MORADO_CLARO },
  avatarTercero: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLOR_AZUL_CLARO }, avatarEspacio: { height: 62 },
  podioNombre: { width: 92, textAlign: 'center', fontSize: 13, fontWeight: '700', color: COLOR_TEXTO }, podioPuntos: { fontSize: 11, color: COLOR_TEXTO_SUAVE, marginBottom: 8 },
  escalon: { width: 92, borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', paddingTop: 10 },
  escalonPrimero: { height: 108, backgroundColor: COLOR_AMARILLO }, escalonSegundo: { height: 78, backgroundColor: COLOR_MORADO }, escalonTercero: { height: 62, backgroundColor: COLOR_AZUL },
  numeroEscalon: { fontSize: 22, fontWeight: '900', color: COLOR_FONDO }, lista: { paddingTop: 4, paddingBottom: 24 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, marginHorizontal: 16, marginBottom: 10 },
  posicion: { width: 18, fontWeight: '800', color: COLOR_TEXTO_SUAVE }, filaAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' },
  nombre: { flex: 1, fontSize: 14, fontWeight: '700', color: COLOR_TEXTO }, puntos: { fontWeight: '800', color: COLOR_TEXTO_SUAVE },
  error: { color: '#B3261E', textAlign: 'center', marginTop: 16 }, estado: { color: COLOR_TEXTO_SUAVE, textAlign: 'center', marginTop: 24 },
});
