import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Heart,
  Clock,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Archive,
  ArrowLeft,
  Globe,
  BookOpen,
  Sparkles,
  ImageIcon,
  Tag,
  Loader2,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/editor/RichTextEditor";
import "@/components/editor/editor.css";
import {
  patientResourcesApi,
  type PatientResource,
  type PatientResourcePayload,
  type ResourceCategory,
} from "@/api/patientResources";

const CATEGORIES = [
  "General",
  "Cardiology",
  "Preventive Care",
  "Mental Health",
  "Nutrition",
  "Physical Therapy",
  "Sleep Medicine",
  "Dermatology",
  "Endocrinology",
  "Women's Health",
  "Men's Health",
  "Pediatrics",
  "Wellness Tips",
];

type EditorMode = "list" | "create" | "edit";

export default function PatientResources() {
  // ── State ──
  const [resources, setResources] = useState<PatientResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<EditorMode>("list");
  const [editingResource, setEditingResource] =
    useState<PatientResource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [customCategories, setCustomCategories] = useState<ResourceCategory[]>(
    []
  );
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null
  );

  // Form state
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState("General");
  const [postStatus, setPostStatus] = useState<
    "draft" | "published" | "archived"
  >("draft");

  // ── Fetch resources ──
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await patientResourcesApi.getAll(params);
      setResources(data);
    } catch {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── Fetch categories ──
  const fetchCategories = useCallback(async () => {
    try {
      const data = await patientResourcesApi.getCategories();
      setCustomCategories(data);
    } catch {
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Reset form ──
  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setAuthorName("");
    setCategory("General");
    setPostStatus("draft");
    setEditingResource(null);
  };

  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];
    CATEGORIES.forEach((c) => {
      if (!seen.has(c)) {
        seen.add(c);
        merged.push(c);
      }
    });

    const customSorted = [...customCategories]
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
    customSorted.forEach((c) => {
      if (!seen.has(c)) {
        seen.add(c);
        merged.push(c);
      }
    });

    if (category && !seen.has(category)) {
      merged.unshift(category);
    }
    return merged;
  }, [customCategories, category]);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    const normalized = name.toLowerCase();
    const existsLocally = allCategories.some(
      (c) => c.toLowerCase() === normalized
    );
    if (existsLocally) {
      toast.error("Category already exists");
      return;
    }
    setSavingCategory(true);
    try {
      const created = await patientResourcesApi.createCategory(name);
      setCustomCategories((prev) => {
        const exists = prev.some(
          (item) => item.name.toLowerCase() === created.name.toLowerCase()
        );
        return exists ? prev : [...prev, created];
      });
      setCategory(created.name);
      setNewCategoryName("");
      setAddCategoryOpen(false);
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id);
    try {
      await patientResourcesApi.deleteCategory(id);
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // ── Open create mode ──
  const handleNewPost = () => {
    resetForm();
    setMode("create");
  };

  // ── Open edit mode ──
  const handleEdit = async (resource: PatientResource) => {
    try {
      const full = await patientResourcesApi.getById(resource.id);
      setEditingResource(full);
      setTitle(full.title);
      setExcerpt(full.excerpt || "");
      setContent(full.content || "");
      setCoverImage(full.cover_image || "");
      setAuthorName(full.author_name || "");
      setCategory(full.category || "General");
      setPostStatus(full.status);
      setMode("edit");
    } catch {
      toast.error("Failed to load resource details");
    }
  };

  // ── Save (create or update) ──
  const handleSave = async (overrideStatus?: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error("Content is required");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Author name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: PatientResourcePayload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        cover_image: coverImage.trim(),
        author_name: authorName.trim(),
        category,
        status: overrideStatus || postStatus,
      };

      if (mode === "edit" && editingResource) {
        await patientResourcesApi.update(editingResource.id, payload);
        toast.success(
          overrideStatus === "published"
            ? "Post published successfully!"
            : "Post updated successfully!"
        );
      } else {
        await patientResourcesApi.create(payload);
        toast.success(
          overrideStatus === "published"
            ? "Post published successfully!"
            : "Post saved as draft!"
        );
      }

      resetForm();
      setMode("list");
      fetchResources();
    } catch {
      toast.error("Failed to save the post");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await patientResourcesApi.delete(deletingId);
      toast.success("Post deleted");
      fetchResources();
    } catch {
      toast.error("Failed to delete the post");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
    }
  };

  // ── Quick actions ──
  const handlePublish = async (id: string) => {
    try {
      await patientResourcesApi.publish(id);
      toast.success("Post published!");
      fetchResources();
    } catch {
      toast.error("Failed to publish");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await patientResourcesApi.archive(id);
      toast.success("Post archived");
      fetchResources();
    } catch {
      toast.error("Failed to archive");
    }
  };

  // ── Image upload handler ──
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await patientResourcesApi.uploadImage(file);
      return result.url;
    } catch {
      throw new Error("Image upload failed");
    }
  };

  // ── Status badge color ──
  const statusColor = (s: string) => {
    switch (s) {
      case "published":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "draft":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "archived":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ── Filtered resources ──
  const filtered = resources.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !(r.excerpt || "").toLowerCase().includes(q) &&
        !(r.category || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // ──────────────────────────────────────────────
  // EDITOR VIEW (Create / Edit)
  // ──────────────────────────────────────────────
  if (mode === "create" || mode === "edit") {
    return (
      <div className="max-w-[1400px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              resetForm();
              setMode("list");
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all posts
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* ── Main editor column ── */}
          <div className="space-y-5">
            {/* Title input */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title..."
                className="text-2xl font-bold border-0 border-b border-slate-200 rounded-none px-0 py-3 
                  focus-visible:ring-0 focus-visible:border-blue-500 placeholder:text-slate-300
                  transition-colors bg-transparent h-auto"
              />
            </div>

            {/* Excerpt */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-400 mb-1.5 block">
                Excerpt / Summary
              </Label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a short summary that appears in the listing cards..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Rich editor */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-400 mb-1.5 block">
                Content
              </Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
                placeholder="Start writing your blog post... Use the toolbar above for formatting, images, videos, and more."
              />
            </div>
          </div>

          {/* ── Sidebar settings ── */}
          <div className="space-y-5">
            {/* Status card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Post Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-500">Author Name</Label>
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Enter author name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>

            {/* Cover image card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-500" />
                  Cover Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!coverImage && (
                  <>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="cover-image-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await handleImageUpload(file);
                          setCoverImage(url);
                        } catch (err) {
                          toast.error("Image upload failed");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("cover-image-upload")?.click()}
                    >
                      Browse
                    </Button>
                    <p className="text-xs text-slate-500">
                      Recommended size: 1200×630 px
                    </p>
                  </>
                )}
                {coverImage && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick tips */}
            <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Writing Tips
                    </p>
                    <ul className="text-xs text-blue-700 mt-1.5 space-y-1">
                      <li>• Keep paragraphs short for readability</li>
                      <li>• Use headings to structure your content</li>
                      <li>• Add images to make posts engaging</li>
                      <li>• Include actionable takeaways</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Patient Resources
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">
            Create and manage blog posts visible to your patients
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleNewPost}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Resource
          </Button>
          <Button
            className="gap-2"
            onClick={() => setAddCategoryOpen(true)}
          >
            <Tag className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Add new categories for patient resources or remove ones you no longer need.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-400 mb-1.5 block">
                New Category
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={savingCategory}
                  className="gap-2"
                >
                  {savingCategory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-400 mb-2 block">
                Existing Categories
              </Label>
              {customCategories.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No custom categories added yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {customCategories
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">
                          {cat.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCategoryId === cat.id}
                          className="text-slate-500 hover:text-red-600"
                          aria-label={`Delete ${cat.name}`}
                        >
                          {deletingCategoryId === cat.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 w-full">
        {/* Category Filter Pills (Simulating the active categories state space) */}
        <div className="flex-1 w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 rounded-full shadow-sm font-medium focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow md:flex-grow-0 md:w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 shrink-0">
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-slate-100 rounded-2xl mb-4">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              No posts yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
              Start creating blog posts that will be visible to all your
              patients on their portal.
            </p>
            <Button onClick={handleNewPost} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((resource) => (
            <Card
              key={resource.id}
              className="group overflow-hidden border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer"
              onClick={() => handleEdit(resource)}
            >
              {resource.cover_image && (
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={resource.cover_image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge
                    className={cn(
                      "absolute top-3 left-3 border text-xs",
                      statusColor(resource.status)
                    )}
                  >
                    {resource.status}
                  </Badge>
                </div>
              )}
              <CardContent
                className={cn("p-5", !resource.cover_image && "pt-5")}
              >
                {!resource.cover_image && (
                  <Badge
                    className={cn(
                      "border text-xs mb-3",
                      statusColor(resource.status)
                    )}
                  >
                    {resource.status}
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  {resource.category && (
                    <>
                      <Tag className="h-3 w-3" />
                      <span>{resource.category}</span>
                      <span>·</span>
                    </>
                  )}
                  <Clock className="h-3 w-3" />
                  <span>{resource.read_time_minutes} min read</span>
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">
                  {resource.title}
                </h3>
                {resource.excerpt && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {resource.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                      <Heart className="h-4 w-4 fill-red-50 text-red-500" />
                      {resource.likes_count}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                      <Eye className="h-4 w-4 text-blue-500" />
                      {resource.views_count}
                    </div>
                    <span className="flex items-center gap-1.5 text-gray-500 text-xs ml-2 border-l border-gray-200 pl-4">
                      <Calendar className="h-3 w-3" />
                      {new Date(
                        resource.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="p-1 rounded hover:bg-slate-100">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(resource);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {resource.status !== "published" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(resource.id);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {resource.status !== "archived" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(resource.id);
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(resource.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {filtered.map((resource) => (
            <Card
              key={resource.id}
              className="group border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => handleEdit(resource)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {resource.cover_image && (
                  <img
                    src={resource.cover_image}
                    alt=""
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        "text-[10px] border",
                        statusColor(resource.status)
                      )}
                    >
                      {resource.status}
                    </Badge>
                    {resource.category && (
                      <span className="text-xs text-slate-400">
                        {resource.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                    {resource.title}
                  </h3>
                  {resource.excerpt && (
                    <p className="text-sm text-slate-500 truncate">
                      {resource.excerpt}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 border-l border-gray-100 pl-6 ml-4">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium whitespace-nowrap">
                    <Heart className="h-4 w-4 fill-red-50 text-red-500" />
                    {resource.likes_count} likes
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium whitespace-nowrap">
                    <Eye className="h-4 w-4 text-blue-500" />
                    {resource.views_count} views
                  </div>
                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="p-1 rounded hover:bg-slate-100">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(resource);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    {resource.status !== "published" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(resource.id);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" /> Publish
                      </DropdownMenuItem>
                    )}
                    {resource.status !== "archived" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(resource.id);
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(resource.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
