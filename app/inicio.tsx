// Inicio del estudiante: resume nivel, puntos, racha y accesos principales.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import NavegacionInferior from '../components/NavegacionInferior';
import { useAuth } from '../context/AuthContext';
import { useProgreso } from '../context/ProgresoContext';
import {
  COLOR_AMARILLO, COLOR_AZUL, COLOR_AZUL_CLARO, COLOR_FONDO,
  COLOR_MORADO, COLOR_MORADO_CLARO, COLOR_NARANJA, COLOR_TEXTO,
} from '../lib/colores';
import { supabase } from '../lib/supabase';
import { Asignatura } from '../lib/tipos';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PUNTOS_POR_NIVEL = 100;

export default function Inicio() {
  const { usuario, recargarPerfil } = useAuth();
  const { progreso, error: errorProgreso } = useProgreso();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    void recargarPerfil();
    async function cargarAsignaturas() {
      setErrorCarga(null);
      const { data, error } = await supabase.from('asignaturas').select('*')
        .eq('estado', 'activo').order('nombre');
      if (error) {
        setErrorCarga('No se pudieron cargar las asignaturas.');
        return;
      }
      setAsignaturas((data as Asignatura[]) ?? []);
    }
    void cargarAsignaturas();
  }, [recargarPerfil]));

  const puntosTotales = progreso?.puntos_totales ?? 0;
  const puntosEnNivel = puntosTotales % PUNTOS_POR_NIVEL;
  const porcentajeNivel = (puntosEnNivel / PUNTOS_POR_NIVEL) * 100;
  const faltantes = PUNTOS_POR_NIVEL - puntosEnNivel;
  const diasActivos = Math.min(progreso?.racha_actual ?? 0, 7);

  return (
    <View style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <View style={styles.encabezado}>
          {usuario?.foto_url ? (
            <Image source={{ uri: usuario.foto_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarVacio}><Ionicons name="person" size={23} color={COLOR_FONDO} /></View>
          )}
          <View style={styles.saludo}>
            <Text style={styles.saludoTexto}>Hola,</Text>
            <Text style={styles.nombre} numberOfLines={1}>{usuario?.nombre ?? 'Estudiante'}</Text>
          </View>
          <View style={styles.nivelBadge}><Text style={styles.nivelTexto}>Nv. {progreso?.nivel_actual ?? 1}</Text></View>
        </View>

        <View style={styles.tarjetaPuntos}>
          <View style={styles.filaPuntos}>
            <Text style={styles.puntos}>{puntosTotales.toLocaleString('es')} pts</Text>
            <Text style={styles.metaNivel}>{faltantes} para el nivel {(progreso?.nivel_actual ?? 1) + 1}</Text>
          </View>
          <View style={styles.barraFondo}>
            <View style={[styles.barraRelleno, { width: `${porcentajeNivel}%` }]} />
          </View>
        </View>

        {(errorCarga || errorProgreso) && <Text style={styles.error}>{errorCarga ?? errorProgreso}</Text>}

        <View style={styles.rachaTarjeta}>
          <View style={styles.rachaCirculo}><Text style={styles.rachaNumero}>{progreso?.racha_actual ?? 0}</Text></View>
          <Text style={styles.rachaEtiqueta}>días de racha</Text>
          <View style={styles.diasFila}>
            {DIAS_SEMANA.map((dia, indice) => (
              <View key={dia} style={styles.diaColumna}>
                <Text style={styles.diaTexto}>{dia}</Text>
                <View style={[styles.diaCirculo, indice < diasActivos && styles.diaActivo]} />
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
        <View style={styles.accesosFila}>
          <Pressable style={[styles.acceso, styles.accesoAmarillo]} onPress={() => router.push('/asignatura')}>
            <Ionicons name="book-outline" size={22} color={COLOR_TEXTO} /><Text style={styles.accesoTexto}>Asignaturas</Text>
          </Pressable>
          <Pressable style={[styles.acceso, styles.accesoNaranja]} onPress={() => router.push('/ranking')}>
            <Ionicons name="podium-outline" size={22} color={COLOR_TEXTO} /><Text style={styles.accesoTexto}>Ranking</Text>
          </Pressable>
        </View>
        <Pressable style={styles.accesoLogros} onPress={() => router.push('/logros')}>
          <Ionicons name="trophy-outline" size={22} color={COLOR_TEXTO} /><Text style={styles.accesoTexto}>Logros</Text>
        </Pressable>

        <Text style={styles.seccionTitulo}>Continúa donde te quedaste</Text>
        {!errorCarga && asignaturas.length === 0 && <Text style={styles.vacio}>Todavía no hay asignaturas disponibles.</Text>}
        {asignaturas.slice(0, 2).map((asignatura) => (
          <Pressable key={asignatura.id} style={styles.continuarTarjeta}
            onPress={() => router.push({ pathname: '/asignatura/[id]', params: { id: asignatura.id } })}>
            {asignatura.icono_url ? (
              <Image source={{ uri: asignatura.icono_url }} style={styles.iconoAsignatura} />
            ) : (
              <View style={styles.iconoVacio}><Ionicons name="school-outline" size={22} color={COLOR_MORADO} /></View>
            )}
            <View style={styles.textosAsignatura}>
              <Text style={styles.nombreAsignatura}>{asignatura.nombre}</Text>
              <Text style={styles.descripcionAsignatura} numberOfLines={1}>{asignatura.descripcion ?? 'Continúa con tus desafíos'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLOR_MORADO} />
          </Pressable>
        ))}
      </ScrollView>
      <NavegacionInferior activa="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO },
  contenido: { padding: 16, paddingBottom: 28 },
  encabezado: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOR_MORADO, borderRadius: 28, padding: 7, gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLOR_FONDO },
  avatarVacio: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLOR_MORADO_CLARO, alignItems: 'center', justifyContent: 'center' },
  saludo: { flex: 1 }, saludoTexto: { color: '#EFE9FF', fontSize: 11 },
  nombre: { color: COLOR_FONDO, fontSize: 17, fontWeight: '800' },
  nivelBadge: { backgroundColor: COLOR_FONDO, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  nivelTexto: { color: COLOR_MORADO, fontWeight: '800' },
  tarjetaPuntos: { backgroundColor: COLOR_AMARILLO, borderRadius: 18, padding: 14, marginTop: 16 },
  filaPuntos: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  puntos: { fontSize: 15, fontWeight: '800', color: COLOR_TEXTO }, metaNivel: { fontSize: 11, fontWeight: '600', color: '#5A4400' },
  barraFondo: { height: 12, borderRadius: 6, backgroundColor: COLOR_FONDO, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 6, backgroundColor: COLOR_NARANJA }, error: { color: '#B3261E', marginTop: 10 },
  rachaTarjeta: { backgroundColor: COLOR_MORADO, borderRadius: 24, marginTop: 34, paddingTop: 38, paddingBottom: 16, paddingHorizontal: 14, alignItems: 'center' },
  rachaCirculo: { position: 'absolute', top: -27, width: 68, height: 68, borderRadius: 34, backgroundColor: COLOR_FONDO, borderWidth: 6, borderColor: COLOR_MORADO, alignItems: 'center', justifyContent: 'center' },
  rachaNumero: { fontSize: 24, fontWeight: '900', color: COLOR_MORADO }, rachaEtiqueta: { color: COLOR_FONDO, fontSize: 12, marginBottom: 12 },
  diasFila: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }, diaColumna: { alignItems: 'center', gap: 6 },
  diaTexto: { color: COLOR_FONDO, fontSize: 11, fontWeight: '600' }, diaCirculo: { width: 25, height: 25, borderRadius: 13, backgroundColor: COLOR_FONDO }, diaActivo: { backgroundColor: COLOR_AZUL },
  seccionTitulo: { fontSize: 15, fontWeight: '800', color: COLOR_TEXTO, marginTop: 22, marginBottom: 10 }, accesosFila: { flexDirection: 'row', gap: 12 },
  acceso: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', borderRadius: 17, paddingVertical: 17 },
  accesoAmarillo: { backgroundColor: COLOR_AMARILLO }, accesoNaranja: { backgroundColor: COLOR_NARANJA },
  accesoLogros: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: COLOR_NARANJA, borderRadius: 17, paddingVertical: 17, marginTop: 12 },
  accesoTexto: { color: COLOR_TEXTO, fontWeight: '800' },
  continuarTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLOR_AZUL_CLARO, borderRadius: 16, padding: 12, marginBottom: 12 },
  iconoAsignatura: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLOR_FONDO },
  iconoVacio: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLOR_FONDO, alignItems: 'center', justifyContent: 'center' },
  textosAsignatura: { flex: 1 }, nombreAsignatura: { fontSize: 15, fontWeight: '800', color: '#0C3A5C' },
  descripcionAsignatura: { fontSize: 12, color: '#2F6FB0', marginTop: 2 }, vacio: { color: '#6B6B6B' },
});
