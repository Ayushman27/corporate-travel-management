import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
      link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
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
        // Default coordinates (Delhi -> Mumbai)
        let start = [28.6139, 77.2090];
        let end = [19.0760, 72.8777];

        if (startCity && endCity) {
           // Small delay to prevent API rate limit issues if component remounts rapidly
           await new Promise(r => setTimeout(r, 300));
           
           const startRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startCity)}`);
           const startData = await startRes.json();
           if (startData && startData.length > 0) {
             start = [parseFloat(startData[0].lat), parseFloat(startData[0].lon)];
           }
           
           const endRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endCity)}`);
           const endData = await endRes.json();
           if (endData && endData.length > 0) {
             end = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];
           }
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
        zoomControl: false // Cleaner UI
      }).setView(center, 5);
      
      mapInstance.current = map;

      // Premium looking dark/light tile option
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Custom markers
      const markerHtml = `
        <div style="
          width: 24px; height: 24px; 
          background: var(--atmos-dark); 
          border: 3px solid #C4A25D; 
          border-radius: 50%; 
          box-shadow: 0 4px 12px rgba(196,162,93,0.5);
        "></div>
      `;
      
      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-map-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker(start, { icon: customIcon }).addTo(map).bindPopup(`<b>Start</b><br/>${startCity || 'Origin'}`);
      L.marker(end, { icon: customIcon }).addTo(map).bindPopup(`<b>End</b><br/>${endCity || 'Destination'}`);

      // Draw dashed golden line
      const line = L.polyline([start, end], { 
        color: '#C4A25D', 
        weight: 3, 
        dashArray: '8, 8', 
        opacity: 0.9 
      }).addTo(map);

      // Fit bounds with animation
      setTimeout(() => {
        if (mapInstance.current) {
          map.fitBounds(line.getBounds(), { padding: [60, 60], animate: true, duration: 1 });
        }
      }, 500);
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
        border: '1px solid rgba(196,162,93,0.15)',
        borderRadius: '1.2rem',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(44,43,41,0.06)'
      }}
    >
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #C4A25D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Mapping Route...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
    </motion.div>
  );
}
