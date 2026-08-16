"use client";

import { useState, useCallback } from "react";

interface Coords {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback((): Promise<Coords> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by this browser";
        setError(msg);
        setLoading(false);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const c = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCoords(c);
          setLoading(false);
          resolve(c);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { coords, error, loading, getLocation };
}