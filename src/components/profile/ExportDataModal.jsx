import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, FileText, FileSpreadsheet, File, Mail, CheckCircle2 } from "lucide-react";

const DATA_TYPES = [
  { key: "posts", label: "My Posts", emoji: "✍️" },
  { key: "art", label: "My Art", emoji: "🎨" },
  { key: "reviews", label: "My Reviews", emoji: "⭐" },
  { key: "saved", label: "Saved Items", emoji: "🔖" },
  { key: "following", label: "Following", emoji: "👥" },
  { key: "transactions", label: "Coin Transactions", emoji: "🪙" },
];

const FORMATS = [
  { key: "csv", label: "CSV", icon: FileSpreadsheet },
  { key: "json", label: "JSON", icon: FileText },
  { key: "pdf", label: "PDF", icon: File },
];

function toCSV(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

function toPDF(title, rows) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const colW = Math.floor(180 / keys.length);
  let y = 30;

  // Build a simple SVG-based text blob as a printable HTML page
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:sans-serif;padding:24px;color:#1E1C19}h2{margin-bottom:16px}
  table{border-collapse:collapse;width:100%}th{background:#2D5A45;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
  td{padding:7px 10px;font-size:11px;border-bottom:1px solid #e0d8cc}tr:nth-child(even){background:#F5F1EA}</style>
  </head><body><h2>${title}</h2><p style="color:#6E645B;font-size:12px">Exported ${new Date().toLocaleString()}</p>
  <table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></body></html>`;

  return html;
}

async function fetchData(type, userEmail) {
  switch (type) {
    case "posts":
      return (await base44.entities.Post.filter({ author_email: userEmail }, "-created_date", 200))
        .map(({ id, type, text, like_count, reply_count, is_anonymous, created_date }) => ({ id, type, text, like_count, reply_count, is_anonymous, created_date }));
    case "art":
      return (await base44.entities.ArtPiece.filter({ creator_email: userEmail }, "-created_date", 200))
        .map(({ id, title, description, price, is_for_sale, like_count, created_date }) => ({ id, title, description, price, is_for_sale, like_count, created_date }));
    case "reviews":
      return (await base44.entities.DiscoverReview.filter({ user_email: userEmail }, "-created_date", 200))
        .map(({ id, item_id, rating, review_text, helpful_count, created_date }) => ({ id, item_id, rating, review_text, helpful_count, created_date }));
    case "saved":
      return (await base44.entities.SavedItem.filter({ user_email: userEmail }, "-created_date", 200))
        .map(({ id, item_title, item_category, item_description, created_date }) => ({ id, item_title, item_category, item_description, created_date }));
    case "following":
      return (await base44.entities.Follow.filter({ follower_email: userEmail }, "-created_date", 200))
        .map(({ id, following_name, following_email, created_date }) => ({ id, following_name, following_email, created_date }));
    case "transactions":
      return (await base44.entities.CoinTransaction.filter({ user_email: userEmail }, "-created_date", 200))
        .map(({ id, amount, type, description, created_date }) => ({ id, amount, type, description, created_date }));
    default:
      return [];
  }
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportDataModal({ open, onClose, user }) {
  const [selectedTypes, setSelectedTypes] = useState(["posts"]);
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("download"); // "download" | "email"

  const toggleType = (key) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    if (!selectedTypes.length || !user?.email) return;
    setLoading(true);
    try {
      const allData = {};
      for (const type of selectedTypes) {
        allData[type] = await fetchData(type, user.email);
      }

      if (deliveryMode === "email") {
        // Build email body with the data
        let emailBody = `Hi ${user.full_name || "there"},\n\nHere is your exported account data from flames-up:\n\n`;
        for (const [type, rows] of Object.entries(allData)) {
          const label = DATA_TYPES.find(d => d.key === type)?.label || type;
          emailBody += `--- ${label} (${rows.length} records) ---\n`;
          if (format === "json") {
            emailBody += JSON.stringify(rows, null, 2);
          } else {
            emailBody += toCSV(rows);
          }
          emailBody += "\n\n";
        }
        emailBody += `\nExported on ${new Date().toLocaleString()}\n`;
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: "Your Account Data Export - flames-up",
          body: emailBody,
        });
        setEmailSent(true);
        setTimeout(() => { setEmailSent(false); onClose(); }, 3000);
        return;
      }

      // Direct download
      if (format === "json") {
        const content = JSON.stringify(allData, null, 2);
        downloadBlob(content, `my-data-${Date.now()}.json`, "application/json");
      } else if (format === "csv") {
        for (const [type, rows] of Object.entries(allData)) {
          const csv = toCSV(rows);
          downloadBlob(csv, `${type}-${Date.now()}.csv`, "text/csv");
        }
      } else if (format === "pdf") {
        for (const [type, rows] of Object.entries(allData)) {
          const label = DATA_TYPES.find((d) => d.key === type)?.label || type;
          const html = toPDF(label, rows);
          if (!html) continue;
          const win = window.open("", "_blank");
          if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Export My Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email sent confirmation */}
          {emailSent && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#16A34A" }} />
              <p className="text-sm font-semibold" style={{ color: "#15803D" }}>
                Export sent to {user?.email}
              </p>
            </div>
          )}

          {/* Delivery mode */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Delivery method</p>
            <div className="flex gap-2">
              {[
                { key: "download", label: "Download", icon: Download },
                { key: "email", label: "Email me", icon: Mail },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setDeliveryMode(key)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold"
                  style={{
                    backgroundColor: deliveryMode === key ? "var(--accent-primary)" : "var(--bg-subtle)",
                    borderColor: deliveryMode === key ? "var(--accent-primary)" : "var(--border-light)",
                    color: deliveryMode === key ? "#fff" : "var(--text-secondary)",
                  }}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            {deliveryMode === "email" && (
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-hint)" }}>
                Will be sent to: <strong>{user?.email}</strong>
              </p>
            )}
          </div>

          {/* Data type selection */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Select data to export</p>
            <div className="grid grid-cols-2 gap-2">
              {DATA_TYPES.map((dt) => {
                const selected = selectedTypes.includes(dt.key);
                return (
                  <button
                    key={dt.key}
                    onClick={() => toggleType(dt.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all"
                    style={{
                      backgroundColor: selected ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                      borderColor: selected ? "var(--accent-primary)" : "var(--border-light)",
                      color: selected ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <span>{dt.emoji}</span>
                    <span className="text-xs">{dt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format selection */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Export format</p>
            <div className="flex gap-2">
              {FORMATS.map(({ key, label, icon: Icon }) => {
                const active = format === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: active ? "var(--accent-primary)" : "var(--bg-subtle)",
                      borderColor: active ? "var(--accent-primary)" : "var(--border-light)",
                      color: active ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || !selectedTypes.length}
            className="w-full rounded-xl gap-2"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : deliveryMode === "email" ? <Mail className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {loading ? (deliveryMode === "email" ? "Sending…" : "Exporting…") : deliveryMode === "email" ? "Send to Email" : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}