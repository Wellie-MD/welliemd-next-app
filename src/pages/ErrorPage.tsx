import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, Home, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  type?: '404' | '403';
  title?: string;
  message?: string;
}

export default function ErrorPage({ 
  type = '404',
  title,
  message 
}: ErrorPageProps) {
  const navigate = useNavigate();

  const config = {
    '404': {
      icon: AlertCircle,
      defaultTitle: 'Page Not Found',
      defaultMessage: "The page you're looking for doesn't exist or has been moved.",
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    '403': {
      icon: Lock,
      defaultTitle: 'Access Denied',
      defaultMessage: "You don't have permission to access this page. Contact your administrator if you believe this is an error.",
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  };

  const { icon: Icon, defaultTitle, defaultMessage, iconColor, bgColor } = config[type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className={`mx-auto w-20 h-20 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>

        {/* Error Code */}
        <div>
          <h1 className="text-6xl font-bold text-foreground mb-2">{type}</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            {title || defaultTitle}
          </h2>
          <p className="text-muted-foreground">
            {message || defaultMessage}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        {type === '403' && (
          <p className="text-sm text-muted-foreground pt-4 border-t">
            Need access? Contact your Primary Owner or Administrator.
          </p>
        )}
      </div>
    </div>
  );
}
