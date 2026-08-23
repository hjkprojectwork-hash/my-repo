import { useRoutes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { routes } from '@/routes';

/**
 * Root application component.
 *
 * AuthProvider wraps the entire route tree so that useAuth() is
 * available everywhere — layouts, pages, guards.
 *
 * Additional context providers (CartProvider etc.) will be added
 * as outer wrappers in future phases.
 */
function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
