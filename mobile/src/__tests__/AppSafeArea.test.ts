import fs from 'fs';
import path from 'path';

const appSource = fs.readFileSync(path.join(__dirname, '..', '..', 'App.tsx'), 'utf8');
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

describe('App safe area backgrounds', () => {
  it('keeps the system top safe area green and bottom safe area white', () => {
    expect(appSource).toContain('SystemSafeAreaBackground');
    expect(appSource).toContain("backgroundColor: '#006948'");
    expect(appSource).toContain("backgroundColor: '#fff'");
    expect(appSource).toContain("backgroundColor=\"#006948\"");
  });

  it('uses the green top system bar on user and admin main screens', () => {
    [
      'screens/user/UserHomeScreen.tsx',
      'screens/user/ProfileScreen.tsx',
      'screens/user/ScanScreen.tsx',
      'screens/admin/AdminHomeScreen.tsx',
    ].forEach((screenPath) => {
      const source = readSource(screenPath);
      expect(source).toContain('<StatusBar');
      expect(source).toContain('backgroundColor="#006948"');
    });
  });

  it('keeps the admin top safe area green while admin content uses its normal surface', () => {
    const source = readSource('screens/admin/AdminHomeScreen.tsx');

    expect(source).toContain('styles.safeArea');
    expect(source).toContain('styles.content');
    expect(source).toContain("backgroundColor: '#006948'");
    expect(source).toContain("backgroundColor: '#f8fafc'");
  });

  it('keeps the driver top safe area green while driver content uses screen backgrounds', () => {
    const source = readSource('screens/collector/CollectorHomeScreen.tsx');

    expect(source).toContain('styles.safeArea');
    expect(source).toContain('styles.content');
    expect(source).toContain("backgroundColor: '#006948'");
    expect(source).toContain('backgroundColor: screenBackground');
    expect(source).toContain('backgroundColor="#006948"');
  });
});
