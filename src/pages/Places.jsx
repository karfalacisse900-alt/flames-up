import React, { useState } from "react";
import { MapPin } from "lucide-react";

export default function PlacesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="sticky top-0 z-20" style={{ 
        backgroundColor: "var(--bg-nav)", 
        backdropFilter: "blur(20px)", 
        borderBottom: "1px solid var(--border-subtle)",
        padding: "1rem"
      }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Places</h1>
        </div>
      </div>
      
      <div className="p-4 text-center py-16">
        <p style={{ color: "var(--text-hint)" }}>Places feature coming soon...</p>
      </div>
    </div>
  );
}