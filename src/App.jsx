import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';

export default function App() {
  // Global favorites state with localStorage persistence
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nearby_explorer_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Share the home page's current location with the place detail route.
  const [userCoords, setUserCoords] = useState({ lat: 22.8841, lon: 72.6738 });

  useEffect(() => {
    try {
      localStorage.setItem('nearby_explorer_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage:', e);
    }
  }, [favorites]);

  const handleToggleFavorite = (place) => {
    if (!place?.id) return;
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      if (exists) {
        return prev.filter((p) => p.id !== place.id);
      }
      return [...prev, place];
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onUserCoordsChange={setUserCoords}
            />
          }
        />
        <Route
          path="/place/:placeId"
          element={
            <PlaceDetailPage
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              userCoords={userCoords}
            />
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
