# WellieMD Admin Portal Client

A modern, responsive admin portal for managing WellieMD healthcare operations. Built with React, TypeScript, and Vite, this application provides a comprehensive interface for managing patients, products, questionnaires, billing, analytics, and more.

## 🚀 Features

- **Dashboard & Analytics**: Real-time metrics, revenue charts, and patient analytics
- **Patient Management**: Complete patient records and history
- **Product Management**: Product catalog, routing, and inventory management
- **Questionnaire Builder**: Visual flow builder for creating medical questionnaires
- **Billing & Payments**: Stripe integration for payment processing, invoices, and billing profiles
- **Order Management**: Order tracking, fulfillment, and dispute resolution
- **Affiliate Management**: Affiliate program with link generation and tracking
- **Coupon Codes**: Discount code creation and management
- **Settings**: Comprehensive configuration for domains, integrations, SMTP, webhooks, and more
- **Multi-client Support**: Support for multiple client configurations

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Flow Builder**: React Flow
- **Payment Processing**: Stripe.js
- **Drag & Drop**: @dnd-kit

## 📋 Prerequisites

- **Node.js**: v18 or higher (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **yarn** or **bun**
- Access to the WellieMD Django API backend

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd welliemd-next-app-client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://your-api-endpoint.com/api/v1
   ```
   
   For local development:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
welliemd-next-app-client/
├── src/
│   ├── api/              # API client configurations and endpoints
│   │   ├── adminApi.ts
│   │   ├── auth.ts
│   │   ├── axiosInstance.ts
│   │   ├── billingApi.ts
│   │   ├── ordersApi.ts
│   │   ├── products.ts
│   │   ├── questionnaires.ts
│   │   └── smtpApi.ts
│   ├── components/       # React components
│   │   ├── affiliates/   # Affiliate management components
│   │   ├── analytics/    # Analytics and charts
│   │   ├── auth/         # Authentication components
│   │   ├── billing/      # Billing components
│   │   ├── coupons/      # Coupon management
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── layout/       # Layout components (sidebar, header)
│   │   ├── products/     # Product management
│   │   ├── questionnaires/ # Questionnaire builder
│   │   ├── routing/      # Routing components
│   │   ├── settings/     # Settings pages components
│   │   ├── shared/       # Shared components
│   │   └── ui/           # shadcn-ui components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components (routes)
│   ├── services/         # Business logic services
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json
```

## 🔌 API Configuration

The application connects to a Django REST API backend. Configure the API base URL using the `VITE_API_BASE_URL` environment variable.

### Default API Endpoints

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://knysysapi.welliemd.com/api/v1`

### Authentication

The app uses JWT token-based authentication with automatic token refresh. Tokens are stored in Zustand state and automatically included in API requests via Axios interceptors.

## 🎨 UI Components

This project uses [shadcn-ui](https://ui.shadcn.com/) components built on Radix UI primitives. All components are located in `src/components/ui/` and can be customized via Tailwind CSS.

## 🔐 Authentication Flow

1. User signs in via `/sign-in`
2. JWT access and refresh tokens are stored in Zustand store
3. Access token is automatically added to all API requests
4. On 401 errors, refresh token is used to obtain new access token
5. Protected routes require authentication

## 📦 Key Features Implementation

### Flow Builder
- Visual questionnaire builder using React Flow
- Drag-and-drop node creation
- Conditional routing and edge configuration
- Question templates and reordering

### Billing Integration
- Stripe payment processing
- Invoice generation and management
- Billing profile management
- Payment method management

### Multi-client Support
- Automatic client detection based on domain
- Client-specific API endpoints
- Isolated data per client

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

### Environment Variables for Production

Ensure the following environment variables are set:
- `VITE_API_BASE_URL` - Your production API endpoint

### Deployment Options

- **Static Hosting**: Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, AWS S3, etc.)
- **Docker**: Create a Dockerfile using a Node.js base image and serve the built files with nginx
- **CDN**: Upload the built files to a CDN for optimal performance

## 🧪 Development Tips

- The app runs on port `8080` by default (configured in `vite.config.ts`)
- Hot module replacement (HMR) is enabled for fast development
- Use React DevTools and Redux DevTools for debugging
- Check browser console for API errors and debugging information

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contributing guidelines here]

## 📞 Support

For issues and questions, please contact the development team or create an issue in the repository
