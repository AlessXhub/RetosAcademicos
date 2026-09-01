import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { COLOR_AMARILLO, COLOR_FONDO, COLOR_MORADO, COLOR_TEXTO } from '../lib/colores';

type Seccion = 'ranking' | 'asignaturas' | 'inicio' | 'logros' | 'perfil';

const destinos: {
  seccion: Seccion;
  ruta: '/ranking' | '/asignatura' | '/inicio' | '/logros' | '/perfil';
  icono: keyof typeof Ionicons.glyphMap;
  iconoActivo: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
}[] = [
  { seccion: 'ranking', ruta: '/ranking', icono: 'podium-outline', iconoActivo: 'podium', etiqueta: 'Ranking' },
  { seccion: 'asignaturas', ruta: '/asignatura', icono: 'book-outline', iconoActivo: 'book', etiqueta: 'Asignaturas' },
  { seccion: 'inicio', ruta: '/inicio', icono: 'home-outline', iconoActivo: 'home', etiqueta: 'Inicio' },
  { seccion: 'logros', ruta: '/logros', icono: 'trophy-outline', iconoActivo: 'trophy', etiqueta: 'Logros' },
  { seccion: 'perfil', ruta: '/perfil', icono: 'person-outline', iconoActivo: 'person', etiqueta: 'Perfil' },
];

export default function NavegacionInferior({ activa }: { activa: Seccion }) {
  return (
    <View style={styles.contenedor}>
      {destinos.map((destino) => {
        const esActiva = activa === destino.seccion;
        return (
          <Pressable
            key={destino.seccion}
            accessibilityRole="button"
            accessibilityLabel={destino.etiqueta}
            accessibilityState={{ selected: esActiva }}
            hitSlop={8}
            onPress={() => {
              if (!esActiva) router.replace(destino.ruta);
            }}
            style={esActiva ? styles.activo : styles.boton}
          >
            <Ionicons
              name={esActiva ? destino.iconoActivo : destino.icono}
              size={23}
              color={esActiva ? COLOR_MORADO : COLOR_TEXTO}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLOR_AMARILLO,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  boton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR_FONDO,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
