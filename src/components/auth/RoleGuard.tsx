/**
 * RoleGuard — guards a route to a specific set of roles.
 *
 * This is a thin wrapper around ProtectedRoute that makes role-restricted
 * routes more readable in the route configuration.
 *
 * Usage:
 *   <RoleGuard roles={['student']} loginPath="/login">
 *     <Dashboard />
 *   </RoleGuard>
 *
 *   <RoleGuard roles={['canteen_staff']} loginPath="/login/staff">
 *     <CanteenDashboard />
 *   </RoleGuard>
 */

import type { ReactNode } from 'react';
import ProtectedRoute from './ProtectedRoute';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  /** Roles permitted to access the wrapped content */
  roles: UserRole[];
  /** Login page to redirect unauthenticated users to */
  loginPath?: string;
  children: ReactNode;
}

export default function RoleGuard({ roles, loginPath, children }: RoleGuardProps) {
  return (
    <ProtectedRoute allowedRoles={roles} loginPath={loginPath}>
      {children}
    </ProtectedRoute>
  );
}
