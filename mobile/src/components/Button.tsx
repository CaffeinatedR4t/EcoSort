import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Animated,
  Platform,
  StyleProp
} from 'react-native';
import { colors } from '../services/theme/colors';
import { spacing, layout } from '../services/theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'black' | 'ghost' | 'inverted' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outline;
      case 'black':
        return styles.black;
      case 'ghost':
        return styles.ghost;
      case 'inverted':
        return styles.inverted;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'inverted':
        return styles.invertedText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: animatedValue }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[styles.base, getButtonStyle(), disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'inverted' ? colors.primary : colors.white} />
        ) : (
          <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: layout.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    width: '100%',
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
    textAlign: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  inverted: {
    backgroundColor: colors.white,
  },
  invertedText: {
    color: colors.houseGreen,
  },
  danger: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: colors.white,
  },
  black: {
    backgroundColor: colors.black,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
