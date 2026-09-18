import { GuestRoute } from '@/app/GuestRoute'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

/*
 * Chaque écran est un fichier JavaScript chargé à la demande : la page de connexion
 * n'embarque ni le Kanban, ni le glisser-déposer, ni les feuilles de temps.
 */
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/pages/TasksPage').then((module) => ({ default: module.TasksPage })),
)
const TimesheetPage = lazy(() =>
  import('@/features/timesheets/pages/TimesheetPage').then((module) => ({ default: module.TimesheetPage })),
)

export function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timesheets"
          element={
            <ProtectedRoute>
              <TimesheetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </Suspense>
  )
}
