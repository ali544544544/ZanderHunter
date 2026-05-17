import { useState, useEffect } from 'react';
import { Spot } from '../data/spots';
import {
  ACCOUNT_DATA_CLEARED_EVENT,
  markAccountDataSaved,
  USER_SPOTS_STORAGE_KEY,
} from '../services/accountData';

export function useUserSpots() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);

  useEffect(() => {
    const loadUserSpots = () => {
      const saved = localStorage.getItem(USER_SPOTS_STORAGE_KEY);
      if (!saved) {
        setUserSpots([]);
        return;
      }

      try {
        setUserSpots(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load user spots', e);
        setUserSpots([]);
      }
    };

    loadUserSpots();
    window.addEventListener(ACCOUNT_DATA_CLEARED_EVENT, loadUserSpots);

    return () => {
      window.removeEventListener(ACCOUNT_DATA_CLEARED_EVENT, loadUserSpots);
    };
  }, []);

  const addUserSpot = (spot: Spot) => {
    const updated = [...userSpots, spot];
    setUserSpots(updated);
    localStorage.setItem(USER_SPOTS_STORAGE_KEY, JSON.stringify(updated));
    markAccountDataSaved();
  };

  const deleteUserSpot = (id: string) => {
    const updated = userSpots.filter(s => s.id !== id);
    setUserSpots(updated);
    localStorage.setItem(USER_SPOTS_STORAGE_KEY, JSON.stringify(updated));
    markAccountDataSaved();
  };

  return { userSpots, addUserSpot, deleteUserSpot };
}
