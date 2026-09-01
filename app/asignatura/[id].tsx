// Niveles de una asignatura, con estado completado, disponible o bloqueado.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  COLOR_AMARILLO, COLOR_FONDO, COLOR_FONDO_CAMPO, COLOR_MORADO,
  COLOR_MORADO_CLARO, COLOR_TEXTO, COLOR_TEXTO_SUAVE,
} from '../../lib/colores';
import { PORCENTAJE_APROBACION } from '../../lib/gamificacion';
import { supabase } from '../../lib/supabase';
import { Asignatura, Nivel } from '../../lib/tipos';

export default function DetalleAsignatura() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asignatura, setAsignatura] = useState<Asignatura | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [desbloqueados, setDesbloqueados] = useState<Set<number>>(new Set());
  const [completados, setCompletados] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    async function cargar() {
      setCargando(true);
      setErrorCarga(null);
      const { data: auth, error: errorAuth } = await supabase.auth.getUser();
      if (errorAuth || !auth.user) {
        setErrorCarga('La sesión expiró.');
        setCargando(false);
        return;
      }

      const [respuestaAsignatura, respuestaNiveles, respuestaDesbloqueos] = await Promise.all([
        supabase.from('asignaturas').select('*').eq('id', Number(id)).maybeSingle(),
        supabase.from('niveles').select('*').eq('asignatura_id', Number(id)).eq('estado', 'activo').order('orden'),
        supabase.from('desbloqueos_contenido').select('nivel_id').eq('usuario_id', auth.user.id),
      ]);
      const primerError = respuestaAsignatura.error ?? respuestaNiveles.error ?? respuestaDesbloqueos.error;
      if (primerError) {
        setErrorCarga('No se pudieron cargar los niveles de la asignatura.');
        setCargando(false);
        return;
      }

      const listaNiveles = (respuestaNiveles.data as Nivel[]) ?? [];
      setAsignatura((respuestaAsignatura.data as Asignatura | null) ?? null);
      setNiveles(listaNiveles);
      setDesbloqueados(new Set((respuestaDesbloqueos.data ?? []).map((item) => item.nivel_id)));
      setCompletados(new Set());

      const idsNiveles = listaNiveles.map((nivel) => nivel.id);
      if (idsNiveles.length > 0) {
        const respuestaRetos = await supabase.from('retos').select('id, nivel_id')
          .in('nivel_id', idsNiveles).eq('estado', 'activo');
        if (respuestaRetos.error) {
          setErrorCarga('No se pudo consultar el avance de los desafíos.');
          setCargando(false);
          return;
        }
        const retos = respuestaRetos.data ?? [];
        const respuestaIntentos = retos.length > 0
          ? await supabase.from('intentos_reto').select('reto_id').eq('usuario_id', auth.user.id)
            .eq('estado', 'completado').gte('porcentaje', PORCENTAJE_APROBACION)
            .in('reto_id', retos.map((reto) => reto.id))
          : { data: [], error: null };
        if (respuestaIntentos.error) {
          setErrorCarga('No se pudo consultar el avance de los desafíos.');
          setCargando(false);
          return;
        }
        const retosAprobados = new Set((respuestaIntentos.data ?? []).map((intento) => intento.reto_id));
        setCompletados(new Set(listaNiveles.filter((nivel) => {
          const retosNivel = retos.filter((reto) => reto.nivel_id === nivel.id);
          return retosNivel.length > 0 && retosNivel.every((reto) => retosAprobados.has(reto.id));
        }).map((nivel) => nivel.id)));
      }
      setCargando(false);
    }
    void cargar();
  }, [id]));

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/asignatura')} hitSlop={12}>
          <Ionicons name="arrow-back-outline" size={23} color={COLOR_TEXTO} />
        </Pressable>
      </View>
      <View style={styles.tituloBloque}>
        <Text style={styles.titulo}>Desafíos</Text>
        <Text style={styles.subtitulo}>{asignatura?.nombre ?? ''}</Text>
      </View>
      {errorCarga && <Text style={styles.error}>{errorCarga}</Text>}
      <FlatList
        data={niveles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={!cargando && !errorCarga ? <Text style={styles.vacio}>No hay niveles activos.</Text> : null}
        renderItem={({ item, index }) => {
          const desbloqueado = index === 0 || desbloqueados.has(item.id);
          const completado = completados.has(item.id);
          return (
            <Pressable style={[styles.fila, !desbloqueado && styles.filaBloqueada]} disabled={!desbloqueado}
              onPress={() => router.push({ pathname: '/nivel/[id]', params: { id: item.id } })}>
              <Ionicons
                name={completado ? 'checkmark-circle' : desbloqueado ? 'play-circle' : 'lock-closed'}
                size={27}
                color={completado ? '#2E9B63' : desbloqueado ? COLOR_MORADO : '#A0A0A0'}
              />
              <View style={styles.filaTextos}>
                <Text style={styles.filaTitulo}>Nivel {item.numero_nivel} · {item.nombre}</Text>
                {completado ? (
                  <View style={styles.estrellas}>
                    {[0, 1, 2].map((estrella) => <Ionicons key={estrella} name="star" size={13} color={COLOR_AMARILLO} />)}
                    <Text style={styles.filaEstado}>  Completado</Text>
                  </View>
                ) : (
                  <Text style={[styles.filaEstado, !desbloqueado && styles.estadoBloqueado]}>
                    {desbloqueado ? 'Disponible ahora' : 'Bloqueado'}
                  </Text>
                )}
              </View>
              {desbloqueado && !completado && <Ionicons name="chevron-forward" size={20} color={COLOR_MORADO_CLARO} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO }, encabezado: { paddingHorizontal: 16, paddingTop: 14 },
  tituloBloque: { paddingHorizontal: 16, marginTop: 8, marginBottom: 14 }, titulo: { fontSize: 22, fontWeight: '800', color: COLOR_TEXTO },
  subtitulo: { fontSize: 14, fontWeight: '600', color: COLOR_MORADO, marginTop: 2 }, lista: { paddingHorizontal: 16, paddingBottom: 24 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10 },
  filaBloqueada: { opacity: 0.55 }, filaTextos: { flex: 1 }, filaTitulo: { fontSize: 15, fontWeight: '700', color: COLOR_TEXTO },
  filaEstado: { fontSize: 12, color: COLOR_TEXTO_SUAVE, marginTop: 3, fontWeight: '600' }, estadoBloqueado: { color: '#8A8A8A' },
  estrellas: { flexDirection: 'row', alignItems: 'center', marginTop: 4 }, error: { color: '#B3261E', marginHorizontal: 16, marginBottom: 8 },
  vacio: { color: COLOR_TEXTO_SUAVE, marginTop: 10 },
});
