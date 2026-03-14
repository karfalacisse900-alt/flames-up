import React, { useState, useRef } from "react";
import { X, Plus, MapPin, ShoppingBag, Coffee, Book, Smartphone, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TAG_CATEGORIES = [
  { value: "product", label: "Product", icon: ShoppingBag, color: "#4F46E5" },
  { value: "place", label: "Place", icon: MapPin, color: "#2E6B4F" },
  { value: "food", label: "Food & Drink", icon: Coffee, color: "#F97316" },
  { value: "book", label: "Book", icon: Book, color: "#7C69C4" },
  { value: "gadget", label: "Tech & Gadget", icon: Smartphone, color: "#2563EB" },
  { value: "brand", label: "Brand", icon: TagIcon, color: "#DC2626" },
  { value: "other", label: "Other", icon: TagIcon, color: "#64748B" },
];

export default function TagEditor({ imageUrl, existingTags = [], onSave, onClose }) {
  const [tags, setTags] = useState(existingTags);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagPosition, setNewTagPosition] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const imageRef = useRef(null);

  const [tagForm, setTagForm] = useState({
    name: "",
    category: "product",
    description: "",
    link: "",
  });

  const handleImageClick = (e) => {
    if (!isAddingTag) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewTagPosition({ x, y });
  };

  const handleSaveTag = () => {
    if (!tagForm.name.trim() || !newTagPosition) return;

    const newTag = {
      id: Date.now().toString(),
      ...tagForm,
      position: newTagPosition,
    };

    setTags([...tags, newTag]);
    setTagForm({ name: "", category: "product", description: "", link: "" });
    setNewTagPosition(null);
    setIsAddingTag(false);
  };

  const handleDeleteTag = (tagId) => {
    setTags(tags.filter(t => t.id !== tagId));
    setSelectedTag(null);
  };

  const getCategoryColor = (category) => {
    return TAG_CATEGORIES.find(c => c.value === category)?.color || "#64748B";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
      <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 safe-top" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
          <h3 className="text-lg font-bold" style={{ color: "white" }}>Tag Items in Photo</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddingTag(!isAddingTag)}
              size="sm"
              className="rounded-full"
              style={{
                backgroundColor: isAddingTag ? "#2E6B4F" : "white",
                color: isAddingTag ? "white" : "#1E1E1E",
              }}>
              <Plus className="w-4 h-4 mr-1" />
              {isAddingTag ? "Tap Photo" : "Add Tag"}
            </Button>
            <button onClick={() => onSave(tags)} className="p-2 text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image with tags */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="relative inline-block max-w-full max-h-full">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Tag editor"
              onClick={handleImageClick}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ cursor: isAddingTag ? "crosshair" : "default" }}
            />

            {/* Existing tags */}
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag?.id === tag.id ? null : tag)}
                className="absolute w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  left: `${tag.position.x}%`,
                  top: `${tag.position.y}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: getCategoryColor(tag.category),
                  border: "2px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                <TagIcon className="w-4 h-4" style={{ color: "white" }} />
              </button>
            ))}

            {/* New tag position marker */}
            {newTagPosition && (
              <div
                className="absolute w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
                style={{
                  left: `${newTagPosition.x}%`,
                  top: `${newTagPosition.y}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "#4F46E5",
                  border: "2px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                <Plus className="w-4 h-4" style={{ color: "white" }} />
              </div>
            )}
          </div>
        </div>

        {/* Tag form */}
        {newTagPosition && (
          <div className="p-4 safe-bottom" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
            <div className="max-w-md mx-auto space-y-3">
              <Input
                placeholder="Tag name (e.g. Café Latte, iPhone 15)"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
              <Select value={tagForm.category} onValueChange={(val) => setTagForm({ ...tagForm, category: val })}>
                <SelectTrigger className="bg-white/10 text-white border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Description (optional)"
                value={tagForm.description}
                onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
              <Input
                placeholder="Link or search term (optional)"
                value={tagForm.link}
                onChange={(e) => setTagForm({ ...tagForm, link: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveTag} className="flex-1" style={{ backgroundColor: "#2E6B4F" }}>
                  Save Tag
                </Button>
                <Button onClick={() => { setNewTagPosition(null); setIsAddingTag(false); }} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tag info card */}
        {selectedTag && !newTagPosition && (
          <div className="p-4 safe-bottom" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
            <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {React.createElement(TAG_CATEGORIES.find(c => c.value === selectedTag.category)?.icon || TagIcon, {
                    className: "w-5 h-5",
                    style: { color: getCategoryColor(selectedTag.category) }
                  })}
                  <div>
                    <h4 className="font-bold text-white">{selectedTag.name}</h4>
                    <p className="text-xs text-white/60">{TAG_CATEGORIES.find(c => c.value === selectedTag.category)?.label}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteTag(selectedTag.id)} className="text-red-400 hover:text-red-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedTag.description && (
                <p className="text-sm text-white/80 mb-2">{selectedTag.description}</p>
              )}
              {selectedTag.link && (
                <a
                  href={selectedTag.link.startsWith("http") ? selectedTag.link : `https://www.google.com/search?q=${encodeURIComponent(selectedTag.link)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:underline">
                  Learn more →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {isAddingTag && !newTagPosition && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: "rgba(79,70,229,0.9)", color: "white" }}>
            Tap on the photo where the item appears
          </div>
        )}
      </div>
    </div>
  );
}