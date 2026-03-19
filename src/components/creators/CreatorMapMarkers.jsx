import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import CreatorProfilePopup from "./CreatorProfilePopup";

const CATEGORY_EMOJI = {
  painter: "🎨", dancer: "💃", musician: "🎵", videographer: "🎬",
  photographer: "📸", street_performer: "🎭", comedian: "😂",
  magician: "🪄", tattoo_artist: "✒️", caricaturist: "✏️", other: "🌟"
};

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function CreatorMapMarkers({ map, mapReady }) {
  const [creators, setCreators] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [popupCoords, setPopupCoords] = useState(null);
  const markersRef = useRef({});

  // Fetch active creators
  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Creator.filter({
        approval_status: "approved",
        availability_status: "open",
      });
      setCreators(all.filter(c => c.latitude && c.longitude));
    };
    load();
    const unsub = base44.entities.Creator.subscribe(() => load());
    return () => unsub();
  }, []);

  // Render markers on map
  useEffect(() => {
    if (!map || !mapReady || !window.mapboxgl) return;
    const activeIds = new Set();

    creators.forEach(c => {
      activeIds.add(c.id);
      if (markersRef.current[c.id]) {
        markersRef.current[c.id].setLngLat([c.longitude, c.latitude]);
        return;
      }

      // Build marker element
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative; cursor:pointer;";

      // Pulse ring
      const ring = document.createElement("div");
      ring.style.cssText = `
        position:absolute; top:-6px; left:-6px; 
        width:62px; height:62px; border-radius:50%;
        border:2px solid rgba(224,92,42,0.6);
        animation:creatorPulse 2s ease-in-out infinite;
        pointer-events:none;
      `;
      wrapper.appendChild(ring);

      // Avatar circle
      const circle = document.createElement("div");
      circle.style.cssText = `
        width:50px; height:50px; border-radius:50%;
        border:3px solid #E05C2A;
        box-shadow:0 4px 16px rgba(224,92,42,0.5);
        overflow:hidden; background:linear-gradient(135deg,#E05C2A,#F97316);
        display:flex; align-items:center; justify-content:center;
        font-size:14px; font-weight:700; color:white;
        position:relative; z-index:1;
      `;
      if (c.profile_image) {
        const img = document.createElement("img");
        img.src = c.profile_image;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        img.onerror = () => { img.remove(); circle.textContent = getInitials(c.full_name); };
        circle.appendChild(img);
      } else {
        circle.textContent = CATEGORY_EMOJI[c.category] || "🌟";
      }
      wrapper.appendChild(circle);

      // Name label
      const label = document.createElement("div");
      label.style.cssText = `
        position:absolute; top:100%; left:50%; transform:translateX(-50%);
        margin-top:3px; white-space:nowrap;
        background:rgba(0,0,0,0.75); color:#fff;
        font-size:10px; font-weight:700;
        padding:2px 6px; border-radius:8px;
        pointer-events:none; z-index:2;
      `;
      label.textContent = `${CATEGORY_EMOJI[c.category] || "🌟"} ${c.full_name.split(" ")[0]}`;
      wrapper.appendChild(label);

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        const pt = map.project([c.longitude, c.latitude]);
        setPopupCoords({ x: pt.x, y: pt.y });
        setSelectedCreator(c);
      });

      const marker = new window.mapboxgl.Marker({ element: wrapper, anchor: "center" })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);

      markersRef.current[c.id] = marker;
    });

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [creators, map, mapReady]);

  return (
    <>
      <style>{`
        @keyframes creatorPulse {
          0%,100%{transform:scale(1);opacity:0.6;}
          50%{transform:scale(1.5);opacity:0.1;}
        }
      `}</style>

      {selectedCreator && popupCoords && (
        <CreatorProfilePopup
          creator={selectedCreator}
          coords={popupCoords}
          mapContainer={map.getContainer()}
          onClose={() => { setSelectedCreator(null); setPopupCoords(null); }}
        />
      )}
    </>
  );
}