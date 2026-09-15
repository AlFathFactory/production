import { createBrowserRouter } from 'react-router-dom'

import { PlaceholderPage } from '../components/shared/PlaceholderPage'
import { NotFoundPage } from '../components/shared/NotFoundPage'
import { canAccessBendingDocuments, canAccessUserManagement } from '../features/auth/permissions'
import { LoginRoute } from '../features/auth/components/LoginRoute'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { BendingPage } from '../features/bending/BendingPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { ProductionPage } from '../features/production/ProductionPage'
import { AppLayout } from './layouts/AppLayout'
import { RequirePermission } from './navigation/RequirePermission'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <PlaceholderPage title="Dashboard" description="Dashboard insights will be available in a later task." />,
          },
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          {
            path: 'production',
            element: <ProductionPage />,
          },
          {
            path: 'bending',
            element: (
              <RequirePermission canAccess={canAccessBendingDocuments}>
                <BendingPage />
              </RequirePermission>
            ),
          },
          {
            path: 'documents',
            element: <PlaceholderPage title="Documents" description="The documents register will be available in a later task." />,
          },
          {
            path: 'users',
            element: (
              <RequirePermission canAccess={canAccessUserManagement}>
                <PlaceholderPage title="Users" description="User management will be available in a later task." />
              </RequirePermission>
            ),
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
])
