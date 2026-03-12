import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, MessageSquare, Package2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MyLibrary() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const { data: savedPosts = [] } = useQuery({
    queryKey: ["savedPosts", user?.email],
    queryFn: () => base44.entities.SavedPost.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: savedItems = [] } = useQuery({
    queryKey: ["savedItems", user?.email],
    queryFn: () => base44.entities.SavedItem.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: postDetails = [] } = useQuery({
    queryKey: ["postDetails", savedPosts.map(sp => sp.post_id).join(",")],
    queryFn: async () => {
      if (!savedPosts.length) return [];
      const posts = await Promise.all(
        savedPosts.map(sp => base44.entities.Post.list().then(all => all.find(p => p.id === sp.post_id)))
      );
      return posts.filter(Boolean);
    },
    enabled: savedPosts.length > 0,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Group saved items by type
  const groupedByFolder = savedPosts.reduce((acc, sp) => {
    const folder = sp.folder || "Saved";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(sp);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <Bookmark className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>My Library</h2>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl w-full flex-wrap h-auto gap-1 p-1" style={{ backgroundColor: "var(--bg-card)" }}>
            <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Posts
            </TabsTrigger>
            <TabsTrigger value="apps" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
              <Package2 className="w-3.5 h-3.5" /> Apps & Tools
            </TabsTrigger>
          </TabsList>

          {/* Saved Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {Object.keys(groupedByFolder).length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No saved posts yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Save posts to view them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByFolder).map(([folder, items]) => (
                  <div key={folder}>
                    <h3 className="text-sm font-bold mb-2 px-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <span className="text-lg">📁</span> {folder}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                        {items.length}
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <Link
                          key={item.id}
                          to={createPageUrl(`PostDetail?id=${item.post_id}`)}
                          className="block rounded-2xl p-4 transition-all hover:elevation-2"
                          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">
                              {item.post_type === "question" && "❓"}
                              {item.post_type === "quote" && "💬"}
                              {item.post_type === "concern" && "⚠️"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--text-primary)" }}>
                                {item.post_preview || "Untitled"}
                              </p>
                              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                                {new Date(item.created_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Apps & Tools Tab */}
          <TabsContent value="apps" className="mt-4">
            {savedItems.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Package2 className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No saved apps yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Save apps and tools to view them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedItems.map(item => (
                  <a
                    key={item.id}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // Open discover item modal
                    }}
                    className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    {item.item_logo_url ? (
                      <img
                        src={item.item_logo_url}
                        alt={item.item_title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                        📦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {item.item_title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>
                        {item.item_category}
                      </p>
                    </div>
                    <Star className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}