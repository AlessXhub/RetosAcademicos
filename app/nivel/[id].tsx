// Muestra los retos activos de un nivel y su material multimedia.
// Los retos pueden filtrarse por tipo y muestran su estado de progreso.

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../../lib/supabase';

import {
  ContenidoMultimedia,
  Nivel,
  Reto,
} from '../../lib/tipos';

import { useProgreso } from '../../context/ProgresoContext';
import { SEGUNDOS_POR_PREGUNTA_RELOJ } from '../../lib/configuracion-retos';

import {
  COLOR_MORADO,
  COLOR_AMARILLO,
  COLOR_NARANJA,
  COLOR_TEXTO,
  COLOR_TEXTO_SUAVE,
  COLOR_FONDO,
  COLOR_FONDO_CAMPO,
} from '../../lib/colores';

type Filtro =
  | 'todo'
  | 'trivia'
  | 'contrarreloj';

const ICONO_POR_TIPO: Record<
  Reto['tipo'],
  keyof typeof Ionicons.glyphMap
> = {
  quiz: 'help-circle',
  verdadero_falso: 'checkmark-circle',
  trivia: 'sunny',
  desafio_reloj: 'time',
};

const ICONO_FONDO_POR_TIPO: Record<
  Reto['tipo'],
  string
> = {
  quiz: '#E7E4F2',
  verdadero_falso: '#E7E4F2',
  trivia: '#FFF3D0',
  desafio_reloj: '#E7E4F2',
};

export default function DetalleNivel() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [nivel, setNivel] =
    useState<Nivel | null>(null);

  const [retos, setRetos] =
    useState<Reto[]>([]);

  const [contenidos, setContenidos] =
    useState<ContenidoMultimedia[]>([]);

  const [filtro, setFiltro] =
    useState<Filtro>('todo');

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const { retosCompletados } =
    useProgreso();

  const cargar = useCallback(
    async () => {
      setCargando(true);
      setErrorCarga(null);

      const nivelId = Number(id);

      if (
        !Number.isInteger(nivelId) ||
        nivelId <= 0
      ) {
        setErrorCarga(
          'El nivel solicitado no es válido.'
        );

        setCargando(false);
        return;
      }

      const [
        respuestaNivel,
        respuestaRetos,
        respuestaContenidos,
      ] = await Promise.all([
        supabase
          .from('niveles')
          .select('*')
          .eq('id', nivelId)
          .maybeSingle(),

        supabase
          .from('retos')
          .select('*')
          .eq('nivel_id', nivelId)
          .eq('estado', 'activo')
          .order('orden', {
            ascending: true,
          }),

        supabase
          .from('contenidos_multimedia')
          .select('*')
          .eq('nivel_id', nivelId)
          .eq('estado', 'activo')
          .order('orden', {
            ascending: true,
          }),
      ]);

      if (
        respuestaNivel.error ||
        respuestaRetos.error ||
        respuestaContenidos.error
      ) {
        console.error(
          'Error cargando nivel:',
          respuestaNivel.error ??
            respuestaRetos.error ??
            respuestaContenidos.error
        );

        setErrorCarga(
          'No se pudo cargar la información del nivel.'
        );

        setCargando(false);
        return;
      }

      if (!respuestaNivel.data) {
        setErrorCarga(
          'Este nivel no existe.'
        );

        setCargando(false);
        return;
      }

      const respuestaContenidosAsignatura = await supabase
        .from('contenidos_multimedia')
        .select('*')
        .eq('asignatura_id', respuestaNivel.data.asignatura_id)
        .is('nivel_id', null)
        .eq('estado', 'activo')
        .order('orden', { ascending: true });

      if (respuestaContenidosAsignatura.error) {
        setErrorCarga('No se pudo cargar el material de la asignatura.');
        setCargando(false);
        return;
      }

      setNivel(respuestaNivel.data);

      setRetos(
        respuestaRetos.data ?? []
      );

      const contenidosDisponibles = [
        ...(respuestaContenidosAsignatura.data ?? []),
        ...(respuestaContenidos.data ?? []),
      ];

      setContenidos(
        contenidosDisponibles.filter(
          (contenido, indice) => contenidosDisponibles.findIndex((item) => item.id === contenido.id) === indice
        )
      );

      setCargando(false);
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const retosFiltrados =
    useMemo(() => {
      if (filtro === 'trivia') {
        return retos.filter(
          (reto) =>
            reto.tipo === 'trivia'
        );
      }

      if (
        filtro === 'contrarreloj'
      ) {
        return retos.filter(
          (reto) =>
            reto.tipo ===
            'desafio_reloj'
        );
      }

      return retos;
    }, [retos, filtro]);

  async function abrirContenido(
    contenido: ContenidoMultimedia
  ) {
    if (
      contenido.tipo === 'texto' ||
      contenido.tipo === 'imagen'
    ) {
      return;
    }

    const url =
      contenido.url_recurso?.trim();

    if (!url) {
      Alert.alert(
        'Contenido no disponible',
        'Este recurso no tiene un enlace válido.'
      );

      return;
    }

    try {
      const disponible =
        await Linking.canOpenURL(url);

      if (!disponible) {
        Alert.alert(
          'No se puede abrir',
          'Este recurso no puede abrirse desde el dispositivo.'
        );

        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error(
        'Error abriendo contenido:',
        error
      );

      Alert.alert(
        'No se pudo abrir',
        'Ocurrió un problema al abrir el recurso.'
      );
    }
  }

  function abrirReto(
    retoId: Reto['id']
  ) {
    router.push({
      pathname: '/reto/[id]',
      params: {
        id: String(retoId),
      },
    });
  }

  function iconoContenido(
    tipo: ContenidoMultimedia['tipo']
  ): keyof typeof Ionicons.glyphMap {
    switch (tipo) {
      case 'video':
        return 'play-circle-outline';

      case 'pdf':
        return 'document-text-outline';

      case 'imagen':
        return 'image-outline';

      default:
        return 'reader-outline';
    }
  }

  if (cargando) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.encabezado}>
          <Pressable
            onPress={() =>
              router.back()
            }
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={COLOR_TEXTO}
            />
          </Pressable>
        </View>

        <View style={styles.cargando}>
          <ActivityIndicator
            size="large"
            color={COLOR_MORADO}
          />

          <Text
            style={styles.textoCargando}
          >
            Cargando nivel...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      {/* ENCABEZADO */}
      <View style={styles.encabezado}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={COLOR_TEXTO}
          />
        </Pressable>
      </View>

      {/* TÍTULO */}
      <View style={styles.tituloBloque}>
        <Text style={styles.titulo}>
          Desafíos
        </Text>

        <Text style={styles.subtitulo}>
          {nivel
            ? `Nivel ${nivel.numero_nivel} - ${nivel.nombre}`
            : ''}
        </Text>
      </View>

      {errorCarga ? (
        <View style={styles.errorContenedor}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={COLOR_NARANJA}
          />

          <Text style={styles.error}>
            {errorCarga}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={cargar}
          >
            <Text
              style={
                styles.botonReintentarTexto
              }
            >
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* FILTROS */}
          <View style={styles.tabs}>
            {(
              [
                'todo',
                'trivia',
                'contrarreloj',
              ] as Filtro[]
            ).map((opcion) => (
              <Pressable
                key={opcion}
                onPress={() =>
                  setFiltro(opcion)
                }
                style={[
                  styles.tab,
                  filtro === opcion &&
                    styles.tabActivo,
                ]}
              >
                <Text
                  style={[
                    styles.tabTexto,
                    filtro === opcion &&
                      styles.tabTextoActivo,
                  ]}
                >
                  {opcion === 'todo'
                    ? 'Todo'
                    : opcion ===
                        'trivia'
                      ? 'Trivia'
                      : 'Contrarreloj'}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={retosFiltrados}
            keyExtractor={(item) =>
              String(item.id)
            }
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.lista
            }
            ListHeaderComponent={
              contenidos.length > 0 ? (
                <View
                  style={
                    styles.material
                  }
                >
                  <View
                    style={
                      styles.materialEncabezado
                    }
                  >
                    <View
                      style={
                        styles.materialIcono
                      }
                    >
                      <Ionicons
                        name="library-outline"
                        size={19}
                        color={
                          COLOR_MORADO
                        }
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          styles.materialTitulo
                        }
                      >
                        Material del nivel
                      </Text>

                      <Text
                        style={
                          styles.materialSubtitulo
                        }
                      >
                        Recursos para ayudarte con los desafíos.
                      </Text>
                    </View>
                  </View>

                  {contenidos.map(
                    (contenido) => {
                      const esImagen =
                        contenido.tipo ===
                        'imagen';

                      const esTexto =
                        contenido.tipo ===
                        'texto';

                      const esAbrible =
                        contenido.tipo ===
                          'video' ||
                        contenido.tipo ===
                          'pdf';

                      return (
                        <Pressable
                          key={String(
                            contenido.id
                          )}
                          style={
                            styles.contenido
                          }
                          disabled={
                            !esAbrible
                          }
                          onPress={() =>
                            abrirContenido(
                              contenido
                            )
                          }
                        >
                          {esImagen ? (
                            <Image
                              source={{
                                uri: contenido.url_recurso,
                              }}
                              style={
                                styles.imagen
                              }
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={
                                styles.iconoContenido
                              }
                            >
                              <Ionicons
                                name={iconoContenido(
                                  contenido.tipo
                                )}
                                size={20}
                                color={
                                  COLOR_MORADO
                                }
                              />
                            </View>
                          )}

                          <View
                            style={
                              styles.contenidoTextos
                            }
                          >
                            <Text
                              style={
                                styles.contenidoTitulo
                              }
                            >
                              {
                                contenido.titulo
                              }
                            </Text>

                            {esTexto && (
                              <Text
                                style={
                                  styles.contenidoTexto
                                }
                              >
                                {
                                  contenido.url_recurso
                                }
                              </Text>
                            )}

                            {esAbrible && (
                              <Text
                                style={
                                  styles.contenidoTipo
                                }
                              >
                                {contenido.tipo ===
                                'video'
                                  ? 'Video'
                                  : 'Documento PDF'}
                              </Text>
                            )}
                          </View>

                          {esAbrible && (
                            <Ionicons
                              name="open-outline"
                              size={18}
                              color={
                                COLOR_MORADO
                              }
                            />
                          )}
                        </Pressable>
                      );
                    }
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={
                  styles.vacioContenedor
                }
              >
                <Ionicons
                  name="game-controller-outline"
                  size={36}
                  color={
                    COLOR_TEXTO_SUAVE
                  }
                />

                <Text
                  style={styles.estado}
                >
                  {filtro === 'todo'
                    ? 'No hay desafíos activos en este nivel.'
                    : 'No hay desafíos en esta categoría.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const completado =
                retosCompletados.has(
                  item.id
                );

              const esContrarreloj =
                item.tipo ===
                'desafio_reloj';

              const esTrivia =
                item.tipo ===
                'trivia';

              return (
                <View
                  style={
                    styles.tarjeta
                  }
                >
                  <View
                    style={[
                      styles.iconoCirculo,
                      {
                        backgroundColor:
                          ICONO_FONDO_POR_TIPO[
                            item.tipo
                          ],
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        ICONO_POR_TIPO[
                          item.tipo
                        ]
                      }
                      size={20}
                      color={
                        esTrivia
                          ? COLOR_AMARILLO
                          : COLOR_MORADO
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.tarjetaTextos
                    }
                  >
                    <Text
                      style={
                        styles.tarjetaTitulo
                      }
                    >
                      {esContrarreloj
                        ? 'Contrarreloj: '
                        : esTrivia
                          ? 'Trivia: '
                          : ''}
                      {item.titulo}
                    </Text>

                    {esContrarreloj && (
                      <View
                        style={
                          styles.metaFila
                        }
                      >
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={
                            COLOR_TEXTO_SUAVE
                          }
                        />

                        <Text
                          style={
                            styles.tarjetaMeta
                          }
                        >
                          {SEGUNDOS_POR_PREGUNTA_RELOJ} segundos por pregunta
                        </Text>
                      </View>
                    )}

                    <Text
                      style={
                        styles.tarjetaPuntos
                      }
                    >
                      +
                      {
                        item.puntos_maximos
                      }{' '}
                      pts
                    </Text>
                  </View>

                  {completado ? (
                    <Pressable
                      accessibilityLabel={`Repetir ${item.titulo} en modo práctica`}
                      style={({ pressed }) => [
                        styles.boton,
                        styles.botonCompletado,
                        pressed && styles.botonPresionado,
                      ]}
                      onPress={() => abrirReto(item.id)}
                    >
                      <Text style={styles.botonTexto}>Repetir</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.boton,
                        pressed &&
                          styles.botonPresionado,
                      ]}
                      onPress={() =>
                        abrirReto(
                          item.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.botonTexto
                        }
                      >
                        Comenzar
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLOR_FONDO,
  },

  encabezado: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  tituloBloque: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },

  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLOR_TEXTO,
  },

  subtitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_MORADO,
    marginTop: 2,
  },

  // FILTROS
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor:
      COLOR_FONDO_CAMPO,
  },

  tabActivo: {
    backgroundColor: COLOR_MORADO,
  },

  tabTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLOR_TEXTO_SUAVE,
  },

  tabTextoActivo: {
    color: COLOR_FONDO,
  },

  // LISTA
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // MATERIAL
  material: {
    backgroundColor:
      COLOR_FONDO_CAMPO,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  materialEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  materialIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLOR_FONDO,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  materialTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_TEXTO,
  },

  materialSubtitulo: {
    fontSize: 11,
    color: COLOR_TEXTO_SUAVE,
    marginTop: 2,
  },

  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },

  contenidoTextos: {
    flex: 1,
  },

  contenidoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLOR_TEXTO,
  },

  contenidoTexto: {
    fontSize: 11,
    color: COLOR_TEXTO_SUAVE,
    marginTop: 3,
    lineHeight: 16,
  },

  contenidoTipo: {
    fontSize: 10,
    color: COLOR_MORADO,
    fontWeight: '600',
    marginTop: 3,
  },

  iconoContenido: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLOR_FONDO,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagen: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLOR_FONDO,
  },

  // RETOS
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor:
      COLOR_FONDO_CAMPO,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  iconoCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tarjetaTextos: {
    flex: 1,
  },

  tarjetaTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_TEXTO,
  },

  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },

  tarjetaMeta: {
    fontSize: 12,
    color: COLOR_TEXTO_SUAVE,
  },

  tarjetaPuntos: {
    fontSize: 12,
    color: '#3CB371',
    fontWeight: '700',
    marginTop: 2,
  },

  boton: {
    backgroundColor: COLOR_MORADO,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
  },

  botonPresionado: {
    opacity: 0.8,
  },

  botonCompletado: {
    backgroundColor: '#3CB371',
  },

  botonTexto: {
    color: COLOR_FONDO,
    fontWeight: '700',
    fontSize: 13,
  },

  // ESTADOS
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  textoCargando: {
    fontSize: 12,
    color: COLOR_TEXTO_SUAVE,
  },

  vacioContenedor: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 30,
  },

  estado: {
    textAlign: 'center',
    color: COLOR_TEXTO_SUAVE,
    marginTop: 8,
    fontSize: 12,
  },

  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  error: {
    color: COLOR_TEXTO_SUAVE,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },

  botonReintentar: {
    backgroundColor: COLOR_MORADO,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 14,
  },

  botonReintentarTexto: {
    color: COLOR_FONDO,
    fontWeight: '700',
    fontSize: 13,
  },
});
