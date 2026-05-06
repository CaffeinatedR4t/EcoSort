import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors } from '../services/theme/colors';

export const useThemeColors = () => {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColors : darkColors;
};
