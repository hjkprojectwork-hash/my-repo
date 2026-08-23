/** Application-wide constants for CampusOne */

export const APP_NAME = 'CampusOne';
export const APP_TAGLINE = 'Campus Reservation & Pickup Platform';

/** Staff types supported by the system — values match UserRole exactly */
export const STAFF_TYPES = [
  { value: 'canteen_staff', label: 'Canteen Staff' },
  { value: 'bookstore_staff', label: 'Bookstore Staff' },
] as const;

export type StaffType = (typeof STAFF_TYPES)[number]['value'];

/** Year options for student profile */
export const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const;

export type YearOption = (typeof YEAR_OPTIONS)[number];

/** Reservation status display config */
export const RESERVATION_STATUS = {
  PENDING: { label: 'Pending', color: '#F59E0B' },
  READY: { label: 'Ready for Pickup', color: '#0EA5E9' },
  COLLECTED: { label: 'Collected', color: '#10B981' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444' },
} as const;

export type ReservationStatus = keyof typeof RESERVATION_STATUS;

/** Route paths — single source of truth */
export const ROUTES = {
  // Public
  HOME: '/',
  REGISTER: '/register',
  REGISTER_STUDENT: '/register/student',
  REGISTER_STAFF: '/register/staff',
  LOGIN: '/login',
  LOGIN_STAFF: '/login/staff',

  // Student
  PROFILE_SETUP: '/profile/setup',
  DASHBOARD: '/dashboard',
  ITEMS: '/items',
  ITEM_DETAIL: '/items/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  RESERVATIONS: '/reservations',
  RESERVATION_DETAIL: '/reservations/:id',

  // Staff
  STAFF_CANTEEN: '/staff/canteen',
  STAFF_BOOKSTORE: '/staff/bookstore',
  STAFF_RESERVATIONS: '/staff/reservations',

  // Errors
  NOT_FOUND: '*',
} as const;
