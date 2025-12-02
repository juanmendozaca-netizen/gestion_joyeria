// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  registerUser,
  loginUser,
  logoutUser,
  fetchUserProfile,
  checkAuthStatus,
} from '../api'

export function useAuth() {
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)

  // Estado de autenticación
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuthStatus,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const isAuthenticated = authData?.data?.authenticated || false
  const user = authData?.data?.user || null

  // Persistencia manual (opcional, pero útil para UI rápida)
  useEffect(() => {
    const userFromStorage = localStorage.getItem('user')
    const token = localStorage.getItem('auth_token')
    if (userFromStorage && token) {
      // No seteamos aquí, confiamos en la API, pero prellenamos para evitar flash
    }
    setIsInitialized(true)
  }, [])

  // Mutaciones
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (response) => {
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] }) // limpiar carrito si era de sesión
    },
  })

  return {
    isAuthenticated,
    user,
    isLoading: isLoading && !isInitialized,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}

