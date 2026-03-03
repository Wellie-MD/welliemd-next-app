import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Clock, Share2, Bookmark, Heart, Eye, Twitter, Facebook, Linkedin, Link2, AlertCircle } from "lucide-react";
import { resourcesApi, type BlogResource } from "@/features/resources/api";
import "../styles/blog.css";

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
        if (!cancelled) setPost(data);
      } catch {
        if (!cancelled) setError("Failed to load article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const formatViews = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{error || "Article Not Found"}</h1>
          <button
            onClick={() => navigate('/dashboard/blog')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sticky Navigation */}
      <div className="blog-nav">
        <div className="blog-post-container py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard/blog')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-red-50 hover:text-red-600'
                  }`}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isBookmarked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-green-50 hover:text-green-600 transition-all duration-300">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-container py-8">
        {/* Article Header */}
        <div className="blog-post-header">
          <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium mb-6">
            {post.category}
          </div>

          <h1 className="blog-post-title">
            {post.title}
          </h1>

          <div className="blog-post-meta">
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>{post.read_time_minutes} min read</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <Eye className="w-4 h-4" />
              <span>{formatViews(post.views_count)} views</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}</span>
            </div>
          </div>
        </div>

        {/* Author Card */}
        <div className="blog-post-author-card">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{post.author_name}</div>
            <div className="text-gray-600">Healthcare Professional</div>
            {post.published_at && (
              <div className="text-sm text-gray-500 mt-1">
                Published {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="blog-post-image"
          />
        )}

        {/* Article Content */}
        <div className="blog-post-content">
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Social Share */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Share this article</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(post.title);
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300"
            >
              <Twitter className="w-5 h-5" />
              Twitter
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-3 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300"
            >
              <Facebook className="w-5 h-5" />
              Facebook
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(post.title);
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300"
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn?.querySelector('span')?.textContent;
                  const span = btn?.querySelector('span');
                  if (span) {
                    span.textContent = 'Copied!';
                    setTimeout(() => { span.textContent = originalText || 'Copy Link'; }, 2000);
                  }
                });
              }}
              className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-2xl font-medium border-2 border-gray-300 hover:border-gray-400 transition-all duration-300"
            >
              <Link2 className="w-5 h-5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center justify-center lg:justify-start gap-8">
              <div className="text-center bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl">
                <div className="text-3xl font-bold text-red-600">{post.likes_count}</div>
                <div className="text-gray-600 font-medium">Likes</div>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">{formatViews(post.views_count)}</div>
                <div className="text-gray-600 font-medium">Views</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard/blog')}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to All Articles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
