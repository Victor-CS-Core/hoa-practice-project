import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Profiles } from '../app/api/agent';
import type { UpdateProfileValues } from '../types/profile';

export function useProfile(username?: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => Profiles.detail(username as string),
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, values }: { username: string; values: UpdateProfileValues }) =>
      Profiles.update(username, values),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
    },
  });
}
