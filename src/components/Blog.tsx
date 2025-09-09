import { useState } from "react";
import { Search, Filter, Grid3X3, List, Clock, Calendar, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/blog.css";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  views?: string;
  likes?: string;
}

export default function Blog() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [blogPosts] = useState<BlogPost[]>([
    {
      id: "1",
      title: "Understanding Your Heart Health: A Comprehensive Guide",
      excerpt: "Learn about maintaining optimal heart health through lifestyle changes, regular monitoring, and preventive care strategies that can save your life.",
      content: "Full blog post content here...",
      author: "Dr. Sarah Johnson",
      date: "2024-12-20",
      category: "Cardiology",
      image: "https://media.licdn.com/dms/image/v2/D5612AQHEdy3zi4-mWw/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1733805035874?e=2147483647&v=beta&t=JV5Qau6VIBlblAOfbwOISgd8jjqpXRytFJG-JDlBJL4",
      readTime: "5 min read",
      views: "2.4k",
      likes: "156"
    },
    {
      id: "2",
      title: "The Importance of Regular Health Checkups",
      excerpt: "Discover why regular medical checkups are crucial for early detection and prevention of serious health issues before they become critical.",
      content: "Full blog post content here...",
      author: "Dr. Michael Chen",
      date: "2024-12-18",
      category: "Preventive Care",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png',
      readTime: "3 min read",
      views: "1.8k",
      likes: "92"
    },
    {
      id: "3",
      title: "Mental Health Awareness: Breaking the Stigma",
      excerpt: "Understanding the importance of mental health care and how to seek help when you need it most in today's challenging world.",
      content: "Full blog post content here...",
      author: "Dr. Emily Rodriguez",
      date: "2024-12-15",
      category: "Mental Health",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png',
      readTime: "4 min read",
      views: "3.2k",
      likes: "203"
    },
    {
      id: "4",
      title: "Nutrition Guidelines for a Healthy Lifestyle",
      excerpt: "Essential nutrition tips and dietary recommendations for maintaining optimal health and wellness throughout your entire life journey.",
      content: "Full blog post content here...",
      author: "Dr. James Wilson",
      date: "2024-12-12",
      category: "Nutrition",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png',
      readTime: "6 min read",
      views: "1.5k",
      likes: "78"
    },
    {
      id: "5",
      title: "Exercise and Physical Therapy Benefits",
      excerpt: "How regular exercise and physical therapy can transform your health and improve your quality of life significantly.",
      content: "Full blog post content here...",
      author: "Dr. Lisa Park",
      date: "2024-12-10",
      category: "Physical Therapy",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png',
      readTime: "7 min read",
      views: "2.1k",
      likes: "134"
    },
    {
      id: "6",
      title: "Sleep Health: Getting Quality Rest",
      excerpt: "Understanding the science of sleep and how to optimize your rest for better health, productivity, and overall well-being.",
      content: "Full blog post content here...",
      author: "Dr. Robert Kim",
      date: "2024-12-08",
      category: "Sleep Medicine",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png',
      readTime: "4 min read",
      views: "1.9k",
      likes: "112"
    }
  ]);

  const handleReadMore = (postId: string) => {
    navigate(`/dashboard/blog/${postId}`);
  };

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
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

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

        {/* Blog Posts Grid */}
        <div className={viewMode === 'grid' ? 'blog-grid' : 'flex flex-col gap-6'}>
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="blog-card group"
              onClick={() => handleReadMore(post.id)}
            >
              {/* Image Section */}
              <div className="relative overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="blog-card-image"
                />
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
                    <span>{post.readTime}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
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
                      <div className="author-name">{post.author}</div>
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

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="load-more-btn">
            Load More Resources
          </button>
        </div>
      </div>
    </div>
  );
}