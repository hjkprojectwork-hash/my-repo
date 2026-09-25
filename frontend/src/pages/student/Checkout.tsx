import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

/**
 * Checkout — Legacy redirect.
 *
 * The checkout flow has been simplified: students now reserve directly from the Cart.
 * This component exists solely to redirect any legacy /checkout URLs to /cart.
 */
export default function Checkout() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(ROUTES.CART, { replace: true });
  }, [navigate]);

  return null;
}
