import React, { useRef } from "react";
import { Bell, Search, Flame, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function downloadLogo() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 400, 400);
  grad.addColorStop(0, "#E05C2A");
  grad.addColorStop(1, "#F97316");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, 400, 400, 80);
  ctx.fill();

  // Flame shape
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(200, 80);
  ctx.bezierCurveTo(260, 140, 300, 180, 290, 240);
  ctx.bezierCurveTo(280, 300, 240, 330, 200, 340);
  ctx.bezierCurveTo(160, 330, 120, 300, 110, 240);
  ctx.bezierCurveTo(100, 180, 140, 140, 200, 80);
  ctx.fill();

  // Inner flame
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.moveTo(200, 160);
  ctx.bezierCurveTo(225, 195, 240, 220, 232, 255);
  ctx.bezierCurveTo(224, 285, 210, 300, 200, 305);
  ctx.bezierCurveTo(190, 300, 176, 285, 168, 255);
  ctx.bezierCurveTo(160, 220, 175, 195, 200, 160);
  ctx.fill();

  const link = document.createElement("a");
  link.download = "flames-up-logo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function HomeHeader({ user }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.full_name?.split(" ")[0] || null;

  return (
    <div
      className="px-4 pt-4 pb-3"
      style={{
        background: "linear-gradient(135deg, #2E6B4F0D 0%, #F973160A 100%)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo + greeting */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}
          >
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                flames-up
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "linear-gradient(135deg,#E05C2A20,#F9731620)", color: "#E05C2A", border: "1px solid #E05C2A30" }}>
                BETA
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text-hint)", lineHeight: 1 }}>
              {greeting()}{firstName ? `, ${firstName} 👋` : ""}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadLogo}
            title="Download Logo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-hint)" }}
          >
            <Download className="w-4 h-4" />
          </button>
          <Link
            to={createPageUrl("Discover")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--accent-primary)" }}
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            to={createPageUrl("Notifications")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
          >
            <Bell className="w-4 h-4" />
          </Link>
          {user && (
            <Link to={createPageUrl("Profile")}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
              >
                {user.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}