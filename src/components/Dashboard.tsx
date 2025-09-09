import { Calendar, AlertCircle, X, MessageSquare, FileText, BookOpen, Heart, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Featured blog posts data
  const featuredBlogs = [
    {
      id: "1",
      title: "Understanding Your Heart Health",
      excerpt: "Learn about maintaining optimal heart health through lifestyle changes and preventive care.",
      category: "Cardiology",
      readTime: "5 min read",
      author: "Dr. Sarah Johnson",
      date: "2024-12-20",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png'
    },
    {
      id: "2", 
      title: "The Importance of Regular Health Checkups",
      excerpt: "Discover why regular medical checkups are crucial for early detection and prevention.",
      category: "Preventive Care",
      readTime: "3 min read", 
      author: "Dr. Michael Chen",
      date: "2024-12-18",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png'
    },
    {
      id: "3",
      title: "Mental Health Awareness: Breaking the Stigma", 
      excerpt: "Understanding the importance of mental health care and how to seek help when needed.",
      category: "Mental Health",
      readTime: "4 min read",
      author: "Dr. Emily Rodriguez", 
      date: "2024-12-15",
      image: 'https://wellfinity.in/wp-content/uploads/2023/10/measuring-heart-health.png'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Alert Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your ID photo was not correctly uploaded. Please tap to update or talk to your doctor.
        </AlertDescription>
        <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">Upcoming dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming dates</h3>
              <p className="text-gray-600 text-sm">There are no upcoming dates at the moment.</p>
            </div>
          </CardContent>
        </Card>

        {/* Treatments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900">Treatments</CardTitle>
              <Button 
                variant="link" 
                className="text-blue-600 p-0 hover:text-blue-700"
                onClick={() => handleNavigation('/dashboard/treatments')}
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active treatments</h3>
              <p className="text-gray-600 text-sm">There are not active treatments at the moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigation('/dashboard/appointments')}
        >
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Schedule Appointment</h3>
            <p className="text-sm text-gray-600">Book your next visit</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigation('/dashboard/messages')}
        >
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Send Message</h3>
            <p className="text-sm text-gray-600">Contact your doctor</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigation('/dashboard/medical-records')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Medical Records</h3>
            <p className="text-sm text-gray-600">Check your medical records</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Blog Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Featured Health Resources</h2>
          <Button 
            variant="link" 
            className="text-blue-600 p-0 hover:text-blue-700"
            onClick={() => handleNavigation('/dashboard/blog')}
          >
            View all resources
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredBlogs.map((blog) => (
            <Card 
              key={blog.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500 overflow-hidden"
              onClick={() => handleNavigation('/dashboard/blog')}
            >
              {/* Image Section */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {/* Category Badge Overlay */}
                <div className="absolute top-3 left-3">
                  <div className="inline-block bg-white/95 backdrop-blur-sm text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                    {blog.category}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {blog.title}
                </h3>
                
                {/* Excerpt */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {blog.excerpt}
                </p>
                
                {/* Meta Information */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{blog.readTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>125</span>
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
