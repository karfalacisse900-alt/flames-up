import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, SlidersHorizontal, X, Users, ArrowLeft, Search, Navigation, Star, Phone, Globe, Clock } from "lucide-react";
import ProximityNotifier from "@/components/friends/ProximityNotifier";
import CreatorMapMarkers from "@/components/creators/CreatorMapMarkers";
import MapCategoryCarousel from "./MapCategoryCarousel";
import UserPinPopup from "./UserPinPopup";
import LocationPrivacyPanel from "./LocationPrivacyPanel";
import PlaceHub from "@/components/community/PlaceHub";
import NearbyPeopleModal from "./NearbyPeopleModal";

const RADIUS_OPTIONS = [1, 5, 10, 25];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const CATEGORY_TO_GTYPE = {
  restaurant: "restaurant", cafe: "cafe", fast_food: "meal_takeaway",
  park: "park", shopping: "shopping_mall", grocery: "supermarket",
  gas: "gas_station", hotel: "lodging", bar: "bar",
  hospital: "hospital", pharmacy: "pharmacy", entertainment: "movie_theater",
  gym: "gym", study_spot: "library", travel: "transit_station",
  bank: "bank", church: "church", parking: "parking", spa: "spa",
  airport: "airport", food: "food",
};

export default function PlacesGoogleMapView({ onOpenPlace, user: userProp, onBack, openNearby }) {
  const [apiKey, setApiKey] = useState(null);
  const [currentUser, setCurrentUser] = useState(userProp || null);
  const [userLoc, setUserLoc] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [follows, setFollows] = useState([]);
  const [radius, setRadius] = useState(5);
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);
  const [myPresence, setMyPresence] = useState(null);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [selectedUserPresence, setSelectedUserPresence] = useState(null);
  const [popupCoords, setPopupCoords] = useState(null);
  const [error, setError] = useState(null);
  const [activeCategories, setActiveCategories] = useState(["all"]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlaceHub, setShowPlaceHub] = useState(false);
  const [creatorEmails, setCreatorEmails] = useState(new Set());

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const selfMarkerRef = useRef(null);
  const userMarkersRef = useRef({});
  const gpsWatchRef = useRef(null);
  const dbThrottleRef = useRef(null);
  const presenceSubRef = useRef(null);
  const myPresenceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const searchPinRef = useRef(null);
  const gpsStartedRef = useRef(false);

  useEffect(() => { myPresenceRef.current = myPresence; }, [myPresence]);
  useEffect(() => { if (openNearby) setShowNearbyModal(true); }, [openNearby]);

  // Load user + API key
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = userProp || await base44.auth.me();
        if (!u) return;
        const profiles = await base44.entities.UserProfile.filter({ user_email: u.email });
        const avatar = profiles[0]?.avatar_url || u.avatar_url || "";
        setCurrentUser({ ...u, avatar_url: avatar });
      } catch {}
    };
    loadUser();
    base44.functions.invoke("googleMapsToken", {})
      .then(res => setApiKey(res.data?.key || res.data))
      .catch(() => setError("Could not load map API key"));
  }, []);

  // GPS initial
  useEffect(() => {
    if (!navigator.geolocation) { setUserLoc({ lat: 40.7128, lng: -74.006 }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc({ lat: 40.7128, lng: -74.006 }),
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, []);

  // Init Google Map
  useEffect(() => {
    if (!apiKey || !userLoc || !mapRef.current || mapInst.current) return;
    let destroyed = false;

    const init = async () => {
      if (!window.google?.maps) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          s.async = true;
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (destroyed) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: userLoc,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
          { featureType: "transit", stylers: [{ visibility: "simplified" }] },
        ],
        clickableIcons: true,
      });

      mapInst.current = map;
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

      // POI click handler
      map.addListener("click", (e) => {
        if (e.placeId) {
          e.stop();
          fetchPlaceDetails(e.placeId);
        } else {
          setSelectedPlace(null);
          setSelectedUserPresence(null);
        }
      });

      setMapReady(true);
    };

    init().catch(() => setError("Map failed to load"));
    return () => {
      destroyed = true;
      if (searchPinRef.current) { searchPinRef.current.setMap(null); searchPinRef.current = null; }
    };
  }, [apiKey, userLoc]);

  function fetchPlaceDetails(placeId) {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ["name", "formatted_address", "geometry", "photos", "rating", "user_ratings_total",
          "opening_hours", "formatted_phone_number", "website", "types", "price_level", "reviews"],
      },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;
        const photos = place.photos?.slice(0, 5).map(p => p.getUrl({ maxWidth: 600 })) || [];
        setSelectedPlace({
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          photos,
          photo: photos[0] || null,
          rating: place.rating,
          ratingCount: place.user_ratings_total,
          phone: place.formatted_phone_number,
          website: place.website,
          hours: place.opening_hours?.weekday_text?.join(" · ") || null,
          isOpen: place.opening_hours?.isOpen?.() ?? null,
          category: place.types?.[0]?.replace(/_/g, " ") || "place",
          reviews: place.reviews?.slice(0, 3) || [],
          price_level: place.price_level,
        });
        setShowPlaceHub(false);
        setSelectedUserPresence(null);
      }
    );
  }

  // Search autocomplete
  const handleSearchInput = (val) => {
    setSearchQuery(val);
    setShowSearch(true);
    clearTimeout(searchDebounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(() => {
      if (!autocompleteServiceRef.current) return;
      setSearchLoading(true);
      autocompleteServiceRef.current.getPlacePredictions(
        { input: val, location: userLoc ? new window.google.maps.LatLng(userLoc.lat, userLoc.lng) : undefined, radius: 50000 },
        (predictions, status) => {
          setSearchLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setSearchResults(predictions || []);
          }
        }
      );
    }, 350);
  };

  const handleSelectResult = (prediction) => {
    setShowSearch(false);
    setSearchQuery(prediction.structured_formatting?.main_text || prediction.description);
    setSearchResults([]);
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name", "formatted_address"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;
        mapInst.current?.panTo(place.geometry.location);
        mapInst.current?.setZoom(16);
        if (searchPinRef.current) { searchPinRef.current.setMap(null); }
        searchPinRef.current = new window.google.maps.Marker({
          position: place.geometry.location,
          map: mapInst.current,
          icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, fillColor: "#4F46E5", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        });
      }
    );
  };

  // Follows
  useEffect(() => {
    if (!currentUser?.email) return;
    base44.entities.Follow.filter({ follower_email: currentUser.email })
      .then(rows => setFollows(rows.map(r => r.following_email)))
      .catch(() => {});
  }, [currentUser?.email]);

  // Creator emails
  useEffect(() => {
    base44.entities.Creator.filter({ approval_status: "approved" })
      .then(rows => setCreatorEmails(new Set(rows.map(r => r.user_email).filter(Boolean))))
      .catch(() => {});
  }, []);

  // Presence subscription
  useEffect(() => {
    const fetch = async () => {
      const all = await base44.entities.LocationPresence.list("-updated_date", 100);
      const now = new Date();
      setNearbyUsers(all.filter(p => p.expires_at && new Date(p.expires_at) > now && p.visibility_mode !== "invisible" && p.is_visible !== false));
    };
    fetch();
    let throttleTimer = null;
    presenceSubRef.current = base44.entities.LocationPresence.subscribe(() => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => { throttleTimer = null; fetch(); }, 5000);
    });
    return () => { if (presenceSubRef.current) presenceSubRef.current(); };
  }, []);

  // GPS watch
  useEffect(() => {
    if (!currentUser || !userLoc || gpsStartedRef.current) return;
    gpsStartedRef.current = true;
    publishLocation(userLoc.lat, userLoc.lng);
    if (!navigator.geolocation) return;
    let lastLat = userLoc.lat, lastLng = userLoc.lng;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { longitude: lng, latitude: lat, accuracy } = pos.coords;
        if (accuracy > 80) return;
        const dLat = (lat - lastLat) * 111320;
        const dLng = (lng - lastLng) * 111320 * Math.cos(lat * Math.PI / 180);
        if (Math.sqrt(dLat ** 2 + dLng ** 2) < 10) return;
        lastLat = lat; lastLng = lng;
        setUserLoc({ lat, lng });
        if (selfMarkerRef.current) selfMarkerRef.current.setPosition({ lat, lng });
        clearTimeout(dbThrottleRef.current);
        dbThrottleRef.current = setTimeout(() => publishLocation(lat, lng), 30000);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => { if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current); };
  }, [!!currentUser, !!userLoc]);

  function publishLocation(lat, lng) {
    const u = currentUser;
    const pres = myPresenceRef.current;
    if (!u) return;
    const data = {
      user_email: u.email, user_name: u.full_name || u.email, avatar_url: u.avatar_url || "",
      location_lat: lat, location_lng: lng,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      is_visible: pres?.visibility_mode !== "invisible",
      visibility_mode: pres?.visibility_mode || "everyone",
      status_message: pres?.status_message || "",
    };
    base44.entities.LocationPresence.filter({ user_email: u.email }).then(existing => {
      if (existing.length > 0) {
        base44.entities.LocationPresence.update(existing[0].id, data)
          .then(() => setMyPresence(prev => ({ ...(prev || {}), ...data, id: existing[0].id })));
      } else {
        base44.entities.LocationPresence.create(data).then(setMyPresence);
      }
    }).catch(() => {});
  }

  // Self dot marker
  useEffect(() => {
    if (!mapReady || !userLoc || !window.google?.maps) return;
    if (currentUser?.email && creatorEmails.has(currentUser.email)) {
      if (selfMarkerRef.current) { selfMarkerRef.current.setMap(null); selfMarkerRef.current = null; }
      return;
    }
    if (selfMarkerRef.current) { selfMarkerRef.current.setPosition(userLoc); return; }
    const svgDot = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="rgba(37,99,235,0.15)"/>
      <circle cx="12" cy="12" r="7" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
      <circle cx="12" cy="12" r="5" fill="#2563EB"/>
    </svg>`;
    selfMarkerRef.current = new window.google.maps.Marker({
      position: userLoc, map: mapInst.current,
      icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgDot)}`, scaledSize: new window.google.maps.Size(24, 24), anchor: new window.google.maps.Point(12, 12) },
      zIndex: 100,
    });
  }, [mapReady, userLoc?.lat, userLoc?.lng, currentUser?.email, creatorEmails]);

  // Friend markers
  const friendSet = new Set(follows);
  const mapPins = useMemo(() => {
    if (!userLoc) return [];
    return nearbyUsers
      .filter(p => p.location_lat && p.location_lng && p.user_email !== currentUser?.email && !creatorEmails.has(p.user_email) && friendSet.has(p.user_email))
      .filter(p => haversineKm(userLoc.lat, userLoc.lng, p.location_lat, p.location_lng) <= radius)
      .map(p => ({ ...p, _dist: haversineKm(userLoc.lat, userLoc.lng, p.location_lat, p.location_lng) }))
      .sort((a, b) => a._dist - b._dist).slice(0, 15);
  }, [nearbyUsers, userLoc, radius, currentUser?.email, follows]);

  const extraNearby = useMemo(() => {
    if (!userLoc) return 0;
    const total = nearbyUsers.filter(p => p.location_lat && p.location_lng && p.user_email !== currentUser?.email && haversineKm(userLoc.lat, userLoc.lng, p.location_lat, p.location_lng) <= radius).length;
    return Math.max(0, total - 15);
  }, [nearbyUsers, userLoc, radius, currentUser?.email]);

  useEffect(() => {
    if (!mapReady || !window.google?.maps) return;
    const activeEmails = new Set();
    mapPins.forEach(p => {
      activeEmails.add(p.user_email);
      if (userMarkersRef.current[p.user_email]) {
        userMarkersRef.current[p.user_email].setPosition({ lat: p.location_lat, lng: p.location_lng });
        return;
      }
      const marker = new window.google.maps.Marker({
        position: { lat: p.location_lat, lng: p.location_lng },
        map: mapInst.current,
        icon: { url: p.avatar_url || `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#7C3AED"/><text x="20" y="26" font-size="14" text-anchor="middle" fill="white" font-weight="bold">${getInitials(p.user_name)}</text></svg>`)}`, scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 20) },
        zIndex: 50,
      });
      marker.addListener("click", () => {
        const proj = mapInst.current.getProjection();
        const bounds = mapRef.current.getBoundingClientRect();
        const pt = proj?.fromLatLngToPoint(new window.google.maps.LatLng(p.location_lat, p.location_lng));
        setPopupCoords({ x: bounds.width / 2, y: bounds.height / 3 });
        setSelectedUserPresence(p);
      });
      userMarkersRef.current[p.user_email] = marker;
    });
    Object.keys(userMarkersRef.current).forEach(email => {
      if (!activeEmails.has(email)) { userMarkersRef.current[email].setMap(null); delete userMarkersRef.current[email]; }
    });
  }, [mapPins, mapReady]);

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <MapPin className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", width: "100%", position: "relative", overflow: "hidden" }}>
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", color: "#0F172A" }}>
          <ArrowLeft className="w-4 h-4" /> Places
        </button>
      )}

      <ProximityNotifier currentUser={currentUser} userLoc={userLoc ? [userLoc.lng, userLoc.lat] : null} followedEmails={follows} />

      {/* Search */}
      {mapReady && (
        <div className="absolute z-20" style={{ top: 16, left: onBack ? 90 : 12, right: 12 }}>
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "#94A3B8" }} />
              <input ref={searchInputRef} value={searchQuery} onChange={e => handleSearchInput(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder="Search places, cafes, parks…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#0F172A", border: "none", minHeight: "unset", boxShadow: "none", fontSize: 14, padding: 0 }} />
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "#94A3B8" }} />}
              {searchQuery && !searchLoading && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); if (searchPinRef.current) { searchPinRef.current.setMap(null); searchPinRef.current = null; } }} style={{ padding: 2 }}>
                  <X className="w-4 h-4" style={{ color: "#94A3B8" }} />
                </button>
              )}
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.99)", backdropFilter: "blur(20px)", boxShadow: "0 12px 40px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.06)", zIndex: 50 }}>
                {searchResults.map((pred, i) => (
                  <button key={pred.place_id || i} onClick={() => handleSelectResult(pred)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ borderBottom: i < searchResults.length - 1 ? "1px solid #F1F5F9" : "none", backgroundColor: "transparent" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <MapPin className="w-4 h-4" style={{ color: "#4F46E5" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{pred.structured_formatting?.main_text || pred.description}</p>
                      <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{pred.structured_formatting?.secondary_text || ""}</p>
                    </div>
                    <Navigation className="w-4 h-4 shrink-0" style={{ color: "#CBD5E1" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category carousel */}
      {mapReady && (
        <div className="absolute z-20" style={{ top: 68, left: 0, right: 0 }}>
          <MapCategoryCarousel active={activeCategories} onChange={setActiveCategories} />
        </div>
      )}

      {/* Nearby + radius row */}
      {mapReady && (
        <div className="absolute z-20 flex items-center justify-between px-3 pointer-events-none" style={{ top: 120, left: 0, right: 0 }}>
          <button onClick={() => setShowNearbyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold pointer-events-auto"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", color: "#0F172A" }}>
            <Users className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
            <span style={{ color: "#16A34A" }}>{mapPins.length > 0 ? `${mapPins.length} nearby${extraNearby > 0 ? ` +${extraNearby} more` : ""}` : "Nearby People"}</span>
          </button>
          <div className="relative pointer-events-auto">
            <button onClick={() => setShowRadiusPanel(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)", color: "#0F172A" }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />{radius}km
            </button>
            {showRadiusPanel && (
              <div className="absolute top-full right-0 mt-1.5 rounded-2xl overflow-hidden py-1"
                style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 100 }}>
                {RADIUS_OPTIONS.map(r => (
                  <button key={r} onClick={() => { setRadius(r); setShowRadiusPanel(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold"
                    style={{ backgroundColor: radius === r ? "#EEF2FF" : "transparent", color: radius === r ? "#4F46E5" : "#0F172A" }}>
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mapReady && currentUser && (
        <LocationPrivacyPanel user={currentUser} presence={myPresence}
          onUpdate={updates => setMyPresence(prev => ({ ...(prev || {}), ...updates }))} />
      )}

      {selectedUserPresence && popupCoords && (
        <div className="absolute z-30" style={{ left: Math.min(Math.max(popupCoords.x - 110, 8), (mapRef.current?.clientWidth || 400) - 228), top: Math.max(popupCoords.y - 200, 70), pointerEvents: "auto" }}>
          <UserPinPopup presence={selectedUserPresence} currentUser={currentUser}
            onClose={() => { setSelectedUserPresence(null); setPopupCoords(null); }} />
        </div>
      )}

      {/* Place quick detail card */}
      {selectedPlace && !showPlaceHub && (
        <PlaceQuickCard place={selectedPlace} onClose={() => setSelectedPlace(null)} onExpand={() => setShowPlaceHub(true)} />
      )}

      {/* Map canvas — position absolute so it never causes layout reflows that blink */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* Loading */}
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20" style={{ backgroundColor: "var(--bg-app)" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-hint)" }}>Loading map…</p>
        </div>
      )}

      {showNearbyModal && (
        <NearbyPeopleModal
          allUsers={nearbyUsers}
          userLoc={userLoc ? [userLoc.lng, userLoc.lat] : null}
          currentUser={currentUser}
          followedEmails={follows}
          onClose={() => setShowNearbyModal(false)}
          onHighlight={presence => {
            setShowNearbyModal(false);
            if (mapInst.current && presence.location_lat && presence.location_lng) {
              mapInst.current.panTo({ lat: presence.location_lat, lng: presence.location_lng });
              mapInst.current.setZoom(16);
            }
          }}
        />
      )}

      {showPlaceHub && selectedPlace && (
        <PlaceHub
          locationName={selectedPlace.name}
          locationData={selectedPlace}
          user={currentUser}
          onClose={() => { setShowPlaceHub(false); setSelectedPlace(null); }}
          onUpvote={() => {}}
        />
      )}
    </div>
  );
}

// ── Rich Place Quick Card (Google Places data) ────────────────────────────
function PlaceQuickCard({ place, onClose, onExpand }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) setPhotoIdx(i => Math.min(i + 1, (place.photos?.length || 1) - 1));
      else setPhotoIdx(i => Math.max(i - 1, 0));
    }
  };

  const priceSymbol = place.price_level ? "$".repeat(place.price_level) : null;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-30 rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.99)", backdropFilter: "blur(20px)", boxShadow: "0 16px 48px rgba(0,0,0,0.22)", border: "1px solid rgba(0,0,0,0.07)", maxHeight: "70vh" }}>

      {/* Photo strip with swipe */}
      {place.photos?.length > 0 && (
        <div className="relative" style={{ height: 160 }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <motion.img
            key={photoIdx}
            src={place.photos[photoIdx]}
            alt={place.name}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover" />
          {place.photos.length > 1 && (
            <>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {place.photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === photoIdx ? 16 : 6, height: 6, backgroundColor: i === photoIdx ? "#fff" : "rgba(255,255,255,0.5)" }} />
                ))}
              </div>
              <div className="absolute top-2 right-10 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
                {photoIdx + 1} / {place.photos.length}
              </div>
            </>
          )}
          <button onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", minWidth: 32, minHeight: 32 }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Name + category row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>{place.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>{place.category}</span>
              {priceSymbol && <span className="text-[11px] font-bold text-green-600">{priceSymbol}</span>}
              {place.isOpen !== null && (
                <span className="text-[11px] font-bold" style={{ color: place.isOpen ? "#16A34A" : "#DC2626" }}>
                  {place.isOpen ? "Open now" : "Closed"}
                </span>
              )}
            </div>
          </div>
          {!place.photos?.length && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
              style={{ backgroundColor: "#F1F5F9", minWidth: 32, minHeight: 32 }}>
              <X className="w-4 h-4" style={{ color: "#64748B" }} />
            </button>
          )}
        </div>

        {/* Rating */}
        {place.rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className="w-3.5 h-3.5" style={{ fill: s <= Math.round(place.rating) ? "#F59E0B" : "none", color: "#F59E0B" }} />
              ))}
            </div>
            <span className="text-sm font-bold" style={{ color: "#0F172A" }}>{place.rating.toFixed(1)}</span>
            {place.ratingCount && <span className="text-xs" style={{ color: "#94A3B8" }}>({place.ratingCount.toLocaleString()})</span>}
          </div>
        )}

        {/* Address */}
        {place.address && (
          <p className="text-xs mb-3 truncate" style={{ color: "#64748B" }}>📍 {place.address}</p>
        )}

        {/* Quick chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
              style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <Phone className="w-3.5 h-3.5" /> {place.phone}
            </a>
          )}
          {place.website && (
            <a href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
              style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          {place.hours && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
              style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <Clock className="w-3.5 h-3.5" /> Hours
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={() => { if (place.lat && place.lng) window.open(`https://www.google.com/maps?q=${place.lat},${place.lng}`, "_blank"); }}
            className="flex-1 py-3 rounded-2xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
            🧭 Directions
          </button>
          <button onClick={onExpand}
            className="flex-1 py-3 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: "#F1F5F9", color: "#0F172A", border: "1px solid #E2E8F0" }}>
            📋 Posts & Photos
          </button>
        </div>
      </div>
    </div>
  );
}