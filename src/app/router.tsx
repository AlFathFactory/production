import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginRoute } from '../features/auth/components/LoginRoute'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { HomePage } from './HomePage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
