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

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; category?: string } = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory) params.category = activeCategory;
      const data = await resourcesApi.getAll(params);
      setBlogPosts(data);
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
    <div className="min-h-screen bg-gray-50">
      <div className="blog-container py-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All Resources
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Want more inspiration? Browse our <span className="font-semibold text-gray-900">search results</span>
          </p>
          
          {/* Search Bar */}
          <div className="search-bar-container">
            <Search className="search-icon w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  !activeCategory
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-14 h-14 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">No resources yet</h3>
            <p className="text-gray-500">Check back soon for new articles.</p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && blogPosts.length > 0 && (
          <div className={viewMode === 'grid' ? 'blog-grid' : 'flex flex-col gap-6'}>
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
                        <div className="author-name">{post.author_name}</div>
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