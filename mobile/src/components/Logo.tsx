import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const Logo: React.FC<LogoProps> = ({ size = 100, style, imageStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo/EcoSort.png')}
        style={[
          {
            width: size,
            height: size,
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
