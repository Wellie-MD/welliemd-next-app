import { useState, useEffect, useCallback } from "react";
import { Search, Grid3X3, List, Clock, Calendar, User, ArrowRight, Loader2, AlertCircle, BookOpen } from "lucide-react";
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
    (name || "").trim().split(/\s+/).map((p) => p ? p.charAt(0).toUpperCase() + p.slice(1) : p).join(" ");

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
      setBlogPosts(activeCategory === "saved" ? data.filter(post => post.is_bookmarked) : data);
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

  const categories = Array.from(new Set(blogPosts.map((p) => p.category).filter(Boolean)));

  /* ────── Pill button style helper ────── */
  const pillStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    borderColor: isActive ? "var(--km-ac)" : "var(--km-b)",
    background: isActive ? "var(--km-acp)" : "var(--km-s2)",
    color: isActive ? "var(--km-ac)" : "var(--km-tm)",
    transition: "all 0.18s",
    fontFamily: "'Outfit', sans-serif",
    whiteSpace: "nowrap" as const,
  });

  /* ────── Toggle button style helper ────── */
  const toggleStyle = (isActive: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "1px solid",
    borderColor: isActive ? "var(--km-ac)" : "var(--km-b)",
    background: isActive ? "var(--km-acp)" : "var(--km-s2)",
    color: isActive ? "var(--km-ac)" : "var(--km-tm)",
    transition: "all 0.18s",
  });

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 18 }}>
        <div
          className="km-page-title"
          style={{ marginBottom: 3 }}
        >
          Resources
        </div>
        <div style={{ fontSize: 13, color: "var(--km-tm)" }}>
          Browse articles, tips, and wellness advice
        </div>
      </div>

      {/* Search */}
      <div className="search-bar-container" style={{ maxWidth: "100%", margin: "0 0 14px" }}>
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search articles…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Category pills */}
        <button style={pillStyle(!activeCategory)} onClick={() => setActiveCategory(null)}>All</button>
        <button style={pillStyle(activeCategory === "saved")} onClick={() => setActiveCategory("saved")}>Saved</button>
        {categories.map((cat) => (
          <button key={cat} style={pillStyle(activeCategory === cat)} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}>
            {cat}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        {!loading && !error && blogPosts.length > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            <button style={toggleStyle(viewMode === "grid")} onClick={() => setViewMode("grid")} aria-label="Grid view">
              <Grid3X3 size={14} />
            </button>
            <button style={toggleStyle(viewMode === "list")} onClick={() => setViewMode("list")} aria-label="List view">
              <List size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="km-empty" style={{ padding: "48px 18px" }}>
          <Loader2 size={28} style={{ color: "var(--km-ac)", animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: "var(--km-tm)" }}>Loading resources…</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="km-empty" style={{ padding: "48px 18px" }}>
          <AlertCircle size={32} style={{ color: "var(--km-re)", marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)", marginBottom: 4 }}>{error}</div>
          <button
            onClick={fetchResources}
            className="km-btn km-btn-primary"
            style={{ marginTop: 8 }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && blogPosts.length === 0 && (
        <div className="km-empty" style={{ padding: "48px 18px" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "var(--km-s2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 11,
              color: "var(--km-td)",
            }}
          >
            <BookOpen size={20} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)", marginBottom: 4 }}>No resources found</div>
          <div style={{ fontSize: 12, color: "var(--km-tm)", lineHeight: 1.5, maxWidth: 210 }}>
            We couldn't find any articles matching your criteria.
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && blogPosts.length > 0 && (
        <div className={viewMode === "grid" ? "blog-grid" : ""} style={viewMode === "list" ? { display: "flex", flexDirection: "column", gap: 8 } : undefined}>
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="blog-card"
              onClick={() => navigate(`/dashboard/blog/${post.id}`)}
              style={viewMode === "list" ? { display: "flex", flexDirection: "row" } : undefined}
            >
              {/* Image */}
              <div style={{ position: "relative", overflow: "hidden", ...(viewMode === "list" ? { width: 180, flexShrink: 0 } : {}) }}>
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} className="blog-card-image" style={viewMode === "list" ? { height: "100%", minHeight: 120 } : undefined} />
                ) : (
                  <div
                    className="blog-card-image"
                    style={{
                      background: "var(--km-s2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...(viewMode === "list" ? { height: "100%", minHeight: 120 } : {}),
                    }}
                  >
                    <BookOpen size={28} style={{ color: "var(--km-td)" }} />
                  </div>
                )}
                <div className="category-badge">{post.category}</div>
              </div>

              {/* Content */}
              <div className="blog-card-content" style={{ flex: 1 }}>
                <div className="blog-card-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} />
                    <span>{post.read_time_minutes} min</span>
                  </div>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--km-td)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Calendar size={11} />
                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}</span>
                  </div>
                </div>

                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>

                <div className="blog-card-author">
                  <div className="author-info">
                    <div className="author-avatar"><User size={12} /></div>
                    <div>
                      <div className="author-name">{formatAuthorName(post.author_name)}</div>
                      <div className="author-role">Healthcare Professional</div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--km-ac)", opacity: 0.6 }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
