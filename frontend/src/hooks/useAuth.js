'use client';

import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';

const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      navigate('/login');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      navigate('/login');
    },
  });

  const login = (email, password) => loginMutation.mutate({ email, password });
  const logout = () => logoutMutation.mutate();
  const register = (userData) => registerMutation.mutate(userData);

  return {
    user,
    loading: isLoading,
    login,
    logout,
    register,
  };
};

export default useAuth;
