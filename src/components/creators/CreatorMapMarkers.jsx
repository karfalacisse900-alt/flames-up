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

function buildMarkerEl(c) {
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

  // Status bubble (shown above avatar when status_message is set)
  if (c.status_message) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      position:absolute; bottom:100%; left:50%; transform:translateX(-50%);
      margin-bottom:6px; white-space:nowrap; max-width:160px;
      background:#FFF7ED; color:#C2410C;
      font-size:9px; font-weight:700;
      padding:3px 7px; border-radius:10px;
      border:1px solid #FED7AA;
      pointer-events:none; z-index:3;
      overflow:hidden; text-overflow:ellipsis;
    `;
    bubble.textContent = `💬 ${c.status_message.length > 20 ? c.status_message.slice(0, 20) + "…" : c.status_message}`;
    wrapper.appendChild(bubble);
  }

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
    img.onerror = () => { img.remove(); circle.textContent = CATEGORY_EMOJI[c.category] || "🌟"; };
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

  return wrapper;
}

export default function CreatorMapMarkers({ map, mapReady, currentUserEmail }) {
  const [creators, setCreators] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [popupCoords, setPopupCoords] = useState(null);
  const markersRef = useRef({});      // id -> mapboxgl.Marker
  const creatorsRef = useRef({});     // id -> creator data (for click handlers)

  // Fetch active creators + subscribe to real-time updates
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

  // Manage markers: only move existing ones, create/destroy as needed
  useEffect(() => {
    if (!map || !mapReady || !window.mapboxgl) return;

    const activeIds = new Set(creators.map(c => c.id));

    creators.forEach(c => {
      creatorsRef.current[c.id] = c;

      if (markersRef.current[c.id]) {
        // Just update position — no DOM recreation, no jump
        markersRef.current[c.id].setLngLat([c.longitude, c.latitude]);
        return;
      }

      // Build fresh marker
      const el = buildMarkerEl(c);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const creator = creatorsRef.current[c.id];
        const pt = map.project([creator.longitude, creator.latitude]);
        setPopupCoords({ x: pt.x, y: pt.y });
        setSelectedCreator({ ...creator });
      });

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);

      markersRef.current[c.id] = marker;
    });

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete creatorsRef.current[id];
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