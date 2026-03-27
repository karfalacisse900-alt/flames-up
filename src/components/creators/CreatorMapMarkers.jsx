import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import CreatorProfilePopup from "./CreatorProfilePopup";

const CATEGORY_EMOJI = {
  painter: "🎨", dancer: "💃", musician: "🎵", videographer: "🎬",
  photographer: "📸", street_performer: "🎭", comedian: "😂",
  magician: "🪄", tattoo_artist: "✒️", caricaturist: "✏️", other: "🌟"
};

function buildMarkerEl(c) {
  // Fixed 50x50 wrapper — critical for correct anchor positioning
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative; width:50px; height:50px; cursor:pointer;";

  // Pulse ring — absolutely centered, doesn't affect layout
  const ring = document.createElement("div");
  ring.style.cssText = `
    position:absolute; top:50%; left:50%;
    width:66px; height:66px;
    transform:translate(-50%,-50%);
    border-radius:50%;
    border:2px solid rgba(224,92,42,0.6);
    animation:creatorPulse 2s ease-in-out infinite;
    pointer-events:none;
  `;
  wrapper.appendChild(ring);

  // Status bubble — above center, doesn't affect anchor
  if (c.status_message) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      position:absolute; bottom:calc(100% + 4px); left:50%; transform:translateX(-50%);
      white-space:nowrap; max-width:160px;
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

  // Avatar circle — fills the wrapper exactly
  const circle = document.createElement("div");
  circle.style.cssText = `
    position:absolute; top:0; left:0;
    width:50px; height:50px; border-radius:50%;
    border:3px solid #E05C2A;
    box-shadow:0 4px 16px rgba(224,92,42,0.5);
    overflow:hidden; background:linear-gradient(135deg,#E05C2A,#F97316);
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:700; color:white;
    z-index:1;
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

  // Name label — below center
  const label = document.createElement("div");
  label.style.cssText = `
    position:absolute; top:calc(100% + 3px); left:50%; transform:translateX(-50%);
    white-space:nowrap;
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
  const [selectedLngLat, setSelectedLngLat] = useState(null);
  // Pixel coords updated via map move listener for smooth popup tracking
  const [popupPixel, setPopupPixel] = useState(null);
  const markersRef = useRef({});
  const creatorsRef = useRef({});
  const selectedLngLatRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Creator.filter({
        approval_status: "approved",
        availability_status: "open",
      });
      setCreators(all.filter(c => c.latitude && c.longitude));
    };
    load();
    // Poll every 3 minutes to pick up fresh location updates
    const interval = setInterval(load, 3 * 60 * 1000);
    const unsub = base44.entities.Creator.subscribe(() => load());
    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => {
    if (!map || !mapReady || !window.mapboxgl) return;

    const activeIds = new Set(creators.map(c => c.id));

    creators.forEach(c => {
      creatorsRef.current[c.id] = c;

      if (markersRef.current[c.id]) {
        markersRef.current[c.id].setLngLat([c.longitude, c.latitude]);
        return;
      }

      const el = buildMarkerEl(c);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const creator = creatorsRef.current[c.id];
        const lngLat = [creator.longitude, creator.latitude];
        selectedLngLatRef.current = lngLat;
        setSelectedLngLat(lngLat);
        setPopupPixel(map.project(lngLat));
        setSelectedCreator({ ...creator });
      });

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);

      markersRef.current[c.id] = marker;
    });

    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete creatorsRef.current[id];
      }
    });
  }, [creators, map, mapReady]);

  // Update popup pixel coords on map move/zoom so it tracks the marker
  useEffect(() => {
    if (!map) return;
    const update = () => {
      if (selectedLngLatRef.current) {
        setPopupPixel(map.project(selectedLngLatRef.current));
      }
    };
    map.on("move", update);
    map.on("zoom", update);
    return () => { map.off("move", update); map.off("zoom", update); };
  }, [map]);

  const popupCoords = popupPixel;

  return (
    <>
      <style>{`
        @keyframes creatorPulse {
          0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.6;}
          50%{transform:translate(-50%,-50%) scale(1.5);opacity:0.1;}
        }
      `}</style>

      {selectedCreator && popupCoords && (
        <CreatorProfilePopup
          creator={selectedCreator}
          coords={popupCoords}
          mapContainer={map.getContainer()}
          currentUserEmail={currentUserEmail}
          onClose={() => { setSelectedCreator(null); setSelectedLngLat(null); selectedLngLatRef.current = null; setPopupPixel(null); }}
        />
      )}
    </>
  );
}