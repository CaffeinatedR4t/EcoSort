import { supabase } from '../services/api/supabase';

export const ACTIVE_PICKUP_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] as const;

export const ACTIVE_PICKUP_REQUEST_MESSAGE =
  'You already have an active pickup request. Please wait until it is completed before creating another one.';

export const assertUserCanCreatePickupRequest = async (userId: string) => {
  const { data, error } = await (supabase
    .from('pickup_requests') as any)
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ACTIVE_PICKUP_STATUSES)
    .limit(1);

  if (error) throw error;
  if ((data || []).length > 0) {
    throw new Error(ACTIVE_PICKUP_REQUEST_MESSAGE);
  }
};
