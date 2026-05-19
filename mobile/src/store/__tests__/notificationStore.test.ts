import { useNotificationStore } from '../notificationStore';
import { useNotificationPreferenceStore } from '../notificationPreferenceStore';
import { supabase } from '../../services/api/supabase';

jest.mock('../notificationPreferenceStore');
jest.mock('../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('notificationStore preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationStore.setState({
      notifications: [],
      loading: false,
      unreadCount: 0,
    });
  });

  it('creates notifications when the user preference allows the type', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (useNotificationPreferenceStore as any).getState = jest.fn(() => ({
      isNotificationEnabled: jest.fn().mockResolvedValue(true),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await useNotificationStore.getState().createNotification({
      userId: 'user-1',
      title: 'Pickup',
      message: 'New update',
      type: 'pickup',
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(insert).toHaveBeenCalledWith([
      {
        user_id: 'user-1',
        title: 'Pickup',
        message: 'New update',
        type: 'pickup',
        is_read: false,
      },
    ]);
  });

  it('skips notification creation when the user preference disables the type', async () => {
    const insert = jest.fn();
    (useNotificationPreferenceStore as any).getState = jest.fn(() => ({
      isNotificationEnabled: jest.fn().mockResolvedValue(false),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await useNotificationStore.getState().createNotification({
      userId: 'user-1',
      title: 'Pickup',
      message: 'New update',
      type: 'pickup',
    });

    expect(insert).not.toHaveBeenCalled();
  });
});
