import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, X, Users, Bike, Car, PersonStanding, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const PACE_CENTER = { lng: -74.0059, lat: 40.7114 };

const CAMPUS_LOCATIONS = [
  { id: "1", name: "Pace Library", description: "Main academic library", lng: -74.0061, lat: 40.7116, category: "library", emoji: "📚" },
  { id: "2", name: "Student Center", description: "Hub for student activities", lng: -74.0055, lat: 40.7112, category: "center", emoji: "🏢" },
  { id: "3", name: "Pace Gym", description: "Fitness and recreation center", lng: -74.0063, lat: 40.7110, category: "gym", emoji: "💪" },
  { id: "4", name: "Cafeteria", description: "Main dining hall", lng: -74.0057, lat: 40.7115, category: "food", emoji: "🍽️" },
  { id: "5", name: "One Pace Plaza", description: "Main academic building", lng: -74.0059, lat: 40.7114, category: "building", emoji: "🏛️" },
  { id: "6", name: "Study Lounge", description: "Quiet study area", lng: -74.0060, lat: 40.7113, category: "study", emoji: "📖" },
];

export default function CampusMap() {
  const [user, setUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directionsMode, setDirectionsMode] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState("walking");
  const [showActivities, setShowActivities] = useState(true);
  const [showCampusLocations, setShowCampusLocations] = useState(true);
  const [autoCentering, setAutoCentering] = useState(false);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: livePosts = [] } = useQuery({
    queryKey: ["livePostsMap"],
    queryFn: async () => {
      const posts = await base44.entities.LivePost.list("-created_date", 100);
      const now = new Date();
      return posts.filter(p => new Date(p.expires_at) > now && p.location_lat && p.location_lng);
    },
    refetchInterval: 30000,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ["communityPostsMap"],
    queryFn: async () => {
      const posts = await base44.entities.CommunityPost.list("-created_date", 200);
      return posts.filter(p => p.location_lat && p.location_lng);
    },
    refetchInterval: 60000,
  });

  // Live GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setUserLocation(newPos);
        
        if (autoCentering && map.current) {
          map.current.flyTo({ center: [newPos.lng, newPos.lat], zoom: 17 });
        }
      },
      (error) => {
        console.log("Location access denied, using campus center");
      }
    );

    // Watch position for live tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setUserLocation(newPos);

        // Update user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([newPos.lng, newPos.lat]);
        }

        // Auto-center if enabled
        if (autoCentering && map.current) {
          map.current.easeTo({ center: [newPos.lng, newPos.lat], duration: 1000 });
        }
      },
      (error) => console.log("GPS tracking error:", error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoCentering]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    const mapboxToken = "pk.eyJ1IjoiYmFzZTQ0IiwiYSI6ImNtNHF3dW83ZzBkdjAyanNjNDFqa29wYzUifQ.s7dGPG0wSzUIqN_bXe7i6w";
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: userLocation || PACE_CENTER,
      zoom: 16,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add user location marker if available
    if (userLocation) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="background: #2E6B4F; border: 3px solid white; border-radius: 50%; width: 18px; height: 18px; box-shadow: 0 0 0 4px rgba(46,107,79,0.3), 0 2px 8px rgba(0,0,0,0.3);"></div>`;
      
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (map.current) map.current.remove();
    };
  }, [userLocation]);

  // Add campus location markers
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (showCampusLocations) {
      CAMPUS_LOCATIONS.forEach(loc => {
        const el = document.createElement("div");
        el.className = "campus-marker";
        el.innerHTML = `<div style="background: white; border: 2px solid #2E6B4F; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${loc.emoji}</div>`;
        el.addEventListener("click", () => setSelectedLocation(loc));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map.current);

        markersRef.current.push(marker);
      });
    }
  }, [showCampusLocations]);

  // Add activity markers
  useEffect(() => {
    if (!map.current || !showActivities) return;

    const activityMarkers = [];

    livePosts.forEach(post => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="background: linear-gradient(135deg, #E05C2A, #F97316); border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; box-shadow: 0 2px 8px rgba(224,92,42,0.4);">⚡</div>`;
      el.addEventListener("click", () => setSelectedPost(post));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([post.location_lng, post.location_lat])
        .addTo(map.current);

      activityMarkers.push(marker);
      markersRef.current.push(marker);
    });

    communityPosts.slice(0, 50).forEach(post => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="background: #D98B62; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; box-shadow: 0 2px 6px rgba(217,139,98,0.3);">📍</div>`;
      el.addEventListener("click", () => setSelectedPost(post));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([post.location_lng, post.location_lat])
        .addTo(map.current);

      activityMarkers.push(marker);
      markersRef.current.push(marker);
    });

    return () => {
      activityMarkers.forEach(m => m.remove());
    };
  }, [livePosts, communityPosts, showActivities]);

  const getDirections = async (destination, mode = "walking") => {
    if (!userLocation) {
      alert("Location access required for directions");
      return;
    }

    setDirectionsMode(destination);
    setTravelMode(mode);

    const mapboxToken = "pk.eyJ1IjoiYmFzZTQ0IiwiYSI6ImNtNHF3dW83ZzBkdjAyanNjNDFqa29wYzUifQ.s7dGPG0wSzUIqN_bXe7i6w";
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${mapboxToken}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const route = data.routes[0];

      setRouteInfo({
        distance: (route.distance / 1000).toFixed(2),
        duration: Math.ceil(route.duration / 60),
      });

      if (map.current && map.current.getSource && map.current.getSource("route")) {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      }

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2E6B4F",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });

      const bounds = new mapboxgl.LngLatBounds();
      route.geometry.coordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 60 });
    } catch (err) {
      console.error("Directions error:", err);
      alert("Failed to get directions");
    }
  };

  const clearDirections = () => {
    setDirectionsMode(null);
    setRouteInfo(null);
    if (map.current && map.current.getSource && map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 flex gap-2 z-10 flex-wrap">
        <Button
          onClick={() => setShowActivities(v => !v)}
          variant={showActivities ? "default" : "outline"}
          size="sm"
          style={{ backgroundColor: showActivities ? "var(--accent-primary)" : "white" }}>
          {showActivities ? "🔥 Activities" : "Activities"}
        </Button>
        <Button
          onClick={() => setShowCampusLocations(v => !v)}
          variant={showCampusLocations ? "default" : "outline"}
          size="sm"
          style={{ backgroundColor: showCampusLocations ? "var(--accent-primary)" : "white" }}>
          {showCampusLocations ? "📍 Campus" : "Campus"}
        </Button>
        <Button
          onClick={() => setAutoCentering(v => !v)}
          variant={autoCentering ? "default" : "outline"}
          size="sm"
          style={{ backgroundColor: autoCentering ? "var(--accent-primary)" : "white" }}>
          <Crosshair className="w-4 h-4 mr-1" />
          {autoCentering ? "Auto" : "Manual"}
        </Button>
      </div>

      {/* Location card */}
      {selectedLocation && (
        <div className="absolute bottom-24 left-4 right-4 z-20 rounded-2xl p-4"
          style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{selectedLocation.emoji}</div>
              <div>
                <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                  {selectedLocation.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {selectedLocation.description}
                </p>
              </div>
            </div>
            <button onClick={() => { setSelectedLocation(null); clearDirections(); }}>
              <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>

          {directionsMode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                <Navigation className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                    {routeInfo?.duration} min • {routeInfo?.distance} km
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {travelMode === "walking" ? "Walking" : travelMode === "cycling" ? "Biking" : "Driving"}
                  </p>
                </div>
              </div>
              <Button onClick={clearDirections} variant="outline" className="w-full">
                Clear Directions
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => getDirections(selectedLocation, "walking")} size="sm" variant="outline">
                  <PersonStanding className="w-4 h-4 mr-1" />
                  Walk
                </Button>
                <Button onClick={() => getDirections(selectedLocation, "cycling")} size="sm" variant="outline">
                  <Bike className="w-4 h-4 mr-1" />
                  Bike
                </Button>
                <Button onClick={() => getDirections(selectedLocation, "driving")} size="sm" variant="outline">
                  <Car className="w-4 h-4 mr-1" />
                  Drive
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post card */}
      {selectedPost && (
        <div className="absolute bottom-24 left-4 right-4 z-20 rounded-2xl p-4"
          style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                {selectedPost.title || selectedPost.body?.slice(0, 60)}
              </h3>
              {selectedPost.location_name && (
                <p className="text-xs flex items-center gap-1 mb-2" style={{ color: "var(--text-secondary)" }}>
                  <MapPin className="w-3 h-3" />
                  {selectedPost.location_name}
                </p>
              )}
              {selectedPost.participants && (
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                  <Users className="w-3 h-3" />
                  {selectedPost.participants.length} joined
                </p>
              )}
            </div>
            <button onClick={() => setSelectedPost(null)}>
              <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>
          <Button
            onClick={() => {
              if (selectedPost.title) {
                window.location.href = `/Live`;
              } else {
                window.location.href = `/Home`;
              }
            }}
            className="w-full mt-2"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            View Post
          </Button>
        </div>
      )}
    </div>
  );
}