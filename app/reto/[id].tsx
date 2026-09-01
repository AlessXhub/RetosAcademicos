// Pantalla para realizar un reto: crea el intento, muestra el material de
// apoyo (contenido multimedia) y las preguntas una por una, guarda cada
// respuesta y al finalizar:
//  - actualiza la racha de aprendizaje siempre que hay actividad;
//  - solo suma puntos al progreso global la PRIMERA vez que se completa
//    el reto (para que no se pueda repetir y ganar puntos infinitos);
//  - revisa si con eso se completaron todos los retos del nivel, y de ser
//    asi desbloquea el siguiente nivel de la asignatura;
//  - si el reto es "desafio_reloj", corre un cronometro por pregunta:
//    si se acaba el tiempo, la pregunta se marca incorrecta automaticamente.
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Reto, Pregunta, OpcionRespuesta, ContenidoMultimedia } from '../../lib/tipos';
import { obtenerPreguntaTriviaExterna } from '../../lib/api-trivia';
import { programarNotificacion, programarAlertaRachaRiesgo } from '../../lib/notificaciones';
import { finalizarRetoSeguro, PORCENTAJE_APROBACION } from '../../lib/gamificacion';
import { useProgreso } from '../../context/ProgresoContext';
import PreguntaOpcionMultiple from '../../components/PreguntaOpcionMultiple';
import { normalizarRespuesta } from '../../lib/calculos';
import { SEGUNDOS_POR_PREGUNTA_RELOJ } from '../../lib/configuracion-retos';

interface PreguntaConOpciones extends Pregunta {
  opciones_respuesta: OpcionRespuesta[];
}

export default function RealizarReto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refrescarProgreso, preferencias } = useProgreso();

  const [reto, setReto] = useState<Reto | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaConOpciones[]>([]);
  const [contenidos, setContenidos] = useState<ContenidoMultimedia[]>([]);
  const [intentoId, setIntentoId] = useState<number | null>(null);
  const [yaCompletadoAntes, setYaCompletadoAntes] = useState(false);
  const [indice, setIndice] = useState(0);
  const [opcionElegida, setOpcionElegida] = useState<number | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [puntosAcumulados, setPuntosAcumulados] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(SEGUNDOS_POR_PREGUNTA_RELOJ);
  const procesandoRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      async function iniciar() {
        setCargando(true);
        setError(null);
        setIndice(0);
        setPuntosAcumulados(0);
        setAciertos(0);
        setOpcionElegida(null);
        setRespuestaTexto('');
        try {
          const { data: auth, error: errorAuth } = await supabase.auth.getUser();
          if (errorAuth || !auth.user) throw new Error('La sesión expiró. Inicia sesión nuevamente.');

          const { data: retoData, error: errorReto } = await supabase
            .from('retos').select('*').eq('id', Number(id)).single();
          if (errorReto || !retoData) throw new Error('No se pudo cargar el reto.');
          if (!vigente) return;
          setReto(retoData);

          const { data: intentoPrevio, error: errorPrevio } = await supabase
          .from('intentos_reto')
          .select('id')
          .eq('usuario_id', auth.user.id)
          .eq('reto_id', Number(id))
          .eq('estado', 'completado')
          .gte('porcentaje', PORCENTAJE_APROBACION)
          .limit(1)
          .maybeSingle();
          if (errorPrevio) throw new Error('No se pudo consultar el historial del reto.');
          setYaCompletadoAntes(!!intentoPrevio);

          const { data: contenidoData, error: errorContenido } = await supabase
          .from('reto_contenido')
          .select('contenidos_multimedia(*)')
          .eq('reto_id', Number(id));
          if (errorContenido) throw new Error('No se pudo cargar el material de apoyo.');
          const filasContenido = (contenidoData ?? []) as unknown as {
            contenidos_multimedia: ContenidoMultimedia | null;
          }[];
          const listaContenidos = filasContenido
            .map((fila) => fila.contenidos_multimedia)
            .filter((contenido): contenido is ContenidoMultimedia => contenido?.estado === 'activo');
          setContenidos(listaContenidos);

          const { data: preguntasData, error: errorPreguntas } = await supabase
          .from('preguntas')
          .select('*, opciones_respuesta(*)')
          .eq('reto_id', Number(id))
          .eq('estado', 'activo')
          .order('orden');
          if (errorPreguntas) throw new Error('No se pudieron cargar las preguntas.');

          let listaPreguntas = (preguntasData as PreguntaConOpciones[]) ?? [];

          if (retoData.tipo === 'trivia' && listaPreguntas.length === 0) {
            const externa = await obtenerPreguntaTriviaExterna();
            listaPreguntas = [{
            id: -1,
            reto_id: Number(id),
            enunciado: externa.enunciado,
            tipo: 'opcion_multiple',
            puntos: retoData.puntos_maximos,
            orden: 1,
            respuesta_esperada: null,
            estado: 'activo',
            opciones_respuesta: externa.opciones.map((texto, indiceOpcion) => ({
              id: -1 - indiceOpcion,
              pregunta_id: -1,
              texto_opcion: texto,
              es_correcta: texto === externa.respuestaCorrecta,
              orden: indiceOpcion,
            })),
            }];
          }
          if (!vigente) return;
          setPreguntas(listaPreguntas);
          if (listaPreguntas.length === 0) return;

          const { data: intento, error: errorIntento } = await supabase
          .from('intentos_reto')
          .insert({ usuario_id: auth.user.id, reto_id: Number(id) })
          .select()
          .single();
          if (errorIntento || !intento) throw new Error('No se pudo iniciar el intento.');
          if (vigente) setIntentoId(intento.id);
        } catch (causa) {
          if (vigente) setError(causa instanceof Error ? causa.message : 'No se pudo iniciar el reto.');
        } finally {
          if (vigente) setCargando(false);
        }
      }
      void iniciar();
      return () => { vigente = false; };
    }, [id])
  );

  const preguntaActual = preguntas[indice];

  async function guardarRespuestaActual() {
    if (!preguntaActual || !intentoId) return null;

    let esCorrecta = false;
    let puntosObtenidos = 0;

    if (preguntaActual.tipo === 'completar') {
      const esperado = normalizarRespuesta(preguntaActual.respuesta_esperada ?? '');
      esCorrecta = esperado.length > 0 && normalizarRespuesta(respuestaTexto) === esperado;
    } else {
      const opcion = preguntaActual.opciones_respuesta.find((o) => o.id === opcionElegida);
      esCorrecta = !!opcion?.es_correcta;
    }
    if (esCorrecta) puntosObtenidos = preguntaActual.puntos;

    if (preguntaActual.id > 0) {
      const { error: errorRespuesta } = await supabase.from('respuestas_usuario').insert({
        intento_id: intentoId,
        pregunta_id: preguntaActual.id,
        opcion_id: preguntaActual.tipo === 'completar' ? null : opcionElegida,
        respuesta_texto: preguntaActual.tipo === 'completar' ? respuestaTexto.trim() : null,
        es_correcta: esCorrecta,
        puntos_obtenidos: puntosObtenidos,
      });
      if (errorRespuesta) throw new Error('No se pudo guardar la respuesta.');
    }

    return { esCorrecta, puntosObtenidos };
  }

  async function siguientePregunta() {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    setEnviando(true);
    setError(null);
    try {
      const resultado = await guardarRespuestaActual();
      if (!resultado) return;

      const nuevosPuntos = puntosAcumulados + resultado.puntosObtenidos;
      const nuevosAciertos = aciertos + (resultado.esCorrecta ? 1 : 0);
      setPuntosAcumulados(nuevosPuntos);
      setAciertos(nuevosAciertos);
      setOpcionElegida(null);
      setRespuestaTexto('');

      if (indice + 1 < preguntas.length) setIndice(indice + 1);
      else await finalizarReto(nuevosPuntos, nuevosAciertos);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar la respuesta.');
    } finally {
      procesandoRef.current = false;
      setEnviando(false);
    }
  }

  // referencia siempre actualizada de siguientePregunta, para poder llamarla
  // desde el cronometro sin quedarnos con datos viejos (stale closure)
  const siguientePreguntaRef = useRef(siguientePregunta);
  useEffect(() => { siguientePreguntaRef.current = siguientePregunta; });

  // Cronometro del desafio contra reloj: se reinicia en cada pregunta y,
  // si llega a cero, avanza automaticamente (la pregunta queda sin
  // responder, es decir incorrecta).
  useEffect(() => {
    if (!reto || reto.tipo !== 'desafio_reloj' || !preguntaActual) return;
    setTiempoRestante(SEGUNDOS_POR_PREGUNTA_RELOJ);
    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          siguientePreguntaRef.current();
          return SEGUNDOS_POR_PREGUNTA_RELOJ;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
  }, [indice, preguntaActual, reto]);

  async function finalizarReto(puntosFinales: number, aciertosFinales: number) {
    if (!intentoId || !reto) return;
    const resultado = await finalizarRetoSeguro({
      intentoId,
      reto,
      puntos: puntosFinales,
      aciertos: aciertosFinales,
      totalPreguntas: preguntas.length,
    });

    const { data: auth } = await supabase.auth.getUser();
    if (auth.user && preferencias.notificacionesActivadas) {
      await programarAlertaRachaRiesgo(auth.user.id, resultado.rachaActual);
      for (const insignia of resultado.insigniasNuevas) {
        await programarNotificacion(
          auth.user.id,
          'felicitacion_logro',
          '¡Nueva insignia!',
          `Obtuviste la insignia "${insignia.nombre}".`
        );
      }
      if (resultado.nivelDesbloqueado) {
        await programarNotificacion(
          auth.user.id,
          'nuevo_reto',
          '¡Nivel desbloqueado!',
          `Ya puedes jugar "${resultado.nivelDesbloqueado}".`
        );
      }
    }
    await refrescarProgreso();
    router.replace({
      pathname: '/resultado/[id]',
      params: {
        id: intentoId,
        repetido: yaCompletadoAntes ? '1' : '0',
        aprobado: resultado.aprobado ? '1' : '0',
        puntosOtorgados: String(resultado.puntosOtorgados),
      },
    });
  }

  function abrirContenido(contenido: ContenidoMultimedia) {
    if (contenido.tipo === 'imagen') return;
    Linking.canOpenURL(contenido.url_recurso)
      .then((permitido) => {
        if (!permitido) throw new Error();
        return Linking.openURL(contenido.url_recurso);
      })
      .catch(() => setError('No se pudo abrir el material de apoyo.'));
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!preguntaActual) {
    return (
      <View style={styles.centro}>
        <Text style={error ? styles.error : undefined}>
          {error ?? 'Este reto todavía no tiene preguntas configuradas.'}
        </Text>
        <Pressable style={styles.boton} onPress={() => router.back()}>
          <Text style={styles.textoBoton}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {indice === 0 && contenidos.length > 0 && (
        <View style={styles.materialApoyo}>
          <Text style={styles.materialTitulo}>Material de apoyo</Text>
          {contenidos.map((c) => (
            <Pressable key={c.id} onPress={() => abrirContenido(c)} style={styles.itemContenido}>
              {c.tipo === 'imagen' ? (
                <Image source={{ uri: c.url_recurso }} style={styles.imagenContenido} />
              ) : (
                <Ionicons
                  name={c.tipo === 'video' ? 'play-circle-outline' : c.tipo === 'pdf' ? 'document-text-outline' : 'book-outline'}
                  size={22}
                  color="#2f5496"
                />
              )}
              <Text style={styles.itemContenidoTitulo}>{c.titulo}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.filaEncabezado}>
        <Text style={styles.progreso}>Pregunta {indice + 1} de {preguntas.length}</Text>
        {reto?.tipo === 'desafio_reloj' && (
          <View style={styles.cronometro}>
            <Ionicons name="timer-outline" size={16} color={tiempoRestante <= 5 ? '#b3261e' : '#2f5496'} />
            <Text style={[styles.cronometroTexto, tiempoRestante <= 5 && styles.cronometroUrgente]}>
              {tiempoRestante}s
            </Text>
          </View>
        )}
      </View>
      {yaCompletadoAntes && (
        <Text style={styles.avisoRepetido}>Modo práctica: ya completaste este reto antes, así que esta vez no sumará puntos.</Text>
      )}

      {preguntaActual.tipo === 'completar' ? (
        <View>
          <Text style={styles.enunciado}>{preguntaActual.enunciado}</Text>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu respuesta"
            value={respuestaTexto}
            onChangeText={setRespuestaTexto}
          />
        </View>
      ) : (
        <PreguntaOpcionMultiple
          pregunta={preguntaActual}
          opciones={preguntaActual.opciones_respuesta}
          opcionSeleccionada={opcionElegida}
          onSeleccionar={setOpcionElegida}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.boton, enviando && styles.botonDeshabilitado]}
        onPress={siguientePregunta}
        disabled={
          enviando ||
          (preguntaActual.tipo === 'completar'
            ? respuestaTexto.trim().length === 0
            : opcionElegida === null)
        }
      >
        <Text style={styles.textoBoton}>
          {enviando ? 'Guardando...' : indice + 1 < preguntas.length ? 'Siguiente' : 'Finalizar reto'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'center' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  materialApoyo: { backgroundColor: '#f2f4f8', borderRadius: 10, padding: 12, marginBottom: 16 },
  materialTitulo: { fontSize: 13, fontWeight: '700', marginBottom: 8, opacity: 0.8 },
  itemContenido: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  imagenContenido: { width: 60, height: 60, borderRadius: 8 },
  itemContenidoTitulo: { fontSize: 13, flex: 1 },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progreso: { fontSize: 13, opacity: 0.6 },
  cronometro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cronometroTexto: { fontSize: 14, fontWeight: '700', color: '#2f5496' },
  cronometroUrgente: { color: '#b3261e' },
  avisoRepetido: { fontSize: 12, color: '#b3261e', marginBottom: 10 },
  enunciado: { fontSize: 17, fontWeight: '600', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15 },
  boton: { backgroundColor: '#2f5496', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  error: { color: '#b3261e', textAlign: 'center', marginTop: 12 },
});
