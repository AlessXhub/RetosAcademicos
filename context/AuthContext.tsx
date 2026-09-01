import { Session } from '@supabase/supabase-js';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Usuario } from '../lib/tipos';

interface AuthContextTipo {
  session: Session | null;
  usuario: Usuario | null;
  cargando: boolean;
  perfilCargando: boolean;
  errorPerfil: string | null;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextTipo | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!montado) return;
      if (error) console.warn('No se pudo recuperar la sesión:', error.message);
      setSession(data.session);
      setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (montado) setSession(nuevaSesion);
    });

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const recargarPerfil = useCallback(async () => {
    const usuarioId = session?.user.id;
    if (!usuarioId) {
      setUsuario(null);
      setErrorPerfil(null);
      setPerfilCargando(false);
      return;
    }

    setPerfilCargando(true);
    setErrorPerfil(null);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle();

    if (error) {
      setUsuario(null);
      setErrorPerfil('No se pudo cargar el perfil del usuario.');
      console.warn('No se pudo cargar el perfil:', error.message);
    } else {
      setUsuario((data as Usuario | null) ?? null);
      if (!data) setErrorPerfil('La cuenta no tiene un perfil asociado.');
    }
    setPerfilCargando(false);
  }, [session?.user.id]);

  useEffect(() => {
    void recargarPerfil();
  }, [recargarPerfil]);

  return (
    <AuthContext.Provider
      value={{ session, usuario, cargando, perfilCargando, errorPerfil, recargarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}
