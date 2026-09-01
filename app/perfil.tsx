import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import NavegacionInferior from '../components/NavegacionInferior';
import { useAuth } from '../context/AuthContext';
import { useProgreso } from '../context/ProgresoContext';
import { COLOR_FONDO, COLOR_FONDO_CAMPO, COLOR_MORADO, COLOR_MORADO_CLARO, COLOR_NARANJA, COLOR_TEXTO, COLOR_TEXTO_SUAVE } from '../lib/colores';
import { cancelarNotificacionesUsuario, pedirPermisoNotificaciones, programarRecordatorioDiario } from '../lib/notificaciones';
import { supabase } from '../lib/supabase';

function etiquetaNivel(nivel: number) {
  if (nivel <= 3) return 'Principiante';
  if (nivel <= 7) return 'Intermedio';
  return 'Avanzado';
}

export default function Perfil() {
  const { width } = useWindowDimensions();
  const { usuario, session, errorPerfil, recargarPerfil } = useAuth();
  const { progreso, insignias, retosCompletados, preferencias, alternarNotificaciones } = useProgreso();
  const [posicionRanking, setPosicionRanking] = useState<number | null>(null);
  const escala = Math.min(Math.max(width / 390, 0.85), 1.25);

  useFocusEffect(useCallback(() => {
    void recargarPerfil();
    async function cargarPosicion() {
      if (!session?.user.id) return;
      const { data, error } = await supabase.from('ranking_global')
        .select('usuario_id, puntos_totales, fecha_actualizacion')
        .order('puntos_totales', { ascending: false })
        .order('fecha_actualizacion', { ascending: true });
      if (!error) {
        const indice = (data ?? []).findIndex((fila) => fila.usuario_id === session.user.id);
        setPosicionRanking(indice >= 0 ? indice + 1 : null);
      }
    }
    void cargarPosicion();
  }, [recargarPerfil, session?.user.id]));

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('No se pudo cerrar sesión', error.message);
  }

  async function cambiarNotificaciones(activadas: boolean) {
    const usuarioId = session?.user.id;
    if (!usuarioId) return;
    if (!activadas) {
      await alternarNotificaciones(false);
      await cancelarNotificacionesUsuario(usuarioId);
      return;
    }
    const permiso = await pedirPermisoNotificaciones();
    if (!permiso) {
      await alternarNotificaciones(false);
      Alert.alert('Permiso requerido', 'Activa las notificaciones desde los ajustes del dispositivo.');
      return;
    }
    await alternarNotificaciones(true);
    await programarRecordatorioDiario(usuarioId);
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezadoBarra}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/inicio')} hitSlop={12}>
          <Ionicons name="arrow-back-outline" size={24} color={COLOR_TEXTO} />
        </Pressable>
        <Text style={[styles.titulo, { fontSize: 20 * escala }]}>Perfil</Text><View style={styles.espaciador} />
      </View>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingHorizontal: width * 0.05 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.encabezadoPerfil}>
          {usuario?.foto_url ? <Image source={{ uri: usuario.foto_url }} style={styles.avatar} /> : (
            <View style={styles.avatarVacio}><Ionicons name="person" size={45} color={COLOR_FONDO} /></View>
          )}
          <Text style={[styles.nombre, { fontSize: 20 * escala }]}>{usuario?.nombre} {usuario?.apellido}</Text>
          <Text style={styles.correo}>{session?.user.email ?? ''}</Text>
          <View style={styles.nivelBadge}><Text style={styles.nivelTexto}>Nivel {progreso?.nivel_actual ?? 1} · {etiquetaNivel(progreso?.nivel_actual ?? 1)}</Text></View>
        </View>

        {errorPerfil && <Text style={styles.error}>{errorPerfil}</Text>}
        <View style={styles.gridEstadisticas}>
          <View style={styles.estadistica}><Text style={styles.estadisticaValor}>{(progreso?.puntos_totales ?? 0).toLocaleString('es')}</Text><Text style={styles.estadisticaEtiqueta}>Puntos totales</Text></View>
          <View style={styles.estadistica}><Text style={styles.estadisticaValor}>{progreso?.racha_actual ?? 0}</Text><Text style={styles.estadisticaEtiqueta}>Racha (días)</Text></View>
          <View style={styles.estadistica}><Text style={styles.estadisticaValor}>{retosCompletados.size}</Text><Text style={styles.estadisticaEtiqueta}>Desafíos completados</Text></View>
          <View style={styles.estadistica}><Text style={styles.estadisticaValor}>{posicionRanking ? `#${posicionRanking}` : '—'}</Text><Text style={styles.estadisticaEtiqueta}>Posición ranking</Text></View>
        </View>
        <View style={styles.resumenLogros}><Ionicons name="trophy" size={19} color={COLOR_MORADO} /><Text style={styles.resumenTexto}>{insignias.length} insignias obtenidas</Text></View>
        <View style={styles.preferencia}>
          <View style={styles.preferenciaTexto}><Ionicons name="notifications-outline" size={20} color={COLOR_MORADO} /><Text style={styles.resumenTexto}>Notificaciones</Text></View>
          <Switch value={preferencias.notificacionesActivadas} onValueChange={cambiarNotificaciones} trackColor={{ true: COLOR_MORADO_CLARO }} thumbColor={preferencias.notificacionesActivadas ? COLOR_MORADO : '#F4F3F4'} />
        </View>

        <Pressable style={styles.botonPrimario} onPress={() => router.push('/editar_perfil')}><Text style={styles.textoBotonPrimario}>Editar perfil</Text></Pressable>
        {usuario?.rol === 'administrador' && (
          <Pressable style={styles.botonAdmin} onPress={() => router.push('/admin')}><Ionicons name="settings-outline" size={18} color={COLOR_FONDO} /><Text style={styles.textoBotonPrimario}>Panel de administración</Text></Pressable>
        )}
        <Pressable style={styles.botonSecundario} onPress={cerrarSesion}><Text style={styles.textoBotonSecundario}>Cerrar sesión</Text></Pressable>
      </ScrollView>
      <NavegacionInferior activa="perfil" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO }, encabezadoBarra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  titulo: { fontWeight: '800', color: COLOR_TEXTO }, espaciador: { width: 24 }, contenido: { paddingBottom: 28, paddingTop: 8 }, encabezadoPerfil: { alignItems: 'center', marginTop: 8 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EEE' }, avatarVacio: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLOR_MORADO_CLARO, justifyContent: 'center', alignItems: 'center' },
  nombre: { fontWeight: '800', marginTop: 12, color: COLOR_TEXTO }, correo: { fontSize: 13, color: COLOR_TEXTO_SUAVE, marginTop: 2 },
  nivelBadge: { backgroundColor: COLOR_MORADO, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginTop: 12 }, nivelTexto: { color: COLOR_FONDO, fontWeight: '700', fontSize: 13 },
  gridEstadisticas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  estadistica: { width: '48%', backgroundColor: COLOR_NARANJA, borderRadius: 16, paddingVertical: 19, paddingHorizontal: 5, alignItems: 'center' },
  estadisticaValor: { color: COLOR_FONDO, fontSize: 21, fontWeight: '900' }, estadisticaEtiqueta: { color: COLOR_FONDO, fontSize: 11, marginTop: 4, textAlign: 'center' },
  resumenLogros: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 13, padding: 14, marginTop: 14 },
  preferencia: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10 },
  preferenciaTexto: { flexDirection: 'row', alignItems: 'center', gap: 9 }, resumenTexto: { color: COLOR_TEXTO, fontWeight: '600' },
  botonPrimario: { backgroundColor: COLOR_MORADO, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  botonAdmin: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: COLOR_MORADO, borderRadius: 14, paddingVertical: 16, marginTop: 12 },
  textoBotonPrimario: { color: COLOR_FONDO, fontWeight: '800', fontSize: 15 }, botonSecundario: { borderWidth: 1.5, borderColor: COLOR_MORADO, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  textoBotonSecundario: { color: COLOR_MORADO, fontWeight: '800', fontSize: 15 }, error: { color: '#B3261E', textAlign: 'center', marginTop: 10 },
});
