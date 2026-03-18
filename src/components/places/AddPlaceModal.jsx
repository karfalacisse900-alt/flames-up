import React, { useState } from "react";
import { X, MapPin, Upload, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddPlaceModal({ user, onClose, onSuccess }) {
  // Hide bottom nav while modal is open
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("swipemode", { detail: { active: true } }));
    return () => window.dispatchEvent(new CustomEvent("swipemode", { detail: { active: false } }));
  }, []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverImageUrl(file_url);
      setCoverImage(file);
    } catch (err) {
      alert("Failed to upload image");
      console.error(err);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !country.trim()) {
      alert("Please fill in place name, city, and country");
      return;
    }

    setSubmitting(true);
    try {
      // Geocode address to get lat/lng
      let lat = null;
      let lng = null;
      
      if (address.trim()) {
        const geocodeQuery = encodeURIComponent(`${address}, ${city}, ${region}, ${country}`);
        const mapboxToken = "pk.eyJ1IjoiYmFzZTQ0IiwiYSI6ImNtNWd1NjI1eDBtb2cybHNlbmlyNHJmM3oifQ.kTLxfIWn-_DjGQJ-Fpp8Ug";
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${geocodeQuery}.json?access_token=${mapboxToken}`
        );
        const geoData = await geoRes.json();
        if (geoData.features?.[0]?.center) {
          [lng, lat] = geoData.features[0].center;
        }
      }

      await base44.entities.Place.create({
        name: name.trim(),
        description: description.trim(),
        category,
        address: address.trim(),
        city: city.trim(),
        region: region.trim(),
        country: country.trim(),
        lat,
        lng,
        cover_image_url: coverImageUrl,
        is_verified: false,
        post_count: 0,
        follower_count: 0,
      });

      alert("✅ Place submitted! It will appear once verified.");
      onSuccess?.();
      onClose();
    } catch (err) {
      alert("Failed to submit place. Please try again.");
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Add a Place
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Cover Photo */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Cover Photo (optional)
            </label>
            {coverImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setCoverImageUrl(""); setCoverImage(null); }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all active:scale-95"
                style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                {uploading ? (
                  <div className="text-sm" style={{ color: "var(--text-hint)" }}>Uploading...</div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>Tap to upload photo</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Place Name */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Place Name *
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Brooklyn Bridge, Local Coffee Shop"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              required />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Category
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
              <option value="park">🌳 Park</option>
              <option value="cafe">☕ Cafe</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="library">📚 Library</option>
              <option value="museum">🎨 Museum</option>
              <option value="landmark">🗽 Landmark</option>
              <option value="gym">💪 Gym</option>
              <option value="mall">🛍️ Mall</option>
              <option value="other">📍 Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Description
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What makes this place special? Share hidden gems, tips, or why you love it..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Street Address (optional)
            </label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              City *
            </label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="New York"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              required />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              State/Region
            </label>
            <input type="text" value={region} onChange={e => setRegion(e.target.value)}
              placeholder="NY"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Country *
            </label>
            <input type="text" value={country} onChange={e => setCountry(e.target.value)}
              placeholder="United States"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              required />
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting..." : "✨ Submit Place"}
          </button>

          <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
            Places are reviewed before appearing publicly
          </p>
        </form>
      </div>
    </div>
  );
}