import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const CITY_COORDS = {
  Mumbai: [19.0760, 72.8777],
  Delhi: [28.6139, 77.2090],
  Bangalore: [12.9716, 77.5946],
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Hyderabad: [17.3850, 78.4867],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Goa: [15.2993, 74.1240],
  Agra: [27.1767, 78.0081],
  Bhubaneswar: [20.2961, 85.8245],
  Chandigarh: [30.7333, 76.7794],
  Kochi: [9.9312, 76.2673],
  Lucknow: [26.8467, 80.9462],
  Nagpur: [21.1458, 79.0882],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
};

export default function TripMap({ startCity, endCity }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (isMounted) loadCoordinatesAndInitMap();
      };
      document.head.appendChild(script);
    } else {
      loadCoordinatesAndInitMap();
    }

    async function loadCoordinatesAndInitMap() {
      try {
        setLoading(true);
        let start = CITY_COORDS[startCity] || [19.0760, 72.8777]; // Default Mumbai
        let end = CITY_COORDS[endCity] || [28.6139, 77.2090];     // Default Delhi

        // If not in preset map, fetch from OpenStreetMap Nominatim
        if (!CITY_COORDS[startCity] && startCity) {
          try {
            const startRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startCity)}`);
            const startData = await startRes.json();
            if (startData && startData.length > 0) {
              start = [parseFloat(startData[0].lat), parseFloat(startData[0].lon)];
            }
          } catch (_) {}
        }

        if (!CITY_COORDS[endCity] && endCity) {
          try {
            const endRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endCity)}`);
            const endData = await endRes.json();
            if (endData && endData.length > 0) {
              end = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];
            }
          } catch (_) {}
        }

        if (isMounted) {
          initMap(start, end);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Map] Error loading map data:', err);
        if (isMounted) setLoading(false);
      }
    }

    function initMap(start, end) {
      if (!mapRef.current || !window.L) return;

      // Cleanup previous map if exists
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const L = window.L;
      const center = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2
      ];

      const map = L.map(mapRef.current, {
        zoomControl: false
      }).setView(center, 5);

      mapInstance.current = map;

      // Official free OpenStreetMap tile layer (no API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom markers with gold glow
      const markerHtml = `
        <div style="
          width: 22px; height: 22px; 
          background: #1C1917; 
          border: 3px solid #C4A25D; 
          border-radius: 50%; 
          box-shadow: 0 4px 14px rgba(196,162,93,0.6);
        "></div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-map-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker(start, { icon: customIcon }).addTo(map).bindPopup(`<b>Start</b><br/>${startCity || 'Origin'}`);
      L.marker(end, { icon: customIcon }).addTo(map).bindPopup(`<b>End</b><br/>${endCity || 'Destination'}`);

      // Draw dashed golden route line
      const line = L.polyline([start, end], { 
        color: '#C4A25D', 
        weight: 3.5, 
        dashArray: '8, 8', 
        opacity: 0.95 
      }).addTo(map);

      // Fit bounds with smooth animation
      setTimeout(() => {
        if (mapInstance.current) {
          map.fitBounds(line.getBounds(), { padding: [50, 50], animate: true, duration: 1 });
        }
      }, 350);
    }

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [startCity, endCity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      style={{
        width: '100%',
        height: '320px',
        background: 'var(--atmos-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(196,162,93,0.18)',
        borderRadius: '1.2rem',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(44,43,41,0.08)'
      }}
    >
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(28,25,23,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #C4A25D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', fontWeight: 600, color: '#C4A25D' }}>Mapping Route...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
    </motion.div>
  );
}
