import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Clock, Share2, Bookmark, Heart, Eye, Twitter, Facebook, Linkedin, Link2 } from "lucide-react";
import "../styles/blog.css";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  views?: string;
  likes?: string;
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const mockPost: BlogPost = {
      id: id || "1",
      title: "Understanding Your Heart Health: A Comprehensive Guide",
      content: `
        <div class="prose max-w-none">
          <p class="text-lg text-gray-700 mb-6 leading-relaxed">Heart health is one of the most important aspects of overall wellness. In this comprehensive guide, we'll explore the key factors that contribute to cardiovascular health and provide actionable steps you can take to maintain a healthy heart.</p>
          
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">The Importance of Heart Health</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">Your heart is the engine that keeps your body running. It pumps blood throughout your circulatory system, delivering oxygen and nutrients to every cell in your body. Maintaining good heart health is crucial for:</p>
          
          <ul class="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>Preventing cardiovascular disease</li>
            <li>Maintaining energy levels</li>
            <li>Supporting overall physical performance</li>
            <li>Enhancing quality of life</li>
          </ul>
          
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Key Risk Factors</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">Several factors can increase your risk of heart disease:</p>
          
          <div class="grid md:grid-cols-2 gap-4 mb-6">
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 class="font-bold text-red-800 mb-2">High Blood Pressure</h4>
              <p class="text-red-700 text-sm">Often called the "silent killer"</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 class="font-bold text-red-800 mb-2">High Cholesterol</h4>
              <p class="text-red-700 text-sm">Can lead to plaque buildup in arteries</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 class="font-bold text-red-800 mb-2">Smoking</h4>
              <p class="text-red-700 text-sm">Damages blood vessels and reduces oxygen</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 class="font-bold text-red-800 mb-2">Diabetes</h4>
              <p class="text-red-700 text-sm">Increases risk of heart disease</p>
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Prevention Strategies</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">The good news is that many heart disease risk factors are controllable through lifestyle changes:</p>
          
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-6 shadow-sm">
            <h3 class="text-xl font-bold text-green-800 mb-4">1. Maintain a Healthy Diet</h3>
            <ul class="list-disc pl-6 text-green-700 space-y-2">
              <li>Eat plenty of fruits and vegetables</li>
              <li>Choose whole grains over refined grains</li>
              <li>Include lean proteins like fish, poultry, and legumes</li>
              <li>Limit saturated and trans fats</li>
              <li>Reduce sodium intake</li>
            </ul>
          </div>
        </div>
      `,
      author: "Dr. Sarah Johnson",
      date: "2024-12-20",
      category: "Cardiology",
      image: "https://media.licdn.com/dms/image/v2/D5612AQHEdy3zi4-mWw/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1733805035874?e=2147483647&v=beta&t=JV5Qau6VIBlblAOfbwOISgd8jjqpXRytFJG-JDlBJL4",
      readTime: "5 min read",
      views: "2.4k",
      likes: "156"
    };

    setTimeout(() => {
      setPost(mockPost);
      setLoading(false);
    }, 500);
  }, [id]);

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

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
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
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-red-50 hover:text-red-600'
                }`}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button 
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isBookmarked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600'
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
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <Eye className="w-4 h-4" />
              <span>{post.views} views</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Author Card */}
        <div className="blog-post-author-card">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{post.author}</div>
            <div className="text-gray-600">Healthcare Professional</div>
            <div className="text-sm text-gray-500 mt-1">
              Published {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <img 
          src={post.image} 
          alt={post.title}
          className="blog-post-image"
        />

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
            <button className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300">
              <Twitter className="w-5 h-5" />
              Twitter
            </button>
            <button className="flex items-center gap-3 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300">
              <Facebook className="w-5 h-5" />
              Facebook
            </button>
            <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300">
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </button>
            <button className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-2xl font-medium border-2 border-gray-300 hover:border-gray-400 transition-all duration-300">
              <Link2 className="w-5 h-5" />
              Copy Link
            </button>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center justify-center lg:justify-start gap-8">
              <div className="text-center bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl">
                <div className="text-3xl font-bold text-red-600">{post.likes}</div>
                <div className="text-gray-600 font-medium">Likes</div>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">{post.views}</div>
                <div className="text-gray-600 font-medium">Views</div>
              </div>
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl">
                <div className="text-3xl font-bold text-green-600">12</div>
                <div className="text-gray-600 font-medium">Comments</div>
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
