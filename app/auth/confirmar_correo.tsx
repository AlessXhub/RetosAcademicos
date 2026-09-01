// Pantalla de espera de confirmacion de correo. El usuario no puede iniciar
// sesion hasta confirmar su cuenta (Confirm email activado en Supabase Auth).
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import LogoApp from '../../components/LogoApp';

export default function ConfirmarCorreo() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  function volverLogin() {
    router.replace('/auth/login');
  }

  async function reenviarCorreo() {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      Alert.alert('No se pudo reenviar', 'Espera un momento y vuelve a intentarlo.');
      return;
    }
    Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada y la carpeta de correo no deseado.');
  }

  return (
    <View style={styles.contenedor}>
      <LogoApp />
      <Ionicons name="mail-outline" size={55} color="#2f5496" />
      <Text style={styles.titulo}>Revisa tu correo</Text>
      <Text style={styles.descripcion}>Te hemos enviado un enlace de confirmación para activar tu cuenta.</Text>
      {email && <Text style={styles.email}>{email}</Text>}
      <Text style={styles.instruccion}>Abre tu correo y pulsa el enlace de confirmación. Después podrás iniciar sesión.</Text>

      <Pressable style={styles.boton} onPress={volverLogin}>
        <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        <Text style={styles.textoBoton}>Volver al inicio de sesión</Text>
      </Pressable>

      <Text style={styles.ayuda}>¿No recibiste el correo?</Text>
      <Pressable onPress={reenviarCorreo}>
        <Text style={styles.reenviar}>Reenviar correo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  titulo: { fontSize: 22, fontWeight: '700', marginTop: 14 },
  descripcion: { textAlign: 'center', marginTop: 8, opacity: 0.8 },
  email: { fontWeight: '700', marginTop: 6 },
  instruccion: { textAlign: 'center', marginTop: 14, opacity: 0.7, fontSize: 13 },
  boton: {
    flexDirection: 'row', gap: 8, backgroundColor: '#2f5496',
    padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 24,
  },
  textoBoton: { color: '#fff', fontWeight: '700' },
  ayuda: { marginTop: 20, opacity: 0.7 },
  reenviar: { color: '#2f5496', fontWeight: '700', marginTop: 4 },
});
