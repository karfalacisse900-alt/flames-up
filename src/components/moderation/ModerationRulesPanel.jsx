import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ToggleLeft, ToggleRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RULE_TYPES = [
  { key: "keyword",      label: "Keyword Block",   desc: "Auto-flag posts containing specific words" },
  { key: "user_reports", label: "Report Threshold", desc: "Auto-flag content that gets too many user reports" },
  { key: "sentiment",    label: "Sentiment (AI)",   desc: "Use AI to detect tone violations" },
];

const ACTION_COLORS = {
  flag:        { bg: "#FEF9C3", text: "#92400E", label: "Flag for Review" },
  auto_remove: { bg: "#FEE2E2", text: "#991B1B", label: "Auto Remove" },
  warn:        { bg: "#DBEAFE", text: "#1E40AF",  label: "Warn User" },
};

const SEVERITY_COLORS = {
  low:    { bg: "#D1FAE5", text: "#065F46" },
  medium: { bg: "#FEF9C3", text: "#92400E" },
  high:   { bg: "#FEE2E2", text: "#991B1B" },
};

const DEFAULT_RULE = {
  name: "",
  rule_type: "keyword",
  keywords: [],
  action: "flag",
  severity: "medium",
  is_active: true,
  applies_to: ["post", "comment"],
  report_threshold: 3,
};

export default function ModerationRulesPanel() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_RULE);
  const [keywordInput, setKeywordInput] = useState("");

  const { data: rules = [] } = useQuery({
    queryKey: ["moderationRules"],
    queryFn: () => base44.entities.ModerationRule.list("-created_date", 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.ModerationRule.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["moderationRules"] }); setShowCreate(false); setForm(DEFAULT_RULE); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ModerationRule.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moderationRules"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ModerationRule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moderationRules"] }),
  });

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !form.keywords.includes(kw)) {
      setForm(f => ({ ...f, keywords: [...f.keywords, kw] }));
      setKeywordInput("");
    }
  };

  return (
    <div className="space-y-3 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Custom Rules</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Define auto-moderation behavior</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5 rounded-xl text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </Button>
      </div>

      {rules.length === 0 && (
        <div className="py-10 text-center rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No rules yet. Create your first rule.</p>
        </div>
      )}

      {rules.map(rule => {
        const ac = ACTION_COLORS[rule.action] || ACTION_COLORS.flag;
        const sc = SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.medium;
        return (
          <div key={rule.id} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", opacity: rule.is_active ? 1 : 0.5 }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{rule.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>{rule.severity}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ac.bg, color: ac.text }}>{ac.label}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                  {RULE_TYPES.find(r => r.key === rule.rule_type)?.label}
                  {rule.rule_type === "user_reports" && ` · Threshold: ${rule.report_threshold} reports`}
                </p>
                {rule.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rule.keywords.map(kw => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleMut.mutate({ id: rule.id, is_active: !rule.is_active })}>
                  {rule.is_active
                    ? <ToggleRight className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
                    : <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-hint)" }} />}
                </button>
                <button onClick={() => deleteMut.mutate(rule.id)}>
                  <Trash2 className="w-4 h-4" style={{ color: "#C86B6B" }} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setForm(DEFAULT_RULE); }}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle className="text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Create Moderation Rule
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Rule Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Block slurs, Spam threshold..."
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>

            {/* Rule type */}
            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Rule Type</label>
              <div className="grid grid-cols-1 gap-1.5 mt-1">
                {RULE_TYPES.map(rt => (
                  <button key={rt.key} onClick={() => setForm(f => ({ ...f, rule_type: rt.key }))}
                    className="text-left px-3 py-2 rounded-xl text-xs transition-all"
                    style={{
                      backgroundColor: form.rule_type === rt.key ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                      border: `1px solid ${form.rule_type === rt.key ? "var(--accent-primary)" : "var(--border-light)"}`,
                      color: form.rule_type === rt.key ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}>
                    <span className="font-semibold">{rt.label}</span>
                    <span className="block text-[10px] opacity-70 mt-0.5">{rt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords (only for keyword type) */}
            {form.rule_type === "keyword" && (
              <div>
                <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Keywords to Block</label>
                <div className="flex gap-2 mt-1">
                  <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addKeyword()}
                    placeholder="Type a word and press Enter"
                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  <button onClick={addKeyword} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.keywords.map(kw => (
                    <span key={kw} className="text-xs px-2 py-1 rounded-full flex items-center gap-1 font-mono"
                      style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                      {kw}
                      <button onClick={() => setForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))} className="text-xs font-bold" style={{ color: "#C86B6B" }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Report threshold */}
            {form.rule_type === "user_reports" && (
              <div>
                <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Auto-flag After # Reports</label>
                <input type="number" min={1} max={20} value={form.report_threshold}
                  onChange={e => setForm(f => ({ ...f, report_threshold: parseInt(e.target.value) || 3 }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
            )}

            {/* Action */}
            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Action</label>
              <div className="flex gap-2 mt-1">
                {Object.entries(ACTION_COLORS).map(([key, ac]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, action: key }))}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    style={{
                      backgroundColor: form.action === key ? ac.bg : "var(--bg-subtle)",
                      color: form.action === key ? ac.text : "var(--text-hint)",
                      border: `1px solid ${form.action === key ? ac.text + "40" : "var(--border-light)"}`,
                    }}>
                    {ac.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>Severity</label>
              <div className="flex gap-2 mt-1">
                {Object.entries(SEVERITY_COLORS).map(([key, sc]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, severity: key }))}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all"
                    style={{
                      backgroundColor: form.severity === key ? sc.bg : "var(--bg-subtle)",
                      color: form.severity === key ? sc.text : "var(--text-hint)",
                      border: `1px solid ${form.severity === key ? sc.text + "40" : "var(--border-light)"}`,
                    }}>
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={() => createMut.mutate(form)} disabled={!form.name || createMut.isPending} className="w-full rounded-xl">
              {createMut.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}