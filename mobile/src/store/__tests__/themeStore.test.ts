import { useThemeStore } from '../themeStore';

describe('themeStore', () => {
  it('defaults to light theme', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggles the theme', () => {
    const initialTheme = useThemeStore.getState().theme;
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).not.toBe(initialTheme);
  });

  it('sets the theme explicitly', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
