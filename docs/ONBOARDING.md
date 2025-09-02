# WellieMD Patient Portal - Developer Onboarding

Welcome to the WellieMD Patient Portal development team! This guide will help you get up and running quickly with our codebase.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn/pnpm equivalent)
- **Git**: Latest version
- **VS Code**: Recommended (with suggested extensions)

### Automated Setup

Run our automated setup script:

```bash
npm run setup
```

This script will:
- ✅ Check your environment prerequisites
- ✅ Install dependencies
- ✅ Create environment files
- ✅ Set up Git hooks
- ✅ Run initial tests and linting

### Manual Setup

If you prefer manual setup:

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

3. **Setup Git Hooks**
   ```bash
   npm run prepare
   ```

4. **Verify Setup**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

## 📁 Project Structure

Our project follows a **feature-first** architecture:

```
src/
├── app/                    # Application root & routing
│   ├── providers/         # React context providers
│   └── router/           # Route configuration & guards
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Layout components
│   └── common/           # Reusable business components
├── features/             # Feature modules (domain-driven)
│   ├── auth/             # Authentication feature
│   ├── patients/         # Patient management
│   ├── appointments/     # Appointment scheduling
│   └── ...
├── shared/               # Cross-cutting concerns
│   ├── api/              # HTTP client & API utilities
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── store/            # Global Zustand stores
├── config/               # Application configuration
├── theme/                # Design system tokens
└── __tests__/            # Test utilities & mocks
```

### Feature Module Structure

Each feature follows this structure:

```
features/auth/
├── components/           # Feature-specific components
├── hooks/               # Feature-specific hooks
├── services/            # API services
├── store/               # Zustand stores
├── types/               # TypeScript definitions
├── pages/               # Route components
├── __tests__/           # Tests
└── index.ts             # Public API exports
```

## 🛠 Development Workflow

### 1. Starting Development

```bash
npm run dev          # Start development server
npm run test         # Run tests in watch mode
npm run storybook    # Start component documentation (if available)
```

### 2. Code Style & Quality

We enforce code quality through automated tools:

- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for pre-commit checks

```bash
npm run lint         # Check linting issues
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run typecheck    # Check TypeScript types
```

### 3. Testing

We use a comprehensive testing setup:

- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Testing utilities**: Custom helpers in `src/__tests__/`

```bash
npm run test         # Run tests in watch mode
npm run test:ci      # Run tests once (CI mode)
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### 4. Git Workflow

We use **Conventional Commits** for consistent commit messages:

```bash
# Format: type(scope): description
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(api): handle network timeout errors"
git commit -m "docs(readme): update setup instructions"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Pre-commit Hooks:**
- Linting and formatting
- Type checking
- Running tests for changed files

## 🏗 Architecture Patterns

### 1. State Management (Zustand)

We use Zustand for state management with these patterns:

```typescript
// ✅ Good: Small, focused stores
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // Implementation
  },
}));

// ❌ Avoid: Large, monolithic stores
```

### 2. API Layer

All API calls go through our centralized client:

```typescript
// ✅ Good: Use services
const user = await authService.login(credentials);

// ❌ Avoid: Direct API calls from components
const response = await fetch('/api/auth/login');
```

### 3. Component Patterns

```typescript
// ✅ Good: Focused, single-responsibility components
export function LoginForm() {
  const { login } = useAuthStore();
  // Component logic
}

// ❌ Avoid: Large, multi-purpose components
```

### 4. Error Handling

Use our centralized error handling:

```typescript
// ✅ Good: Use error boundaries and utilities
<ErrorBoundary>
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
</ErrorBoundary>

// Service layer error handling
try {
  await authService.login(credentials);
} catch (error) {
  const formatted = ErrorUtils.formatErrorForUser(error);
  toast.error(formatted.message);
}
```

## 🔐 Security Considerations

### Authentication & Authorization

- **Tokens**: Stored securely with automatic refresh
- **RBAC**: Role-based access control with permissions
- **Route Guards**: Protect routes based on authentication/authorization
- **API Security**: All requests include proper authentication headers

### Best Practices

- Never log sensitive information
- Validate all user inputs
- Use TypeScript for type safety
- Follow OWASP security guidelines
- Regular dependency updates

## 🧪 Testing Guidelines

### Writing Tests

1. **Unit Tests**: Test individual functions and hooks
2. **Component Tests**: Test component behavior and user interactions
3. **Integration Tests**: Test feature workflows
4. **API Tests**: Mock API responses with MSW

### Test Structure

```typescript
describe('AuthStore', () => {
  beforeEach(() => {
    // Setup
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password' };
      
      // Act
      await authStore.login(credentials);
      
      // Assert
      expect(authStore.isAuthenticated).toBe(true);
    });
  });
});
```

### Testing Utilities

Use our custom testing utilities:

```typescript
import { render, screen, userEvent, createMockUser } from '@/__tests__/utils';

// Custom render with providers
render(<LoginForm />, {
  initialEntries: ['/login'],
});

// Mock data factories
const mockUser = createMockUser({ role: 'admin' });
```

## 📚 Resources & Documentation

### Internal Documentation

- `docs/ARCHITECTURE.md` - System architecture overview
- `docs/API.md` - API documentation
- `src/guidelines/Guidelines.md` - Coding guidelines
- Component documentation in Storybook

### External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

## 🆘 Getting Help

### Common Issues

1. **Build Errors**: Check TypeScript errors with `npm run typecheck`
2. **Test Failures**: Run `npm run test:debug` for detailed output
3. **Linting Issues**: Use `npm run lint:fix` to auto-fix
4. **Environment Issues**: Verify `.env.local` configuration

### Support Channels

- **Team Chat**: #welliemd-frontend
- **Code Reviews**: GitHub pull requests
- **Documentation**: Internal wiki
- **Architecture Questions**: Tech lead or senior developers

### Debugging Tips

1. **Use the React DevTools** for component debugging
2. **Browser DevTools** for network and performance issues
3. **VS Code Debugger** for stepping through code
4. **Console logging** with our debug utilities

## 🎯 Development Best Practices

### Code Quality

- Write self-documenting code
- Add comments for complex business logic
- Use TypeScript strictly (no `any` types)
- Follow the established patterns
- Write tests for new features

### Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize bundle size with code splitting
- Monitor Core Web Vitals

### Accessibility

- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

### Security

- Validate all inputs
- Sanitize user data
- Use HTTPS in production
- Keep dependencies updated
- Follow security review checklist

## 🚀 Deployment & CI/CD

### Development Process

1. **Feature Branch**: Create from `develop`
2. **Development**: Write code + tests
3. **Code Review**: Submit pull request
4. **Testing**: Automated tests run
5. **Merge**: After approval
6. **Deploy**: Automatic deployment

### Environments

- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live application

### Quality Gates

- All tests must pass
- Code coverage > 80%
- No TypeScript errors
- Linting passes
- Security scan passes
- Performance benchmarks met

---

## ✅ Onboarding Checklist

Copy this checklist for new team members:

### Setup
- [ ] Environment prerequisites installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Tests passing locally

### Access & Accounts
- [ ] GitHub repository access
- [ ] Team communication channels
- [ ] Development environment access
- [ ] Code review permissions
- [ ] Documentation access

### Knowledge
- [ ] Project architecture understood
- [ ] Coding guidelines reviewed
- [ ] Testing approach understood
- [ ] Git workflow familiar
- [ ] Security guidelines reviewed

### First Tasks
- [ ] Complete a small bug fix
- [ ] Write a test for existing code
- [ ] Submit first pull request
- [ ] Participate in code review
- [ ] Deploy to staging environment

### Integration
- [ ] Team introduction complete
- [ ] Mentorship assigned
- [ ] Regular check-ins scheduled
- [ ] Feedback process understood
- [ ] Career development discussed

Welcome to the team! 🎉
