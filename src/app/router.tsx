import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { NotFoundPage } from '../components/shared/NotFoundPage'
import { canAccessBendingDocuments, canAccessUserManagement } from '../features/auth/permissions'
import { LoginRoute } from '../features/auth/components/LoginRoute'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { BendingPage } from '../features/bending/BendingPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { DocumentsPage } from '../features/documents/DocumentsPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { ProductionPage } from '../features/production/ProductionPage'
import { ReportsPage } from '../features/reports/ReportsPage'
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
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'bending',
            element: (
              <RequirePermission canAccess={canAccessBendingDocuments}>
                <Outlet />
              </RequirePermission>
            ),
            children: [
              { index: true, element: <Navigate to="issue" replace /> },
              { path: 'issue', element: <BendingPage /> },
              { path: 'receive', element: <BendingPage /> },
            ],
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
