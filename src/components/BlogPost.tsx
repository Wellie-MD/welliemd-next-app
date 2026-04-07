import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Bookmark, Heart, AlertCircle } from "lucide-react";
import { resourcesApi, type BlogResource } from "@/features/resources/api";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await resourcesApi.getById(id);
        if (!cancelled) {
          setPost(data);
          setIsLiked(data.is_liked || false);
          setIsBookmarked(data.is_bookmarked || false);
        }
      } catch {
        if (!cancelled) setError("Failed to load article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const result = await resourcesApi.toggleLike(post.id);
      setIsLiked(result.status === 'liked');
    } catch (err: any) {
      console.error("toggleLike error:", err?.response?.data || err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!post) return;
    try {
      const result = await resourcesApi.toggleBookmark(post.id);
      setIsBookmarked(result.status === 'added');
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="km-empty" style={{ padding: '100px 18px' }}>
        <div className="km-eic" style={{ animation: 'spin 2s linear infinite' }}>
          <Clock size={18} style={{ color: 'var(--km-ac)' }} />
        </div>
        <div className="km-et">Loading article…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="km-empty" style={{ padding: '100px 18px' }}>
        <div className="km-eic" style={{ background: 'var(--km-rep)' }}>
          <AlertCircle size={18} style={{ color: 'var(--km-re)' }} />
        </div>
        <div className="km-et">{error || "Article Not Found"}</div>
        <button
          onClick={() => navigate('/dashboard/blog')}
          className="km-btn km-btn-primary"
          style={{ marginTop: 12 }}
        >
          <ArrowLeft size={14} style={{ marginRight: 8 }} />
          Back to Resources
        </button>
      </div>
    );
  }

  return (
    <div className="pg" id="pg-article">
      <div className="km-fade" style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate('/dashboard/blog')}
          className="km-btn km-btn-ghost"
          style={{ padding: '4px 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--km-tm)' }}
        >
          <ArrowLeft size={14} /> Back to Resources
        </button>
      </div>

      <div className="km-fade fd">
        <div className="km-ritem" style={{ cursor: 'default', marginBottom: 0 }}>
          <div className="km-rimg-banner" style={{ height: 240, borderRadius: 12 }}>
            {post.cover_image ? (
               <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="km-rimg-emoji" style={{ fontSize: 64 }}>📖</span>
            )}
          </div>
          
          <div className="km-rmeta-row" style={{ marginTop: 24 }}>
            <div className="km-rmeta-item">
              <Clock size={12} />
              <span>{post.read_time_minutes || 1} min read</span>
            </div>
            <div className="km-rmeta-item">
              <Calendar size={12} />
              <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}</span>
            </div>
            <span className="km-rtag-meta">{post.category || 'General'}</span>
          </div>

          <h1 className="km-rtitle-elegant" style={{ fontSize: 32, marginBottom: 16 }}>{post.title}</h1>

          <div className="km-rauth-row" style={{ padding: '20px 0', borderTop: '1px solid var(--km-b)', borderBottom: '1px solid var(--km-b)', marginBottom: 24, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="km-ravatar">CK</div>
              <div className="km-rauth-info">
                <span className="km-rauth-email">[email protected]</span>
                <span className="km-rauth-title">Healthcare Professional</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`km-btn ${isLiked ? 'km-btn-primary' : 'km-btn-outline'}`}
                style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                onClick={handleToggleLike}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button
                className={`km-btn ${isBookmarked ? 'km-btn-primary' : 'km-btn-outline'}`}
                style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                onClick={handleToggleBookmark}
              >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          <div 
             className="km-article-content prose dark:prose-invert max-w-none"
             style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--km-t)', paddingBottom: 40 }}
             dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </div>
      </div>
    </div>
  );
}
