import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Insignia, ProgresoGlobal, UsuarioInsignia } from '../lib/tipos';
import { useAuth } from './AuthContext';

interface InsigniaObtenida extends UsuarioInsignia { insignias: Insignia; }
interface Preferencias { notificacionesActivadas: boolean; }

interface ProgresoContextTipo {
  progreso: ProgresoGlobal | null;
  insignias: InsigniaObtenida[];
  retosCompletados: Set<number>;
  preferencias: Preferencias;
  preferenciasCargadas: boolean;
  cargando: boolean;
  error: string | null;
  refrescarProgreso: () => Promise<void>;
  alternarNotificaciones: (activadas?: boolean) => Promise<boolean>;
}

const ProgresoContext = createContext<ProgresoContextTipo | undefined>(undefined);
const preferenciasIniciales: Preferencias = { notificacionesActivadas: true };

export function ProgresoProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const usuarioId = session?.user.id ?? null;
  const [progreso, setProgreso] = useState<ProgresoGlobal | null>(null);
  const [insignias, setInsignias] = useState<InsigniaObtenida[]>([]);
  const [retosCompletados, setRetosCompletados] = useState<Set<number>>(new Set());
  const [preferencias, setPreferencias] = useState<Preferencias>(preferenciasIniciales);
  const [preferenciasCargadas, setPreferenciasCargadas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clavePreferencias = usuarioId ? `preferencias_usuario_${usuarioId}` : null;

  useEffect(() => {
    let vigente = true;
    setPreferenciasCargadas(false);
    if (!clavePreferencias) {
      setPreferencias(preferenciasIniciales);
      setPreferenciasCargadas(true);
      return () => { vigente = false; };
    }

    AsyncStorage.getItem(clavePreferencias)
      .then((valor) => {
        if (vigente) setPreferencias(valor ? JSON.parse(valor) : preferenciasIniciales);
      })
      .catch(() => {
        if (vigente) setPreferencias(preferenciasIniciales);
      })
      .finally(() => {
        if (vigente) setPreferenciasCargadas(true);
      });
    return () => { vigente = false; };
  }, [clavePreferencias]);

  const alternarNotificaciones = useCallback(async (activadas?: boolean) => {
    const nuevas = {
      notificacionesActivadas: activadas ?? !preferencias.notificacionesActivadas,
    };
    setPreferencias(nuevas);
    if (clavePreferencias) await AsyncStorage.setItem(clavePreferencias, JSON.stringify(nuevas));
    return nuevas.notificacionesActivadas;
  }, [clavePreferencias, preferencias.notificacionesActivadas]);

  const refrescarProgreso = useCallback(async () => {
    if (!usuarioId) {
      setProgreso(null);
      setInsignias([]);
      setRetosCompletados(new Set());
      setError(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);
    const [respuestaProgreso, respuestaInsignias, respuestaIntentos] = await Promise.all([
      supabase.from('progreso_global').select('*').eq('usuario_id', usuarioId).maybeSingle(),
      supabase.from('usuario_insignias').select('*, insignias(*)').eq('usuario_id', usuarioId),
      supabase.from('intentos_reto').select('reto_id').eq('usuario_id', usuarioId)
        .eq('estado', 'completado').gte('porcentaje', 60),
    ]);

    const primerError = respuestaProgreso.error ?? respuestaInsignias.error ?? respuestaIntentos.error;
    if (primerError) {
      setError('No se pudo actualizar el progreso. Revisa tu conexión e inténtalo de nuevo.');
      console.warn('Error al actualizar el progreso:', primerError.message);
    } else {
      setProgreso((respuestaProgreso.data as ProgresoGlobal | null) ?? null);
      setInsignias((respuestaInsignias.data as InsigniaObtenida[]) ?? []);
      setRetosCompletados(new Set((respuestaIntentos.data ?? []).map((intento) => intento.reto_id)));
    }
    setCargando(false);
  }, [usuarioId]);

  useEffect(() => { void refrescarProgreso(); }, [refrescarProgreso]);

  return (
    <ProgresoContext.Provider value={{
      progreso, insignias, retosCompletados, preferencias, preferenciasCargadas,
      cargando, error, refrescarProgreso, alternarNotificaciones,
    }}>
      {children}
    </ProgresoContext.Provider>
  );
}

export function useProgreso() {
  const contexto = useContext(ProgresoContext);
  if (!contexto) throw new Error('useProgreso debe usarse dentro de ProgresoProvider');
  return contexto;
}
