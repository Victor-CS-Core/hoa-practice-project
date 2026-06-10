import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account } from "../app/api/agent";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => Account.listUsers(),
  });
}

export function usePromoteUserToAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => Account.promoteAdmin({ email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => Account.deleteUser({ email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
