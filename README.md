# WellieMD Patient Portal

A modern, enterprise-grade React application for patient healthcare management built with TypeScript, Vite, and a comprehensive architectural foundation.

## 🏥 Overview

The WellieMD Patient Portal is a scalable, secure web application that enables patients to manage their healthcare information, schedule appointments, communicate with providers, and access medical records. Built with modern React patterns and enterprise-grade architecture.

## ✨ Features

- **🔐 Secure Authentication** - JWT-based auth with automatic token refresh
- **👥 Role-Based Access Control** - Granular permissions for patients, providers, and admins
- **📅 Appointment Management** - Schedule, reschedule, and manage appointments
- **📋 Medical Records** - Secure access to medical history and documents
- **💊 Prescription Management** - View and request prescription refills
- **💬 Provider Messaging** - Secure communication with healthcare team
- **🧪 Lab Results** - Access to laboratory test results and reports
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile
- **🌙 Dark Mode Support** - Theme switching with user preference persistence
- **🚩 Feature Flags** - Runtime feature toggling and A/B testing
- **♿ Accessibility** - WCAG 2.1 AA compliant

## 🛠 Technology Stack

### Core Technologies
- **React 18** - Modern React with concurrent features
- **TypeScript** - Full type safety and developer experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components

### State Management & Data
- **Zustand** - Lightweight, flexible state management
- **React Router v6** - Declarative routing with nested routes
- **Axios** - HTTP client with interceptors and retry logic
- **Zod** - Runtime type validation and schema parsing
- **React Hook Form** - Performant forms with validation

### Development & Testing
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for development and testing
- **ESLint + Prettier** - Code linting and formatting
- **Husky** - Git hooks for quality gates
- **TypeScript** - Static type checking

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version

### Automated Setup

Run our setup script to get started quickly:

```bash
npm run setup
```

This will:
- ✅ Check your environment
- ✅ Install dependencies  
- ✅ Configure environment variables
- ✅ Set up Git hooks
- ✅ Run initial tests

### Manual Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd welliemd-next-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Verify Setup**
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   ```

## 📁 Project Structure

```
src/
├── app/                    # Application root & routing
│   ├── providers/         # React context providers  
│   └── router/           # Route configuration & guards
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Layout components
│   └── common/           # Reusable components
├── features/             # Feature modules (domain-driven)
│   ├── auth/             # Authentication & authorization
│   ├── appointments/     # Appointment management
│   ├── patients/         # Patient management  
│   └── ...               # Other feature modules
├── shared/               # Cross-cutting concerns
│   ├── api/              # HTTP client & API utilities
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── store/            # Global Zustand stores
├── config/               # Application configuration
├── theme/                # Design system & tokens
└── __tests__/            # Test utilities & mocks
```

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing  
npm run test             # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:ci          # Run tests in CI mode

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code with Prettier
npm run typecheck        # Check TypeScript types

# Utilities
npm run clean            # Clean build artifacts
npm run analyze          # Analyze bundle size
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/appointment-reminders
   ```

2. **Develop with Tests**
   - Write code following established patterns
   - Add tests for new functionality
   - Use TypeScript strictly

3. **Quality Checks**
   ```bash
   npm run lint:fix
   npm run test
   npm run typecheck
   ```

4. **Commit with Convention**
   ```bash
   git commit -m "feat(appointments): add email reminder functionality"
   ```

5. **Submit Pull Request**
   - All tests must pass
   - Code review required
   - Automated deployment after merge

## 🏗 Architecture

### Core Principles

- **Feature-First Organization** - Code organized by business domains
- **Type Safety** - TypeScript throughout with runtime validation
- **Separation of Concerns** - Clear boundaries between layers
- **Scalability** - Patterns that support team and application growth

### Data Flow

```
UI Component → Custom Hook → Service Layer → API Client → Backend
     ↓              ↓            ↓           ↓
   Re-render ← Store Update ← Response ← HTTP Response
```

### Key Patterns

- **Service Layer** - Business logic abstraction
- **Custom Hooks** - React integration layer  
- **Zustand Stores** - Focused, domain-specific state
- **Route Guards** - Authentication & authorization
- **Error Boundaries** - Graceful error handling

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens** - Secure token-based authentication
- **Automatic Refresh** - Seamless token renewal
- **RBAC System** - Role-based access control
- **Route Protection** - Guard sensitive routes
- **Permission Checks** - Component-level access control

### Security Features

- **Input Validation** - Client and server-side validation
- **XSS Prevention** - Content Security Policy
- **CSRF Protection** - State-changing operation protection  
- **Secure Storage** - Proper token storage strategies
- **Audit Logging** - Security event tracking

## 🧪 Testing

### Testing Strategy

- **Unit Tests** (70%) - Functions, hooks, services
- **Integration Tests** (20%) - Component interactions
- **E2E Tests** (10%) - Critical user workflows

### Testing Tools

- **Vitest** - Fast test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **Custom Utilities** - Test helpers and factories

### Example Test

```typescript
import { render, screen, userEvent } from '@/__tests__/utils';
import { LoginForm } from './login-form';

test('should login user with valid credentials', async () => {
  const user = userEvent.setup();
  
  render(<LoginForm />);
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

## 🎨 UI/UX

### Design System

- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Design Tokens** - Consistent spacing, colors, typography
- **Dark Mode** - System and user preference support
- **Responsive** - Mobile-first responsive design

### Accessibility

- **WCAG 2.1 AA** - Accessibility standard compliance
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader** - Proper ARIA labels and structure
- **Color Contrast** - Sufficient contrast ratios
- **Focus Management** - Clear focus indicators

## 📚 Documentation

### Developer Resources

- **[Onboarding Guide](docs/ONBOARDING.md)** - New developer setup
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System architecture
- **[Extension Playbook](docs/EXTENSION_PLAYBOOK.md)** - Adding features
- **[Guidelines](src/guidelines/Guidelines.md)** - Coding standards

### API Documentation

- **OpenAPI Spec** - Complete API documentation
- **Type Definitions** - Generated TypeScript types
- **Mock Data** - MSW handlers for development

## 🚀 Deployment

### Environments

- **Development** - Local development with hot reload
- **Staging** - Pre-production testing environment  
- **Production** - Live application with monitoring

### CI/CD Pipeline

1. **Code Quality** - Linting, type checking, tests
2. **Security Scan** - Dependency vulnerability check
3. **Build** - Production build with optimization
4. **Deploy** - Automated deployment to CDN
5. **Monitor** - Performance and error monitoring

## 📈 Performance

### Optimization Strategies

- **Code Splitting** - Route and component-level splitting
- **Bundle Analysis** - Regular bundle size monitoring
- **Lazy Loading** - Deferred loading of heavy components
- **Memoization** - React.memo and useMemo optimization
- **Image Optimization** - WebP format and responsive images

### Monitoring

- **Core Web Vitals** - LCP, FID, CLS tracking
- **Error Monitoring** - Real-time error reporting
- **Performance Metrics** - Bundle size and load times
- **User Analytics** - Usage patterns and flows

## 🤝 Contributing

### Development Process

1. **Fork & Clone** - Create your development environment
2. **Feature Branch** - Work on focused feature branches
3. **Quality Gates** - Pass all tests and linting
4. **Pull Request** - Submit for code review
5. **Review & Merge** - Collaborative review process

### Coding Standards

- **TypeScript** - Strict type checking enabled
- **ESLint** - Enforced code style rules
- **Prettier** - Consistent code formatting
- **Conventional Commits** - Structured commit messages
- **Test Coverage** - Maintain >80% test coverage

### Code Review Checklist

- [ ] Code follows established patterns
- [ ] Tests are comprehensive
- [ ] Performance implications considered
- [ ] Security best practices followed
- [ ] Accessibility requirements met
- [ ] Documentation updated

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation** - Check docs/ folder for guides
- **Issues** - GitHub issues for bugs and features
- **Discussions** - GitHub discussions for questions
- **Team Chat** - Internal team communication channels

### Troubleshooting

**Common Issues:**

1. **Build Errors** - Run `npm run typecheck` to identify TypeScript issues
2. **Test Failures** - Use `npm run test:ui` for interactive debugging
3. **Linting Issues** - Run `npm run lint:fix` to auto-fix style issues
4. **Environment Issues** - Verify `.env.local` configuration

**Debug Tools:**

- **React DevTools** - Component tree and state inspection
- **Browser DevTools** - Network and performance debugging
- **VS Code Debugger** - Step-through debugging support

---

## 🙏 Acknowledgments

Built with modern web technologies and inspired by enterprise-grade architectural patterns. Special thanks to the open-source community for the excellent tools and libraries that make this project possible.

---

**Ready to contribute?** Check out our [Onboarding Guide](docs/ONBOARDING.md) to get started! 🚀