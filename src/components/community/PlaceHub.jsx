import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, MapPin, Bookmark, BookmarkCheck, Image, Video, MessageSquare,
  Calendar, Lightbulb, Users, BellPlus, BellOff, Navigation
} from "lucide-react";
import CommunityPostCard from "./CommunityPostCard";
import PeopleHereNow from "@/components/places/PeopleHereNow";
import LocationTipsTab from "@/components/places/LocationTipsTab";
import LocationEventsTab from "@/components/places/LocationEventsTab";
import LocationGroupsTab from "@/components/places/LocationGroupsTab";
import SpontaneousMeetupModal from "@/components/places/SpontaneousMeetupModal";

const TABS = [
  { key: "posts",   label: "Posts",   icon: MessageSquare },
  { key: "photos",  label: "Photos",  icon: Image },
  { key: "videos",  label: "Videos",  icon: Video },
  { key: "events",  label: "Events",  icon: Calendar },
  { key: "groups",  label: "Groups",  icon: Users },
  { key: "tips",    label: "Tips",    icon: Lightbulb },
];

export default function PlaceHub({ locationName, locationData = {}, user, onClose, onUpvote }) {
  const [activeTab, setActiveTab] = useState("posts");
  const [savedLoading, setSavedLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMeetup, setShowMeetup] = useState(false);
  const qc = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ["placePosts", locationName],
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 200);
      return all.filter(p =>
        (p.location_name && p.location_name.toLowerCase() === locationName.toLowerCase()) ||
        (p.location_city && p.location_city.toLowerCase() === locationName.toLowerCase())
      );
    },
    enabled: !!locationName,
  });

  const { data: savedRecord } = useQuery({
    queryKey: ["savedPlace", user?.email, locationName],
    queryFn: () => base44.entities.SavedPlace.filter({ user_email: user.email, location_name: locationName }),
    select: d => d[0] || null,
    enabled: !!user?.email && !!locationName,
  });

  const { data: followRecord } = useQuery({
    queryKey: ["locationFollow", user?.email, locationName],
    queryFn: () => base44.entities.LocationFollow.filter({ user_email: user.email, location_name: locationName }),
    select: d => d[0] || null,
    enabled: !!user?.email && !!locationName,
  });

  const isSaved = !!savedRecord;
  const isFollowing = !!followRecord;

  const toggleSave = async () => {
    if (!user || savedLoading) return;
    setSavedLoading(true);
    if (isSaved && savedRecord) {
      await base44.entities.SavedPlace.delete(savedRecord.id);
    } else {
      await base44.entities.SavedPlace.create({
        user_email: user.email,
        location_name: locationName,
        location_city: locationData.city || "",
        location_region: locationData.region || "",
        location_country: locationData.country || "",
        location_lat: locationData.lat,
        location_lng: locationData.lng,
        save_type: "want_to_go",
      });
    }
    qc.invalidateQueries({ queryKey: ["savedPlace", user?.email, locationName] });
    qc.invalidateQueries({ queryKey: ["savedPlaces", user?.email] });
    setSavedLoading(false);
  };

  const toggleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    if (isFollowing && followRecord) {
      await base44.entities.LocationFollow.delete(followRecord.id);
    } else {
      await base44.entities.LocationFollow.create({
        user_email: user.email,
        location_name: locationName,
        location_city: locationData.city || "",
        location_country: locationData.country || "",
        location_lat: locationData.lat,
        location_lng: locationData.lng,
      });
    }
    qc.invalidateQueries({ queryKey: ["locationFollow", user?.email, locationName] });
    setFollowLoading(false);
  };

  const photoPosts = posts.filter(p => p.image_url || p.image_urls?.length > 0);
  const videoPosts = posts.filter(p => p.video_url?.trim());

  const lat = locationData.lat || posts.find(p => p.location_lat)?.location_lat;
  const lng = locationData.lng || posts.find(p => p.location_lng)?.location_lng;
  const hasCoords = lat && lng;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="shrink-0" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <button onClick={onClose} className="p-2 rounded-full mt-0.5" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <h2 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {locationName}
              </h2>
            </div>
            {(locationData.city || locationData.country) && (
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
                {[locationData.city, locationData.region, locationData.country].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {user && (
                <>
                  <button onClick={toggleFollow} disabled={followLoading}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                    style={{
                      backgroundColor: isFollowing ? "var(--accent-primary)" : "transparent",
                      borderColor: isFollowing ? "var(--accent-primary)" : "var(--border-medium)",
                      color: isFollowing ? "#fff" : "var(--text-secondary)",
                    }}>
                    {isFollowing ? <BellOff className="w-3 h-3" /> : <BellPlus className="w-3 h-3" />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button onClick={toggleSave} disabled={savedLoading}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                    style={{
                      backgroundColor: isSaved ? "#1D4ED8" : "transparent",
                      borderColor: isSaved ? "#1D4ED8" : "var(--border-medium)",
                      color: isSaved ? "#fff" : "var(--text-secondary)",
                    }}>
                    {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mini map */}
        {hasCoords && (
          <div className="h-28 mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false} zoomControl={false} dragging={false} doubleClickZoom={false} attributionControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[lat, lng]}>
                <Popup>{locationName}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 px-5 pb-2 text-xs" style={{ color: "var(--text-hint)" }}>
          <span><strong style={{ color: "var(--text-primary)" }}>{posts.length}</strong> posts</span>
          <span><strong style={{ color: "var(--text-primary)" }}>{photoPosts.length}</strong> photos</span>
          <span><strong style={{ color: "var(--text-primary)" }}>{videoPosts.length}</strong> videos</span>
        </div>

        {/* Tabs – horizontal scroll */}
        <div className="flex gap-0 px-4 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0"
              style={{
                borderColor: activeTab === tab.key ? "var(--accent-primary)" : "transparent",
                color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-hint)",
                backgroundColor: "transparent",
              }}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* People Here Now — shown on Posts tab */}
        {activeTab === "posts" && (
          <div className="pt-3">
            <PeopleHereNow locationName={locationName} locationData={locationData} user={user} />
            <div className="mx-4 mb-2" style={{ height: 1, backgroundColor: "var(--border-subtle)" }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>

            {/* POSTS */}
            {activeTab === "posts" && (
              posts.length === 0 ? (
                <div className="py-16 text-center px-8">
                  <div className="text-4xl mb-3">📍</div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    No posts at {locationName} yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to share something here!</p>
                </div>
              ) : (
                <div className="pb-28">
                  {posts.map(p => (
                    <CommunityPostCard key={p.id} post={p} user={user}
                      onUpvote={() => onUpvote?.(p)} onLocationClick={null} />
                  ))}
                </div>
              )
            )}

            {/* PHOTOS */}
            {activeTab === "photos" && (
              photoPosts.length === 0 ? (
                <div className="py-16 text-center px-8">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No photos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5 p-0.5 pb-28">
                  {photoPosts.flatMap(p => {
                    const imgs = p.image_urls?.length > 0 ? p.image_urls : p.image_url ? [p.image_url] : [];
                    return imgs.map((img, i) => (
                      <div key={`${p.id}-${i}`} style={{ aspectRatio: "1" }} className="overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ));
                  })}
                </div>
              )
            )}

            {/* VIDEOS */}
            {activeTab === "videos" && (
              videoPosts.length === 0 ? (
                <div className="py-16 text-center px-8">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No videos yet</p>
                </div>
              ) : (
                <div className="pb-28">
                  {videoPosts.map(p => (
                    <CommunityPostCard key={p.id} post={p} user={user}
                      onUpvote={() => onUpvote?.(p)} onLocationClick={null} />
                  ))}
                </div>
              )
            )}

            {/* EVENTS */}
            {activeTab === "events" && (
              <LocationEventsTab
                locationName={locationName}
                locationData={locationData}
                user={user}
                onCreateMeetup={() => setShowMeetup(true)}
              />
            )}

            {/* GROUPS */}
            {activeTab === "groups" && (
              <LocationGroupsTab locationName={locationName} locationData={locationData} />
            )}

            {/* TIPS */}
            {activeTab === "tips" && (
              <LocationTipsTab locationName={locationName} locationData={locationData} user={user} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Spontaneous Meetup Modal */}
      <AnimatePresence>
        {showMeetup && user && (
          <SpontaneousMeetupModal
            locationName={locationName}
            locationData={locationData}
            user={user}
            onClose={() => setShowMeetup(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ["placePosts", locationName] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}