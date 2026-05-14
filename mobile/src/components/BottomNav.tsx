import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, ScanLine } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing } from '../services/theme/spacing';
import { useNavigation } from '@react-navigation/native';

interface BottomNavProps {
  activeRoute: 'Home' | 'Profile' | 'Scan';
}

const AnimatedNavItem = ({ 
  isActive, 
  onPress, 
  IconComponent, 
  label, 
  colors 
}: { 
  isActive: boolean; 
  onPress: () => void; 
  IconComponent: any; 
  label: string;
  colors: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.15 : 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  }, [isActive]);

  return (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={onPress}
      activeOpacity={0.7}
      testID={`nav-${label.toLowerCase()}`}
    >
      <Animated.View style={{ 
        alignItems: 'center', 
        transform: [{ scale: scaleAnim }] 
      }}>
        <IconComponent 
          color={isActive ? colors.primary : colors.outline} 
          size={24} 
          strokeWidth={isActive ? 2.5 : 2}
        />
        <Text style={[
          styles.label, 
          { color: isActive ? colors.primary : colors.outline }
        ]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BottomNav = ({ activeRoute }: BottomNavProps) => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.outerContainer, 
      { 
        backgroundColor: colors.white,
        paddingBottom: Math.max(insets.bottom, spacing.xs)
      }
    ]}>
      <View style={styles.container}>
        <AnimatedNavItem 
          isActive={activeRoute === 'Home'}
          onPress={() => navigation.navigate('UserHome')}
          IconComponent={Home}
          label="Home"
          colors={colors}
        />
        <AnimatedNavItem 
          isActive={activeRoute === 'Scan'}
          onPress={() => navigation.navigate('Scan')}
          IconComponent={ScanLine}
          label="Scan"
          colors={colors}
        />
        <AnimatedNavItem 
          isActive={activeRoute === 'Profile'}
          onPress={() => navigation.navigate('Profile')}
          IconComponent={User}
          label="Profile"
          colors={colors}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
