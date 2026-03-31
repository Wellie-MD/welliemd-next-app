import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Clock, Share2, Bookmark, Heart, Eye, Twitter, Linkedin, Link2, AlertCircle } from "lucide-react";
import { resourcesApi, type BlogResource } from "@/features/resources/api";
import { useBranding } from "@/features/branding/hooks/useBranding";
import "../styles/blog.css";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useBranding();
  const [post, setPost] = useState<BlogResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const SHOW_SHARE = false;

  const formatAuthorName = (name: string) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((part) =>
        part ? part.charAt(0).toUpperCase() + part.slice(1) : part
      )
      .join(" ");

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
          setLikeCount(data.likes_count || 0);
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
      setLikeCount(result.likes_count);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <div className="pt-8 pb-4">
        <div className="blog-post-container">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard/blog')}
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm mr-3 transition-colors hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </span>
              Back to Resources
            </button>

            <div className="flex items-center gap-3">
              <button
                className={`flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm transition-all duration-300 ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                  }`}
                onClick={handleToggleLike}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                className={`flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm transition-all duration-300 ${isBookmarked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                onClick={handleToggleBookmark}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              {SHOW_SHARE && (
                <button
                  onClick={() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: 'smooth'
                    });
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-green-600 transition-all duration-300">
                  <Share2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-container py-8">
        {/* Article Header */}
        <div className="blog-post-header">
          <div
            className="inline-block px-6 py-2 rounded-full font-medium mb-6"
            style={{ backgroundColor: colors.primaryColor, color: 'white' }}
          >
            {post.category}
          </div>

          <h1 className="blog-post-title dark:text-white">
            {post.title}
          </h1>

          <div className="blog-post-meta">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 dark:text-black px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>{post.read_time_minutes} min read</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 dark:text-black px-4 py-2 rounded-full">
              <Eye className="w-4 h-4" />
              <span>{formatViews(post.views_count)} views</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 dark:text-black px-4 py-2 rounded-full">
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
            <div className="text-xl font-bold text-gray-900">
              {formatAuthorName(post.author_name)}
            </div>
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
        <div className="blog-post-content prose prose-blue dark:prose-invert max-w-none break-words prose-img:rounded-xl prose-headings:text-gray-900 prose-a:text-blue-600">
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
            className="overflow-x-auto"
          />
        </div>

        {/* Social Share & Engagement Stats */}
        {SHOW_SHARE && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 w-full mt-8">
            <h3 className="text-[17px] font-semibold text-gray-900 mb-5">Share this article</h3>

            {/* Main Flex Container: justify-between splits the left and right sections */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">

              {/* LEFT ALIGNED: Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(post.title);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-500 rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-95 active:translate-y-0 text-sm"
                >
                  <Twitter className="w-4 h-4 shrink-0" fill="currentColor" strokeWidth={0} />
                  <span className="whitespace-nowrap">Twitter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 text-sm"
                >
                  <Linkedin className="w-4 h-4 shrink-0" fill="currentColor" strokeWidth={0} />
                  <span className="whitespace-nowrap">LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy text: ', err);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-95 active:translate-y-0 text-sm"
                >
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* RIGHT ALIGNED: Divider & Stats */}
              <div className="flex items-center justify-center md:justify-end gap-6 md:gap-8 w-full md:w-auto mt-4 md:mt-0">

                {/* Vertical Divider */}
                <div className="w-px bg-gray-200 h-10 hidden md:block"></div>

                {/* Likes Stat */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="text-center group cursor-pointer bg-transparent border-none p-0 appearance-none hover:opacity-80 transition-all active:scale-95"
                >
                  <div className="text-[28px] font-bold text-red-500 group-hover:scale-110 transition-transform leading-none mb-1">
                    {likeCount}
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Likes</div>
                </button>

                {/* Views Stat */}
                <div className="text-center group cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-[28px] font-bold text-blue-500 group-hover:scale-110 transition-transform leading-none mb-1">
                    {formatViews(post.views_count)}
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Views</div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
