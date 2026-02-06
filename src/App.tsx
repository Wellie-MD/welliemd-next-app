import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRouter } from './app/router';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { DropdownProvider } from '@/contexts/DropdownContext';
import { BrandProvider } from './contexts/BrandingContext';

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <BrandProvider>
      <DropdownProvider>
        <div className="min-h-screen bg-background">
          <AuthInitializer>
            <AppRouter />
          </AuthInitializer>
          
        {/* Global toast notifications */}
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </div>
      </DropdownProvider>
      </BrandProvider>
    </Router>
  );
}
