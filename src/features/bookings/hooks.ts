import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bookingsApi from '@/services/api/bookings';

export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: () => bookingsApi.listMyBookings(),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
