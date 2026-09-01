// Pantalla de registro. supabase.auth.signUp() crea la cuenta en Supabase Auth
// y el trigger crear_perfil_usuario (definido en la BD) crea automaticamente
// las filas en usuarios, progreso_global y ranking_global.
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import LogoApp from '../../components/LogoApp';
import { esCorreoValido, mensajeErrorRegistro, validarContrasena } from '../../lib/validaciones';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function registrarUsuario() {
    setMensaje(null);
    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !contrasena || !confirmarContrasena) {
      setMensaje('Completa todos los campos para crear la cuenta.');
      return;
    }
    if (contrasena !== confirmarContrasena) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }
    if (!esCorreoValido(correo)) {
      setMensaje('Escribe un correo electrónico válido.');
      return;
    }
    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) {
      setMensaje(errorContrasena);
      return;
    }

    try {
      setCargando(true);
      const { data, error } = await supabase.auth.signUp({
        email: correo.trim(),
        password: contrasena,
        options: { data: { nombre: nombre.trim(), apellido: apellido.trim() } },
      });
      if (error) {
        setMensaje(mensajeErrorRegistro(error.message));
        return;
      }
      if (!data.user || data.user.identities?.length === 0) {
        setMensaje('Ya existe una cuenta asociada a este correo.');
        return;
      }
      router.replace({ pathname: '/auth/confirmar_correo', params: { email: correo.trim() } });
    } catch {
      setMensaje('No se pudo conectar con el servicio de autenticación.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LogoApp />
        {mensaje && (
          <View accessibilityRole="alert" style={styles.mensajeError}>
            <Ionicons name="alert-circle-outline" size={20} color="#9b1c1c" />
            <Text style={styles.mensajeErrorTexto}>{mensaje}</Text>
          </View>
        )}
        <Text style={styles.etiqueta}>Nombre</Text>
        <View style={styles.inputContenedor}>
          <Ionicons name="person-outline" size={20} color="#777" />
          <TextInput style={styles.input} placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
        </View>

        <Text style={styles.etiqueta}>Apellido</Text>
        <View style={styles.inputContenedor}>
          <Ionicons name="person-outline" size={20} color="#777" />
          <TextInput style={styles.input} placeholder="Tu apellido" value={apellido} onChangeText={setApellido} />
        </View>

        <Text style={styles.etiqueta}>Correo electrónico</Text>
        <View style={styles.inputContenedor}>
          <Ionicons name="mail-outline" size={20} color="#777" />
          <TextInput
            style={styles.input} placeholder="correo@ejemplo.com" value={correo}
            onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none"
          />
        </View>

        <Text style={styles.etiqueta}>Contraseña</Text>
        <View style={styles.inputContenedor}>
          <Ionicons name="lock-closed-outline" size={20} color="#777" />
          <TextInput
            style={styles.input} placeholder="Contraseña" value={contrasena}
            onChangeText={setContrasena} secureTextEntry={!mostrarContrasena}
          />
          <Pressable onPress={() => setMostrarContrasena(!mostrarContrasena)}>
            <Ionicons name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'} size={21} color="#777" />
          </Pressable>
        </View>
        <Text style={styles.ayudaContrasena}>Usa al menos 8 caracteres, incluyendo letras y números.</Text>

        <Text style={styles.etiqueta}>Confirmar contraseña</Text>
        <View style={styles.inputContenedor}>
          <Ionicons name="lock-closed-outline" size={20} color="#777" />
          <TextInput
            style={styles.input} placeholder="Repite tu contraseña" value={confirmarContrasena}
            onChangeText={setConfirmarContrasena} secureTextEntry={!mostrarContrasena}
          />
        </View>

        <Pressable
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          onPress={registrarUsuario}
          disabled={cargando}
        >
          <Text style={styles.textoBoton}>{cargando ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
        </Pressable>

        <View style={styles.loginContenedor}>
          <Text>¿Ya tienes una cuenta?</Text>
          <Pressable onPress={() => router.replace('/auth/login')}>
            <Text style={styles.enlace}> Iniciar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 24, paddingBottom: 40 },
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
  loginContenedor: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  enlace: { color: '#2f5496', fontWeight: '700' },
  mensajeError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fde8e8', borderColor: '#f5b5b5', borderWidth: 1,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  mensajeErrorTexto: { flex: 1, color: '#9b1c1c', fontSize: 13, fontWeight: '600' },
  ayudaContrasena: { color: '#666', fontSize: 11, marginTop: -8, marginBottom: 12 },
});
