import React from "react";
import { MapPin, Link2, Calendar, GraduationCap, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfileView({ user }) {
  const getInitials = () => {
    const name = user?.full_name || user?.username || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Banner & Avatar */}
      <div>
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "140px", backgroundColor: "var(--bg-subtle)" }}>
          {user?.banner_url ? (
            <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #2E6B4F, #D98B62)" }} />
          )}
        </div>

        <div className="flex items-end gap-4 -mt-16 px-4">
          <div className="w-24 h-24 rounded-full border-4 overflow-hidden"
            style={{ borderColor: "var(--bg-card)", backgroundColor: "var(--bg-subtle)" }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                {getInitials()}
              </div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
              {user?.full_name || user?.username || "Anonymous"}
              {user?.is_verified && (
                <span className="text-sm">✓</span>
              )}
            </h1>
            {user?.headline && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{user.headline}</p>
            )}
          </div>
        </div>
      </div>

      {/* About Me */}
      {user?.about_me && (
        <div className="px-4">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            About Me
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {user.about_me}
          </p>
        </div>
      )}

      {/* Personal Info */}
      {(user?.show_age !== false && user?.age) || 
       (user?.show_major !== false && user?.major) || 
       (user?.show_grad_year !== false && user?.graduation_year) ||
       user?.city ||
       user?.hobbies ? (
        <div className="px-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Personal Info</h3>
          <div className="space-y-2">
            {user?.show_age !== false && user?.age && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{user.age} years old</span>
              </div>
            )}
            {user?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{user.city}</span>
              </div>
            )}
            {user?.show_major !== false && user?.major && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {user.major}
                  {user?.show_grad_year !== false && user?.graduation_year && ` • Class of ${user.graduation_year}`}
                </span>
              </div>
            )}
            {user?.hobbies && (
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="w-4 h-4 mt-0.5" style={{ color: "var(--text-hint)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{user.hobbies}</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Looking For */}
      {user?.looking_for && user.looking_for.length > 0 && (
        <div className="px-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            Looking For
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.looking_for.map(item => (
              <Badge key={item} variant="secondary" style={{ 
                backgroundColor: "var(--accent-primary-light)", 
                color: "var(--accent-primary)" 
              }}>
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {user?.interests && user.interests.length > 0 && (
        <div className="px-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Interests</h3>
          <div className="flex flex-wrap gap-2">
            {user.interests.map(interest => (
              <Badge key={interest} variant="outline" style={{
                borderColor: "var(--accent-secondary)",
                color: "var(--accent-secondary)"
              }}>
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {(user?.website_url || user?.portfolio_url) && (
        <div className="px-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Link2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            Links
          </h3>
          <div className="space-y-2">
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: "var(--accent-primary)" }}>
                <Link2 className="w-3.5 h-3.5" />
                Website
              </a>
            )}
            {user.portfolio_url && (
              <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: "var(--accent-primary)" }}>
                <Link2 className="w-3.5 h-3.5" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}