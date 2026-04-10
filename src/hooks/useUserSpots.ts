import { useState, useEffect } from 'react';
import { Spot } from '../data/spots';

const LOCAL_STORAGE_KEY = 'zanderhunter_user_spots';

export function useUserSpots() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setUserSpots(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load user spots', e);
      }
    }
  }, []);

  const addUserSpot = (spot: Spot) => {
    const updated = [...userSpots, spot];
    setUserSpots(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteUserSpot = (id: string) => {
    const updated = userSpots.filter(s => s.id !== id);
    setUserSpots(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  return { userSpots, addUserSpot, deleteUserSpot };
}
