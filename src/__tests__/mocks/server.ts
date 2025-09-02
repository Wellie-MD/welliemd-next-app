import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for Node.js environment (testing)
export const server = setupServer(...handlers);

// Export handlers for individual test customization
export { handlers };
