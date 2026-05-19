import { Alert } from 'react-native';
import { supabase } from '../services/api/supabase';

export const getProfileInitials = (name?: string | null, fallback = 'U') => {
  const trimmed = (name || '').trim();
  if (!trimmed) return fallback;

  const initials = trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || fallback;
};

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  const ext = cleanUri.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : 'jpg';
};

const getMimeType = (extension: string) => {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
};

export const base64ToArrayBuffer = (base64: string) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanBase64 = base64.replace(/[\r\n=]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < cleanBase64.length; i += 1) {
    const value = alphabet.indexOf(cleanBase64[i]);
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes).buffer;
};

export const uploadProfileAvatarFromBase64 = async (
  userId: string,
  base64: string,
  uri: string
) => {
  const extension = getFileExtension(uri);
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const fileBody = base64ToArrayBuffer(base64);

  const { error } = await supabase.storage
    .from('profile-avatars')
    .upload(path, fileBody, {
      contentType: getMimeType(extension),
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path);
  return data.publicUrl;
};

export const pickAndUploadProfileAvatar = async (userId: string) => {
  try {
    const ImagePicker = require('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set your profile picture.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    const asset = result.assets?.[0];
    if (result.canceled || !asset?.uri || !asset.base64) return null;

    return await uploadProfileAvatarFromBase64(userId, asset.base64, asset.uri);
  } catch (error: any) {
    Alert.alert('Upload failed', error?.message || 'Unable to upload profile picture.');
    return null;
  }
};
