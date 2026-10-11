import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Footprints, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchWalkingRoute, getTileUrl } from '../services/geoapify';
import { getGeoapifyKey } from '../services/apiKeys';

// Custom iOS blue pulsating dot for User Location
const userIcon = L.divIcon({
  className: 'user-location-pin',
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 122, 255, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #007aff; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,122,255,0.6);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom Apple Category Pin
function createCategoryIcon(category = '', apiKey = '') {
  let pinColor = '#007AFF'; // Apple Blue
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe')) pinColor = '#FF9500'; // Apple Orange
  else if (cat.includes('sight') || cat.includes('attraction')) pinColor = '#34C759'; // Apple Green
  else if (cat.includes('entertainment')) pinColor = '#AF52DE'; // Apple Purple
  else if (cat.includes('shopping')) pinColor = '#FF2D55'; // Apple Pink
  else if (cat.includes('service')) pinColor = '#5856D6'; // Apple Indigo

  return L.divIcon({
    className: 'custom-venue-pin',
    html: `
      <div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 12px; background: ${pinColor}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px ${pinColor}80;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="width: 4px; height: 6px; background: #ffffff; border-radius: 2px; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
}

// Controller component to zoom/pan bounds smoothly
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

export function MapView({ place, userCoords }) {
  const [walkingRoute, setWalkingRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [showRoute, setShowRoute] = useState(false);

  const apiKey = getGeoapifyKey();
  const tileUrl = getTileUrl(apiKey);

  const placeLat = Number(place.lat) || 37.7749;
  const placeLon = Number(place.lon) || -122.4194;
  const userLat = Number(userCoords?.lat) || placeLat - 0.005;
  const userLon = Number(userCoords?.lon) || placeLon - 0.005;

  const venueIcon = createCategoryIcon(place.category, apiKey);

  const handleFetchRoute = async () => {
    if (walkingRoute) {
      setShowRoute(!showRoute);
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const { route } = await fetchWalkingRoute({
        fromLat: userLat,
        fromLon: userLon,
        toLat: placeLat,
        toLon: placeLon,
        apiKey,
      });

      setWalkingRoute(route);
      setShowRoute(true);
    } catch (err) {
      console.error('Walking route error:', err);
      setRouteError('Could not fetch walking route');
    } finally {
      setLoadingRoute(false);
    }
  };

  const mapBounds = showRoute && walkingRoute
    ? [
        [userLat, userLon],
        [placeLat, placeLon],
      ]
    : null;

  return (
    <div className="rounded-3xl overflow-hidden border border-white/20 shadow-xl h-72 sm:h-80 relative bg-slate-900">
      <MapContainer
        center={[placeLat, placeLon]}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
          maxZoom={19}
        />

        {/* User Location Marker */}
        <Marker position={[userLat, userLon]} icon={userIcon}>
          <Popup className="ios-popup">
            <div className="text-xs font-semibold text-slate-800">Your Location</div>
          </Popup>
        </Marker>

        {/* Place Marker */}
        <Marker position={[placeLat, placeLon]} icon={venueIcon}>
          <Popup className="ios-popup">
            <div className="text-xs font-bold text-slate-900">{place.name}</div>
            <div className="text-[11px] text-slate-600">{place.category}</div>
          </Popup>
        </Marker>

        {/* Route Polyline */}
        {showRoute && walkingRoute?.coordinates && (
          <Polyline
            positions={walkingRoute.coordinates}
            pathOptions={{
              color: '#007AFF',
              weight: 5,
              opacity: 0.9,
              dashArray: '8, 8',
              lineCap: 'round',
            }}
          />
        )}

        {mapBounds && <MapBoundsUpdater bounds={mapBounds} />}
      </MapContainer>

      {/* Walking Route Action Bar (Frosted overlay at bottom) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Walking Route</div>
            {showRoute && walkingRoute ? (
              <div className="text-[11px] text-blue-300 font-medium">
                {walkingRoute.distanceMeters >= 1000
                  ? `${(walkingRoute.distanceMeters / 1000).toFixed(1)} km`
                  : `${walkingRoute.distanceMeters} m`}{' '}
                • ~{walkingRoute.durationMinutes} min walk
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">Powered by Geoapify Routing</div>
            )}
          </div>
        </div>

        <button
          onClick={handleFetchRoute}
          disabled={loadingRoute}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all active:scale-95 cursor-pointer ${
            showRoute
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
          }`}
        >
          {loadingRoute ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Routing...</span>
            </>
          ) : showRoute ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hide Route</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Show Walking Route</span>
            </>
          )}
        </button>
      </div>

      {routeError && (
        <div className="absolute top-3 left-3 right-3 z-10 p-2 rounded-xl bg-rose-500/80 backdrop-blur-md text-white text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{routeError}</span>
        </div>
      )}
    </div>
  );
}
