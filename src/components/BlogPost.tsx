import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Bookmark, AlertCircle } from "lucide-react";
import { resourcesApi, type BlogResource } from "@/features/resources/api";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            color: 'var(--km-t)',
            background: 'var(--km-s2)',
            border: '1px solid var(--km-b)',
            borderRadius: 'var(--km-rs)',
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Resources</span>
        </button>
      </div>

      <div className="km-fade fd">
        <div className="km-ritem" style={{ cursor: 'default', marginBottom: 0 }}>
          <div className="km-rimg-banner" style={{ borderRadius: 12 }}>
            {post.cover_image ? (
               <img src={post.cover_image} alt={post.title} />
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
              <div className="km-ravatar">{post.author_name ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'HC'}</div>
              <div className="km-rauth-info">
                <span className="km-rauth-email">{post.author_name || 'Healthcare Professional'}</span>
                <span className="km-rauth-title">Healthcare Professional</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
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
             className="km-article-content"
             dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </div>
      </div>
    </div>
  );
}
