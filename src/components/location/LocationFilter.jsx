import React, { useState, useEffect } from "react";
import { MapPin, Globe, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  "USA",
  "UK",
  "Canada",
  "Japan",
  "France",
  "Germany",
  "Australia",
  "Brazil",
  "China",
  "India",
  "Mexico",
  "Spain",
  "Italy",
  "South Korea",
];

const MAJOR_CITIES = [
  "New York",
  "Tokyo",
  "London",
  "Paris",
  "Dubai",
  "Los Angeles",
  "Singapore",
  "Hong Kong",
  "Sydney",
  "Barcelona",
  "Bangkok",
  "Amsterdam",
];

const RADIUS_OPTIONS = [
  { value: 5, label: "Within 5 km" },
  { value: 20, label: "Within 20 km" },
  { value: 50, label: "Within 50 km" },
];

export default function LocationFilter({ onFilterChange, userCity, userCountry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState("global"); // global, nearby, country, city, search
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState(5);

  const handleFilterChange = () => {
    const filterData = {
      type: filterType,
      country: selectedCountry,
      city: selectedCity,
      search: searchLocation,
      radius: nearbyRadius,
    };
    onFilterChange(filterData);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    switch (filterType) {
      case "global":
        return "🌍 Global";
      case "nearby":
        return `📍 Nearby (${nearbyRadius}km)`;
      case "country":
        return `🗺️ ${selectedCountry || "Select Country"}`;
      case "city":
        return `🏙️ ${selectedCity || "Select City"}`;
      case "search":
        return `🔍 ${searchLocation || "Search"}`;
      default:
        return "📍 Location";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          backgroundColor: isOpen ? "var(--accent-primary)" : "var(--bg-card)",
          color: isOpen ? "#fff" : "var(--text-primary)",
          border: "1px solid var(--border-light)",
        }}>
        <MapPin className="w-4 h-4" />
        {getDisplayText()}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full mt-2 right-0 w-80 rounded-2xl z-50 p-4 shadow-xl border"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-light)",
            }}>
            <div className="space-y-4">
              {/* Filter Type Selector */}
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Filter Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "global", label: "🌍 Global" },
                    { type: "nearby", label: "📍 Nearby" },
                    { type: "country", label: "🗺️ Country" },
                    { type: "city", label: "🏙️ City" },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setFilterType(opt.type)}
                      className="px-2 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor:
                          filterType === opt.type
                            ? "var(--accent-primary)"
                            : "var(--bg-subtle)",
                        color:
                          filterType === opt.type
                            ? "#fff"
                            : "var(--text-primary)",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nearby Radius */}
              {filterType === "nearby" && (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Search Radius
                  </label>
                  <Select value={nearbyRadius.toString()} onValueChange={(v) => setNearbyRadius(parseInt(v))}>
                    <SelectTrigger className="rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userCity && (
                    <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                      📍 Your location: {userCity}
                    </p>
                  )}
                </div>
              )}

              {/* Country Selection */}
              {filterType === "country" && (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Select Country
                  </label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <SelectValue placeholder="Choose a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* City Selection */}
              {filterType === "city" && (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Select City
                  </label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <SelectValue placeholder="Choose a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJOR_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search Location */}
              {filterType === "search" && (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Search Location
                  </label>
                  <Input
                    placeholder="e.g., Central Park, Brooklyn..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="rounded-lg"
                    style={{ backgroundColor: "var(--bg-subtle)" }}
                  />
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleFilterChange}
                className="w-full py-2 rounded-lg text-sm font-bold text-white transition-all"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Apply Filter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}