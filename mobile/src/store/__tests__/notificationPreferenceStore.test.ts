import { useNotificationPreferenceStore } from '../notificationPreferenceStore';
import { supabase } from '../../services/api/supabase';

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('notificationPreferenceStore missing table fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationPreferenceStore.setState({
      preferencesByUser: {},
      loading: false,
      saving: false,
      migrationRequired: false,
    });
  });

  it('uses default preferences when Supabase schema cache does not have the table', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.notification_preferences' in the schema cache",
      },
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const preferences = await useNotificationPreferenceStore.getState().fetchPreferences('user-1');

    expect(preferences.pickup_enabled).toBe(true);
    expect(preferences.reward_enabled).toBe(true);
    expect(useNotificationPreferenceStore.getState().migrationRequired).toBe(true);
  });

  it('keeps toggled values locally when the table is still missing', async () => {
    const upsert = jest.fn().mockResolvedValue({
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.notification_preferences' in the schema cache",
      },
    });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    const result = await useNotificationPreferenceStore
      .getState()
      .updatePreference('user-1', 'pickup_enabled', false);

    expect(result.success).toBe(true);
    expect(useNotificationPreferenceStore.getState().preferencesByUser['user-1'].pickup_enabled).toBe(false);
    expect(useNotificationPreferenceStore.getState().migrationRequired).toBe(true);
  });
});
