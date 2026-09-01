import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLOR_FONDO, COLOR_FONDO_CAMPO, COLOR_MORADO, COLOR_MORADO_CLARO, COLOR_TEXTO, COLOR_TEXTO_SUAVE } from '../lib/colores';
import { supabase } from '../lib/supabase';

const BUCKET_AVATARES = 'avatars';

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'Intenta de nuevo.';
}

export default function EditarPerfil() {
  const { usuario, session, recargarPerfil } = useAuth();
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(useCallback(() => {
    setNombre(usuario?.nombre ?? '');
    setNombreUsuario(usuario?.usuario ?? '');
    setFotoUrl(usuario?.foto_url ?? null);
  }, [usuario]));

  async function cambiarFoto() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para cambiar la imagen de perfil.');
      return;
    }
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
      });
      const foto = resultado.assets?.[0];
      if (resultado.canceled || !foto) return;
      if (!foto.base64 || !session?.user.id) throw new Error('No se pudo leer la imagen seleccionada.');

      setSubiendoFoto(true);
      const mimeType = foto.mimeType ?? 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const ruta = `${session.user.id}/perfil.${extension}`;
      const { error } = await supabase.storage.from(BUCKET_AVATARES).upload(ruta, decode(foto.base64), {
        contentType: mimeType, upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(BUCKET_AVATARES).getPublicUrl(ruta);
      setFotoUrl(`${data.publicUrl}?v=${Date.now()}`);
    } catch (error) {
      Alert.alert('No se pudo actualizar la foto', mensajeError(error));
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function guardarCambios() {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Escribe tu nombre antes de guardar.');
      return;
    }
    if (!session?.user.id) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente.');
      return;
    }
    setGuardando(true);
    try {
      const { error } = await supabase.rpc('actualizar_perfil', {
        p_nombre: nombre.trim(), p_usuario: nombreUsuario.trim() || null, p_foto_url: fotoUrl,
      });
      if (error) throw new Error(error.message);
      await recargarPerfil();
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
        { text: 'Aceptar', onPress: () => router.replace('/perfil') },
      ]);
    } catch (error) {
      Alert.alert('No se pudieron guardar los cambios', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/perfil')} style={styles.volver} hitSlop={12}>
        <Ionicons name="arrow-back-outline" size={24} color={COLOR_TEXTO} />
      </Pressable>
      <Text style={styles.titulo}>Editar perfil</Text>
      <View style={styles.encabezado}>
        <Pressable onPress={cambiarFoto} disabled={subiendoFoto} accessibilityLabel="Cambiar foto de perfil">
          {fotoUrl ? <Image source={{ uri: fotoUrl }} style={styles.avatar} /> : (
            <View style={styles.avatarVacio}><Ionicons name="person" size={44} color={COLOR_FONDO} /></View>
          )}
          <View style={styles.iconoCamara}>
            {subiendoFoto ? <ActivityIndicator size="small" color={COLOR_FONDO} /> : <Ionicons name="camera" size={16} color={COLOR_FONDO} />}
          </View>
        </Pressable>
        <Pressable onPress={cambiarFoto} disabled={subiendoFoto}><Text style={styles.cambiarFoto}>{subiendoFoto ? 'Subiendo foto…' : 'Cambiar foto'}</Text></Pressable>
      </View>

      <Text style={styles.etiqueta}>Nombre</Text>
      <View style={styles.inputContenedor}><Ionicons name="person-outline" size={20} color={COLOR_MORADO} />
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" maxLength={80} />
      </View>
      <Text style={styles.etiqueta}>Usuario</Text>
      <View style={styles.inputContenedor}><Ionicons name="at-outline" size={20} color={COLOR_MORADO} />
        <TextInput style={styles.input} value={nombreUsuario} onChangeText={setNombreUsuario} placeholder="usuario" autoCapitalize="none" maxLength={40} />
      </View>
      <Text style={styles.etiqueta}>Correo electrónico</Text>
      <View style={[styles.inputContenedor, styles.inputDeshabilitado]}><Ionicons name="mail-outline" size={20} color={COLOR_MORADO} />
        <Text style={styles.correo}>{session?.user.email ?? ''}</Text>
      </View>
      <Text style={styles.ayuda}>El correo pertenece a tu cuenta de acceso y no se modifica desde el perfil.</Text>

      <Pressable style={[styles.botonPrimario, (guardando || subiendoFoto) && styles.botonDeshabilitado]}
        onPress={guardarCambios} disabled={guardando || subiendoFoto}>
        {guardando ? <ActivityIndicator color={COLOR_FONDO} /> : <Text style={styles.textoBoton}>Guardar cambios</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR_FONDO }, contenido: { padding: 16, paddingBottom: 40 }, volver: { alignSelf: 'flex-start', marginBottom: 8 },
  titulo: { fontSize: 21, fontWeight: '800', color: COLOR_TEXTO }, encabezado: { alignItems: 'center', marginTop: 18, marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EEE' }, avatarVacio: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLOR_MORADO_CLARO, justifyContent: 'center', alignItems: 'center' },
  iconoCamara: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: COLOR_MORADO, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLOR_FONDO },
  cambiarFoto: { color: COLOR_MORADO, fontWeight: '700', marginTop: 10, fontSize: 14 }, etiqueta: { fontSize: 13, color: COLOR_TEXTO_SUAVE, marginTop: 14, marginBottom: 6 },
  inputContenedor: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLOR_FONDO_CAMPO, borderRadius: 12, paddingHorizontal: 14, minHeight: 50 },
  inputDeshabilitado: { opacity: 0.75 }, input: { flex: 1, fontSize: 15, color: COLOR_TEXTO, paddingVertical: 13 }, correo: { flex: 1, fontSize: 15, color: COLOR_TEXTO },
  ayuda: { fontSize: 11, color: COLOR_TEXTO_SUAVE, marginTop: 6 }, botonPrimario: { backgroundColor: COLOR_MORADO, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  botonDeshabilitado: { opacity: 0.6 }, textoBoton: { color: COLOR_FONDO, fontWeight: '800', fontSize: 15 },
});
