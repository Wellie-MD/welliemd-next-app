import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Grid3X3, List, Clock, Calendar, User, ArrowRight, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resourcesApi, type BlogResource } from "@/features/resources/api";
import "../styles/blog.css";

export default function Blog() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [blogPosts, setBlogPosts] = useState<BlogResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const formatAuthorName = (name: string) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((part) =>
        part ? part.charAt(0).toUpperCase() + part.slice(1) : part
      )
      .join(" ");

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; category?: string; is_bookmarked?: boolean } = {};

      if (searchQuery.trim()) params.search = searchQuery.trim();

      if (activeCategory === "saved") {
        params.is_bookmarked = true;
      } else if (activeCategory) {
        params.category = activeCategory;
      }

      const data = await resourcesApi.getAll(params);

      if (activeCategory === "saved") {
        setBlogPosts(data.filter(post => post.is_bookmarked));
      } else {
        setBlogPosts(data);
      }
    } catch {
      setError("Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    const debounce = setTimeout(fetchResources, 300);
    return () => clearTimeout(debounce);
  }, [fetchResources]);

  // Derive unique categories from results
  const categories = Array.from(new Set(blogPosts.map((p) => p.category).filter(Boolean)));

  const handleReadMore = (postId: string) => {
    navigate(`/dashboard/blog/${postId}`);
  };

  const formatViews = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);

  return (
    <div className="min-h-screen bg-background">
      <div className="blog-container py-8">

        {/* Header Section */}
        <div className="text-center mb-10 pt-4">
          <h1 className="text-center tracking-tight text-4xl font-extrabold text-foreground mb-4">
            All Resources
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-10">
            Want more inspiration? Browse our <span className="font-bold text-foreground">search results</span>
          </p>

          <div className="flex flex-col gap-8">
            {/* Search Bar */}
            <div className="search-bar-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search for articles, tips, wellness advice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!activeCategory
                  ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory("saved")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === "saved"
                  ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
              >
                Saved
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat
                    ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ height: "32px", width: "100%" }}></div>

            {/* View Toggle - Only show if we have posts */}
            {!loading && !error && blogPosts.length > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center bg-gray-50/80 p-1.5 rounded-full shadow-sm shrink-0 gap-2 border border-gray-100">
                  <button
                    className={`flex items-center justify-center p-2 rounded-full transition-all duration-200 w-10 h-10 ${viewMode === 'grid'
                      ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-900/5'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    className={`flex items-center justify-center p-2 rounded-full transition-all duration-200 w-10 h-10 ${viewMode === 'list'
                      ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-900/5'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading resources…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-700 font-medium mb-2">{error}</p>
            <button
              onClick={fetchResources}
              className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && blogPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 min-h-[40vh] text-center mt-4">
            <div className="bg-white p-6 rounded-full shadow-sm border border-gray-100 mb-6">
              <BookOpen className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No resources found</h3>
            <p className="text-gray-500 text-lg">We couldn't find any articles matching your criteria.</p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && blogPosts.length > 0 && (
          <div className={viewMode === 'grid' ? 'blog-grid' : 'flex flex-col gap-6 mt-8'}>
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="blog-card group"
                onClick={() => handleReadMore(post.id)}
              >
                {/* Image Section */}
                <div className="relative overflow-hidden">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="blog-card-image"
                    />
                  ) : (
                    <div className="blog-card-image bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-blue-400" />
                    </div>
                  )}
                  <div className="category-badge">
                    {post.category}
                  </div>
                </div>

                {/* Content Section */}
                <div className="blog-card-content">
                  {/* Meta Information */}
                  <div className="blog-card-meta">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="blog-card-title">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="blog-card-excerpt">
                    {post.excerpt}
                  </p>

                  {/* Author Section */}
                  <div className="blog-card-author">
                    <div className="author-info">
                      <div className="author-avatar">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="author-name">
                          {formatAuthorName(post.author_name)}
                        </div>
                        <div className="author-role">Healthcare Professional</div>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
