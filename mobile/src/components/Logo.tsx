import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  color?: string | null;
}

export const Logo: React.FC<LogoProps> = ({ size = 100, style, imageStyle, color = '#006948' }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo/EcoSort.png')}
        style={[
          {
            width: size,
            height: size,
            tintColor: color ?? undefined,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
