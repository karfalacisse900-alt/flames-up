import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Plus, MapPin, Users, DollarSign, Star, ChevronRight, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupCard from "@/components/groups/GroupCard";

const CATEGORIES = [
  { id: "all", label: "All Groups" },
  { id: "yoga", label: "Yoga" },
  { id: "running", label: "Running" },
  { id: "dance", label: "Street Dance" },
  { id: "fitness", label: "Fitness" },
  { id: "sports", label: "Sports" },
  { id: "outdoor", label: "Outdoor" },
  { id: "learning", label: "Learning" },
  { id: "gaming", label: "Gaming" },
  { id: "social", label: "Social" },
];

export default function Groups() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list("-created_date", 100),
  });

  const { data: userGroups = [] } = useQuery({
    queryKey: ["userGroups", user?.email],
    queryFn: () =>
      user?.email
        ? base44.entities.Group.filter({ members: user.email }, "-updated_date", 50)
        : Promise.resolve([]),
    enabled: !!user?.email,
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const group = await base44.entities.Group.get(groupId);
      const updatedMembers = [...(group.members || []), user.email];
      await base44.entities.Group.update(groupId, {
        members: updatedMembers,
        member_count: updatedMembers.length,
      });
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
    },
  });

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || group.category === selectedCategory;
    const matchesType = selectedType === "all" || group.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const isMember = (groupId) => userGroups.some((g) => g.id === groupId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", paddingBottom: 100 }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <Filter className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2.5 rounded-full"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Filter pills */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3">
                <div className="flex gap-2 flex-wrap">
                  {["all", "free", "paid"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: selectedType === type ? "var(--accent-primary)" : "var(--bg-subtle)",
                        color: selectedType === type ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${selectedType === type ? "var(--accent-primary)" : "var(--border-light)"}`,
                      }}>
                      {type === "all" ? "All Types" : type === "free" ? "Free" : "Paid"}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories carousel */}
      <div className="px-4 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-min max-w-lg mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                backgroundColor: selectedCategory === cat.id ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: selectedCategory === cat.id ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${selectedCategory === cat.id ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Groups Section */}
      {userGroups.length > 0 && (
        <div className="px-4 py-6 max-w-lg mx-auto">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            YOUR GROUPS
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {userGroups.slice(0, 4).map((group) => (
              <Link
                key={group.id}
                to={`/GroupHub?id=${group.id}`}
                className="group relative overflow-hidden rounded-lg aspect-square"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {group.cover_image_url && (
                  <img
                    src={group.cover_image_url}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-bold truncate">{group.name}</p>
                  <p className="text-white/60 text-[10px]">{group.member_count} members</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Groups */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          DISCOVER GROUPS
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-secondary)" }} className="text-sm">
              No groups found. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <GroupCard
                  group={group}
                  isMember={isMember(group.id)}
                  onJoin={() => joinGroupMutation.mutate(group.id)}
                  isJoining={joinGroupMutation.isPending}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}