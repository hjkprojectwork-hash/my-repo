import { type RouteObject } from 'react-router-dom';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import StudentLayout from '@/layouts/StudentLayout';
import StaffLayout from '@/layouts/StaffLayout';

// Guards
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentGuard from '@/components/auth/StudentGuard';

// Pages — Public
import Landing from '@/pages/Landing';
import AccountSelection from '@/pages/auth/AccountSelection';
import StudentRegister from '@/pages/auth/StudentRegister';
import StaffRegister from '@/pages/auth/StaffRegister';
import StudentLogin from '@/pages/auth/StudentLogin';
import StaffLogin from '@/pages/auth/StaffLogin';

// Pages — Student
import StudentDashboard from '@/pages/student/Dashboard';
import ProfileSetup from '@/pages/student/ProfileSetup';
import Items from '@/pages/student/Items';
import ItemDetail from '@/pages/student/ItemDetail';
import Cart from '@/pages/student/Cart';
import Checkout from '@/pages/student/Checkout';
import Reservations from '@/pages/student/Reservations';
import ReservationDetail from '@/pages/student/ReservationDetail';

// Pages — Staff
import CanteenDashboard from '@/pages/staff/CanteenDashboard';
import BookstoreDashboard from '@/pages/staff/BookstoreDashboard';
import StaffReservations from '@/pages/staff/StaffReservations';

// Pages — Errors
import NotFound from '@/pages/errors/NotFound';

import { ROUTES } from '@/constants';

/**
 * Central route configuration for CampusOne.
 *
 * Route guards are now active:
 * - Public routes: no guard (auth pages redirect if already logged in)
 * - /profile/setup: requires student auth, skips profile-completion check
 * - Student routes: StudentGuard (auth + profile completion + role)
 * - Staff routes: ProtectedRoute with allowedRoles
 */
export const routes: RouteObject[] = [
  /* ══════════════════════════════════════════════════
     PUBLIC ROUTES
     Wrapped in MainLayout. Auth pages handle their own
     redirect if the user is already authenticated.
     ══════════════════════════════════════════════════ */
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <Landing /> },
      { path: ROUTES.REGISTER, element: <AccountSelection /> },
      { path: ROUTES.REGISTER_STUDENT, element: <StudentRegister /> },
      { path: ROUTES.REGISTER_STAFF, element: <StaffRegister /> },
      { path: ROUTES.LOGIN, element: <StudentLogin /> },
      { path: ROUTES.LOGIN_STAFF, element: <StaffLogin /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     STUDENT — PROFILE SETUP
     Requires: authenticated student
     Skips profile-completion check (user IS on the setup page)
     ══════════════════════════════════════════════════ */
  {
    element: (
      <StudentGuard skipProfileCheck>
        <StudentLayout />
      </StudentGuard>
    ),
    children: [
      { path: ROUTES.PROFILE_SETUP, element: <ProfileSetup /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     STUDENT ROUTES
     Requires: authenticated student WITH completed profile
     StudentGuard handles: auth + role + profile completion
     ══════════════════════════════════════════════════ */
  {
    element: (
      <StudentGuard>
        <StudentLayout />
      </StudentGuard>
    ),
    children: [
      { path: ROUTES.DASHBOARD, element: <StudentDashboard /> },
      { path: ROUTES.ITEMS, element: <Items /> },
      { path: ROUTES.ITEM_DETAIL, element: <ItemDetail /> },
      { path: ROUTES.CART, element: <Cart /> },
      { path: ROUTES.CHECKOUT, element: <Checkout /> },
      { path: ROUTES.RESERVATIONS, element: <Reservations /> },
      { path: ROUTES.RESERVATION_DETAIL, element: <ReservationDetail /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     STAFF — CANTEEN
     Requires: canteen_staff role
     ══════════════════════════════════════════════════ */
  {
    element: (
      <ProtectedRoute allowedRoles={['canteen_staff']} loginPath={ROUTES.LOGIN_STAFF}>
        <StaffLayout shopType="canteen" />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.STAFF_CANTEEN, element: <CanteenDashboard /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     STAFF — BOOKSTORE
     Requires: bookstore_staff role
     ══════════════════════════════════════════════════ */
  {
    element: (
      <ProtectedRoute allowedRoles={['bookstore_staff']} loginPath={ROUTES.LOGIN_STAFF}>
        <StaffLayout shopType="bookstore" />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.STAFF_BOOKSTORE, element: <BookstoreDashboard /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     STAFF — SHARED RESERVATIONS VIEW
     Requires: canteen_staff OR bookstore_staff
     ══════════════════════════════════════════════════ */
  {
    element: (
      <ProtectedRoute
        allowedRoles={['canteen_staff', 'bookstore_staff']}
        loginPath={ROUTES.LOGIN_STAFF}
      >
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.STAFF_RESERVATIONS, element: <StaffReservations /> },
    ],
  },

  /* ══════════════════════════════════════════════════
     404
     ══════════════════════════════════════════════════ */
  { path: '*', element: <NotFound /> },
];
