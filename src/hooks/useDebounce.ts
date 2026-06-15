import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour implémenter un délai de débounce sur une valeur.
 * Utile pour optimiser les appels API ou les calculs coûteux lors de la saisie.
 * 
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes (par défaut 300ms)
 * @returns La valeur débouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
