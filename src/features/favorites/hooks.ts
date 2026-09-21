import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import * as favoritesApi from '@/services/api/favorites';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.listFavorites(),
    enabled: isAuthenticated,
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.addFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.removeFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
