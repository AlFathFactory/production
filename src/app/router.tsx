import { createBrowserRouter } from 'react-router-dom'

import { NotFoundPage } from '../components/shared/NotFoundPage'
import { canAccessBendingDocuments, canAccessUserManagement } from '../features/auth/permissions'
import { LoginRoute } from '../features/auth/components/LoginRoute'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { BendingPage } from '../features/bending/BendingPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { DocumentsPage } from '../features/documents/DocumentsPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { ProductionPage } from '../features/production/ProductionPage'
import { UsersPage } from '../features/users/UsersPage'
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
            element: <DashboardPage />,
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
            element: <DocumentsPage />,
          },
          {
            path: 'users',
            element: (
              <RequirePermission canAccess={canAccessUserManagement}>
                <UsersPage />
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
