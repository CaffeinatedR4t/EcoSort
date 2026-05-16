import fs from 'fs';
import path from 'path';

const navigationSource = fs.readFileSync(path.join(__dirname, '..', 'index.tsx'), 'utf8');

const getUserStackScreen = (screenName: string) => {
  const match = navigationSource.match(
    new RegExp(`<UserStack\\.Screen\\s+name="${screenName}"[\\s\\S]*?/>`)
  );

  return match?.[0] ?? '';
};

describe('UserNavigator tab transitions', () => {
  it('disables screen transition animation only for bottom-tab destinations', () => {
    ['UserHome', 'Scan', 'Profile'].forEach((screenName) => {
      expect(getUserStackScreen(screenName)).toContain("animation: 'none'");
    });

    ['Notification', 'Withdrawal', 'PickLocation', 'RequestDetail'].forEach((screenName) => {
      expect(getUserStackScreen(screenName)).not.toContain("animation: 'none'");
    });
  });
});
