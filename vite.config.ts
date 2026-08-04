import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { releaseIdentityPlugin } from "./release-identity";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    releaseIdentityPlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@tanstack/react-query', 'zustand', 'axios', 'date-fns', 'lucide-react'],
          'orders-payments': ['./src/pages/Orders', './src/pages/Payments'],
          'clients': ['./src/pages/Clients', './src/pages/ClientForm', './src/pages/ClientLifecycle'],
          'products': ['./src/pages/Products', './src/pages/ProductConfig', './src/pages/ProductDoseMappings', './src/pages/Supplies', './src/pages/ArchiveProducts'],
          'questionnaires': ['./src/pages/Questionnaires', './src/pages/QuestionnaireQuestions', './src/pages/FlowBuilder', './src/pages/TemplateAssignment', './src/pages/TemplateAssignmentHistory', './src/pages/ArchiveTemplates'],
          'analytics': ['./src/pages/Analytics', './src/pages/AnalyticsCohorts', './src/pages/AnalyticsReports', './src/pages/ClientPerformance'],
        },
      },
    },
  },
}));
