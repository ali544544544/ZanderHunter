import { useState, useEffect } from 'react';
import { Spot } from '../data/spots';
import {
  ACCOUNT_DATA_CLEARED_EVENT,
  markAccountDataSaved,
  USER_SPOTS_STORAGE_KEY,
} from '../services/accountData';
import { readJson, writeJson } from '../services/storage';

export function useUserSpots() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);

  useEffect(() => {
    const loadUserSpots = () => {
      setUserSpots(readJson<Spot[]>(USER_SPOTS_STORAGE_KEY, [], Array.isArray as (value: unknown) => value is Spot[]));
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
    writeJson(USER_SPOTS_STORAGE_KEY, updated);
    markAccountDataSaved();
  };

  const deleteUserSpot = (id: string) => {
    const updated = userSpots.filter(s => s.id !== id);
    setUserSpots(updated);
    writeJson(USER_SPOTS_STORAGE_KEY, updated);
    markAccountDataSaved();
  };

  return { userSpots, addUserSpot, deleteUserSpot };
}
