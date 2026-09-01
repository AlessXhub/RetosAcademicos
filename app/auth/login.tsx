// Pantalla de inicio de sesion (adaptada de la guia de Supabase + Auth).
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import LogoApp from '../../components/LogoApp';
import { esCorreoValido } from '../../lib/validaciones';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function iniciarSesion() {
    setMensaje(null);
    if (!correo.trim() || !contrasena) {
      setMensaje('Ingresa tu correo y contraseña.');
      return;
    }
    if (!esCorreoValido(correo)) {
      setMensaje('Escribe un correo electrónico válido.');
      return;
    }
    try {
      setCargando(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          router.replace({ pathname: '/auth/confirmar_correo', params: { email: correo.trim() } });
          return;
        }
        setMensaje('El correo o la contraseña son incorrectos.');
        return;
      }
      if (!data.user) {
        setMensaje('No se pudo obtener el usuario.');
        return;
      }
      // el _layout detecta la sesion y redirige a /inicio
    } catch (error) {
      console.error(error);
      setMensaje('Ocurrió un problema al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LogoApp />
      {mensaje && (
        <View accessibilityRole="alert" style={styles.mensajeError}>
          <Ionicons name="alert-circle-outline" size={20} color="#9b1c1c" />
          <Text style={styles.mensajeErrorTexto}>{mensaje}</Text>
        </View>
      )}
      <Text style={styles.etiqueta}>Correo electrónico</Text>
      <View style={styles.inputContenedor}>
        <Ionicons name="mail-outline" size={20} color="#777" />
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.etiqueta}>Contraseña</Text>
      <View style={styles.inputContenedor}>
        <Ionicons name="lock-closed-outline" size={20} color="#777" />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry={!mostrarContrasena}
        />
        <Pressable onPress={() => setMostrarContrasena(!mostrarContrasena)}>
          <Ionicons name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'} size={21} color="#777" />
        </Pressable>
      </View>

      <Pressable
        style={[styles.boton, cargando && styles.botonDeshabilitado]}
        onPress={iniciarSesion}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>{cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}</Text>
      </Pressable>

      <View style={styles.registro}>
        <Text>¿Aún no tienes una cuenta?</Text>
        <Pressable onPress={() => router.push('/auth/registro')}>
          <Text style={styles.enlace}> Crear cuenta</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24 },
  etiqueta: { fontSize: 13, marginBottom: 6, opacity: 0.8 },
  inputContenedor: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  input: { flex: 1, fontSize: 15 },
  boton: { backgroundColor: '#2f5496', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#fff', fontWeight: '700' },
  registro: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  enlace: { color: '#2f5496', fontWeight: '700' },
  mensajeError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fde8e8', borderColor: '#f5b5b5', borderWidth: 1,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  mensajeErrorTexto: { flex: 1, color: '#9b1c1c', fontSize: 13, fontWeight: '600' },
});
