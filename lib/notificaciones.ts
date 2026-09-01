import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const idRecordatorio = (usuarioId: string) => `recordatorio_estudio_${usuarioId}`;
const idAlertaRacha = (usuarioId: string) => `alerta_racha_${usuarioId}`;

async function asegurarCanalAndroid() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Recordatorios de estudio',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function registrarNotificacion(datos: Record<string, unknown>) {
  const { error } = await supabase.from('notificaciones').insert(datos);
  if (error) console.warn('No se pudo registrar la notificación:', error.message);
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  try {
    await asegurarCanalAndroid();
    const permisosActuales = await Notifications.getPermissionsAsync();
    if (permisosActuales.status === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('No se pudo pedir permiso de notificaciones:', error);
    return false;
  }
}

export async function programarNotificacion(
  usuarioId: string,
  tipo: 'nuevo_reto' | 'felicitacion_logro' | 'alerta_racha_riesgo' | 'recordatorio_estudio',
  titulo: string,
  mensaje: string,
  segundosDeEspera = 1
) {
  const fechaProgramada = new Date(Date.now() + segundosDeEspera * 1000).toISOString();
  try {
    await asegurarCanalAndroid();
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: mensaje },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundosDeEspera,
        channelId: 'default',
      },
    });
    await registrarNotificacion({
      usuario_id: usuarioId,
      tipo,
      titulo,
      mensaje,
      fecha_programada: fechaProgramada,
      fecha_envio: null,
    });
  } catch (error) {
    console.warn('No se pudo programar la notificación local:', error);
  }
}

export async function cancelarRecordatorioDiario(usuarioId: string) {
  await Notifications.cancelScheduledNotificationAsync(idRecordatorio(usuarioId)).catch(() => undefined);
}

export async function cancelarNotificacionesUsuario(usuarioId: string) {
  await Promise.all([
    cancelarRecordatorioDiario(usuarioId),
    Notifications.cancelScheduledNotificationAsync(idAlertaRacha(usuarioId)).catch(() => undefined),
  ]);
}

export async function programarRecordatorioDiario(usuarioId: string) {
  try {
    await asegurarCanalAndroid();
    await cancelarRecordatorioDiario(usuarioId);
    await Notifications.scheduleNotificationAsync({
      identifier: idRecordatorio(usuarioId),
      content: {
        title: 'Hora de estudiar',
        body: 'No pierdas tu racha, completa un reto hoy.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
        channelId: 'default',
      },
    });

    const proximaFecha = new Date();
    proximaFecha.setHours(19, 0, 0, 0);
    if (proximaFecha.getTime() <= Date.now()) proximaFecha.setDate(proximaFecha.getDate() + 1);
    await registrarNotificacion({
      usuario_id: usuarioId,
      tipo: 'recordatorio_estudio',
      titulo: 'Hora de estudiar',
      mensaje: 'No pierdas tu racha, completa un reto hoy.',
      fecha_programada: proximaFecha.toISOString(),
      fecha_envio: null,
    });
  } catch (error) {
    console.warn('No se pudo programar el recordatorio diario:', error);
  }
}

export async function programarAlertaRachaRiesgo(usuarioId: string, rachaActual: number) {
  if (rachaActual <= 0) return;
  const segundos = 60 * 60 * 20;
  try {
    await asegurarCanalAndroid();
    await Notifications.cancelScheduledNotificationAsync(idAlertaRacha(usuarioId)).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: idAlertaRacha(usuarioId),
      content: {
        title: 'Tu racha está en riesgo',
        body: `Llevas ${rachaActual} días seguidos. Completa un reto hoy para no perder tu racha.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundos,
        channelId: 'default',
      },
    });
    await registrarNotificacion({
      usuario_id: usuarioId,
      tipo: 'alerta_racha_riesgo',
      titulo: 'Tu racha está en riesgo',
      mensaje: `Llevas ${rachaActual} días seguidos. Completa un reto hoy para no perder tu racha.`,
      fecha_programada: new Date(Date.now() + segundos * 1000).toISOString(),
      fecha_envio: null,
    });
  } catch (error) {
    console.warn('No se pudo programar la alerta de racha:', error);
  }
}
