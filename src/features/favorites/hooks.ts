import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as favoritesApi from '@/services/api/favorites';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.listFavorites(),
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
