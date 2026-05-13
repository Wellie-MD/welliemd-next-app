import { useState, useEffect, useCallback } from "react";
import { Search, Grid2X2, Rows, Clock, Calendar, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resourcesApi, type BlogResource, type ResourceCategory } from "@/features/resources/api";

export default function Blog() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<ResourceCategory[]>([]);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; category?: string; is_bookmarked?: boolean } = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory === "saved") {
        params.is_bookmarked = true;
      } else if (activeCategory && activeCategory !== "saved") {
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

  // Fetch tenant categories once on mount to render dynamic filter tags
  useEffect(() => {
    let mounted = true;
    resourcesApi.getCategories()
      .then((cs) => {
        if (mounted && cs && cs.length) setCategories(cs);
      })
      .catch(() => {
        // silent fallback to hardcoded tags if categories API fails
      });
    return () => { mounted = false; };
  }, []);

  const getEmojiForPost = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('weight loss')) return '🥗';
    if (t.includes('mindful eating')) return '🧘';
    if (t.includes('fitness') || t.includes('exercise')) return '🏋️';
    return '📖';
  };

  return (
    <div className="pg" id="pg-resources">
      <div className="km-fade" style={{ marginBottom: 12 }}>
        <p className="km-page-title">Resources</p>
        <p className="km-page-sub">Browse articles, tips, and wellness advice</p>
      </div>

      <div className="km-swrap km-fade">
        <Search size={18} style={{ color: 'var(--km-tm)' }} />
        <input
          className="km-sinp"
          placeholder="Search for articles, tips, wellness advice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div 
        className="km-fade" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div className="km-rtags">
          <span className={`km-rtag ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>All</span>
          <span className={`km-rtag ${activeCategory === 'saved' ? 'active' : ''}`} onClick={() => setActiveCategory('saved')}>Saved</span>
          {categories && categories.length > 0 ? (
            categories.map((c) => (
              <span
                key={c.id}
                className={`km-rtag ${activeCategory === c.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(c.name)}
              >
                {c.name}
              </span>
            ))
          ) : (
            // Fallback hardcoded tags while categories are not available
            <>
              <span className={`km-rtag ${activeCategory === 'General' ? 'active' : ''}`} onClick={() => setActiveCategory('General')}>General</span>
              <span className={`km-rtag ${activeCategory === 'Wellness Tips' ? 'active' : ''}`} onClick={() => setActiveCategory('Wellness Tips')}>Wellness Tips</span>
            </>
          )}
        </div>
        
        <div className="km-rtoggle">
          <div className={`km-rtbtn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <Grid2X2 size={14} />
          </div>
          <div className={`km-rtbtn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <Rows size={14} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="km-empty" style={{ padding: '48px 18px' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--km-ac)', marginBottom: 12 }} />
          <div className="km-et">Loading resources...</div>
        </div>
      ) : error ? (
        <div className="km-empty" style={{ padding: '48px 18px' }}>
          <AlertCircle size={24} style={{ color: 'var(--km-re)', marginBottom: 12 }} />
          <div className="km-et">Error loading resources</div>
          <div className="km-es">{error}</div>
          <button onClick={fetchResources} className="km-btn km-btn-outline" style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="km-empty" style={{ padding: '48px 18px' }}>
          <BookOpen size={24} style={{ color: 'var(--km-td)', marginBottom: 12 }} />
          <div className="km-et">No resources found</div>
          <div className="km-es">Try adjusting your search or filters.</div>
        </div>
      ) : (
        <div className={`km-fade ${viewMode === 'grid' ? 'km-rgrid' : 'km-rlist'}`}>
          {blogPosts.map((post) => (
            <div 
              key={post.id} 
              className="km-ritem" 
              onClick={() => navigate(`/dashboard/blog/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="km-rimg-banner">
                {post.cover_image ? (
                   <img src={post.cover_image} alt={post.title} />
                ) : (
                  <span className="km-rimg-emoji">{getEmojiForPost(post.title)}</span>
                )}
              </div>
              
              <div className="km-rmeta-row">
                <div className="km-rmeta-item">
                  <Clock size={12} />
                  <span>{post.read_time_minutes || 1} min read</span>
                </div>
                <div className="km-rmeta-item">
                  <Calendar size={12} />
                  <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : '4/7/2026'}</span>
                </div>
                <span className="km-rtag-meta">{post.category || 'General'}</span>
              </div>

              <h2 className="km-rtitle-elegant">{post.title}</h2>
              <p className="km-rdesc-elegant">{post.excerpt}</p>

              <div className="km-rauth-row">
                <div className="km-ravatar">{post.author_name ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'HC'}</div>
                <div className="km-rauth-info">
                  <span className="km-rauth-email">{post.author_name || 'Healthcare Professional'}</span>
                  <span className="km-rauth-title">Healthcare Professional</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
