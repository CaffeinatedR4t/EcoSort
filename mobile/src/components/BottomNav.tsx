import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, ScanLine } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing } from '../services/theme/spacing';
import { useNavigation } from '@react-navigation/native';

interface BottomNavProps {
  activeRoute: 'Home' | 'Profile' | 'Scan';
}

export const BottomNav = ({ activeRoute }: BottomNavProps) => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const renderNavItem = (route: 'Home' | 'Scan' | 'Profile', IconComponent: any, navigateTo: string) => {
    const isActive = activeRoute === route;

    return (
      <TouchableOpacity 
        style={[styles.navItem, isActive && styles.activeNavItem]} 
        onPress={() => navigation.navigate(navigateTo)}
        testID={`nav-${route.toLowerCase()}`}
      >
        <View style={isActive ? [styles.activeCircle, { backgroundColor: colors.primary }] : null}>
          <IconComponent 
            color={isActive ? colors.white : colors.outline} 
            size={isActive ? 28 : 24} 
            strokeWidth={isActive ? 2.5 : 2}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.outerContainer, 
      { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, spacing.lg) : spacing.lg }
    ]}>
      <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
        {renderNavItem('Home', Home, 'UserHome')}
        {renderNavItem('Scan', ScanLine, 'Scan')}
        {renderNavItem('Profile', User, 'Profile')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  activeNavItem: {
    // No extra styles for the container itself
  },
  activeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, // Float effect
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
});
