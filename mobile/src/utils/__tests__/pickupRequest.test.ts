import {
  ACTIVE_PICKUP_REQUEST_MESSAGE,
  ACTIVE_PICKUP_STATUSES,
  assertUserCanCreatePickupRequest,
} from '../pickupRequest';
import { supabase } from '../../services/api/supabase';

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const buildActiveRequestQuery = (data: any[] = [], error: any = null) => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data, error }),
  };
  return query;
};

describe('pickup request creation guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows creation when the user has no active pickup request', async () => {
    const query = buildActiveRequestQuery([]);
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(assertUserCanCreatePickupRequest('user-1')).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('pickup_requests');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.in).toHaveBeenCalledWith('status', ACTIVE_PICKUP_STATUSES);
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('blocks creation when the user already has an active pickup request', async () => {
    const query = buildActiveRequestQuery([{ id: 'pickup-1', status: 'PENDING' }]);
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(assertUserCanCreatePickupRequest('user-1')).rejects.toThrow(
      ACTIVE_PICKUP_REQUEST_MESSAGE
    );
  });
});
