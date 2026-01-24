import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Component that redirects any URL with a trailing slash to the same URL without trailing slash.
 * This prevents 404 errors when the server tries to fetch routes with trailing slashes.
 * 
 * Example: /dashboard/patients/ -> /dashboard/patients
 */
export function TrailingSlashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;
    
    // Check if pathname ends with a trailing slash (but not just "/")
    if (pathname !== '/' && pathname.endsWith('/')) {
      // Remove trailing slash and redirect
      const newPathname = pathname.slice(0, -1);
      const newPath = newPathname + search + hash;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

