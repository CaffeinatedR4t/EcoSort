import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getProfileInitials } from '../utils/profile';

export const ProfileAvatar = ({
  name,
  avatarUrl,
  size = 80,
  fallback = 'U',
  textSize,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  fallback?: string;
  textSize?: number;
}) => {
  const borderRadius = Math.round(size * 0.22); // Proportional rounded square (approx 14 for 64px, 20 for 92px)

  return (
    <View
      testID="profile-avatar"
      style={[styles.avatar, { width: size, height: size, borderRadius }]}
    >
      {avatarUrl ? (
        <Image
          testID="profile-avatar-image"
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius }}
        />
      ) : (
        <Text
          testID="profile-avatar-initials"
          style={[styles.initials, { fontSize: textSize || Math.round(size * 0.36) }]}
        >
          {getProfileInitials(name, fallback)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#006948',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
