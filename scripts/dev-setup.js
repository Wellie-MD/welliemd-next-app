#!/usr/bin/env node

/**
 * Development setup script
 * Helps new developers set up their environment quickly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_NODE_VERSION = '18.0.0';
const REQUIRED_NPM_VERSION = '9.0.0';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

function checkNodeVersion() {
  try {
    const nodeVersion = process.version.slice(1); // Remove 'v' prefix
    const [major] = nodeVersion.split('.');
    const requiredMajor = REQUIRED_NODE_VERSION.split('.')[0];
    
    if (parseInt(major) >= parseInt(requiredMajor)) {
      success(`Node.js version: ${nodeVersion}`);
      return true;
    } else {
      error(`Node.js version ${nodeVersion} is too old. Required: ${REQUIRED_NODE_VERSION}+`);
      return false;
    }
  } catch (err) {
    error('Failed to check Node.js version');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const [major] = npmVersion.split('.');
    const requiredMajor = REQUIRED_NPM_VERSION.split('.')[0];
    
    if (parseInt(major) >= parseInt(requiredMajor)) {
      success(`npm version: ${npmVersion}`);
      return true;
    } else {
      warning(`npm version ${npmVersion} is old. Recommended: ${REQUIRED_NPM_VERSION}+`);
      info('Consider upgrading with: npm install -g npm@latest');
      return true; // Not critical, just a warning
    }
  } catch (err) {
    error('Failed to check npm version');
    return false;
  }
}

function checkGitConfig() {
  try {
    const userName = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const userEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
    
    if (userName && userEmail) {
      success(`Git configured: ${userName} <${userEmail}>`);
      return true;
    } else {
      warning('Git user name or email not configured');
      info('Set up with: git config --global user.name "Your Name"');
      info('             git config --global user.email "your.email@example.com"');
      return false;
    }
  } catch (err) {
    warning('Git not configured or not available');
    return false;
  }
}

function createEnvFile() {
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envExamplePath)) {
    warning('env.example file not found');
    return false;
  }
  
  if (fs.existsSync(envLocalPath)) {
    info('.env.local already exists');
    return true;
  }
  
  try {
    fs.copyFileSync(envExamplePath, envLocalPath);
    success('Created .env.local from env.example');
    warning('Please update .env.local with your actual configuration values');
    return true;
  } catch (err) {
    error('Failed to create .env.local file');
    return false;
  }
}

function installDependencies() {
  header('Installing Dependencies');
  
  try {
    info('Installing npm dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    success('Dependencies installed successfully');
    return true;
  } catch (err) {
    error('Failed to install dependencies');
    return false;
  }
}

function setupHusky() {
  try {
    info('Setting up Git hooks with Husky...');
    execSync('npm run prepare', { stdio: 'inherit' });
    success('Git hooks configured');
    return true;
  } catch (err) {
    warning('Failed to setup Git hooks (this is optional)');
    return true; // Not critical
  }
}

function runInitialChecks() {
  header('Running Initial Checks');
  
  try {
    info('Running TypeScript type check...');
    execSync('npm run typecheck', { stdio: 'inherit' });
    success('TypeScript check passed');
  } catch (err) {
    warning('TypeScript check failed - you may need to fix type errors');
  }
  
  try {
    info('Running linter...');
    execSync('npm run lint', { stdio: 'inherit' });
    success('Linting passed');
  } catch (err) {
    warning('Linting failed - you may need to fix code style issues');
    info('Run "npm run lint:fix" to auto-fix some issues');
  }
  
  try {
    info('Running tests...');
    execSync('npm run test -- --run', { stdio: 'inherit' });
    success('Tests passed');
  } catch (err) {
    warning('Some tests failed - this might be expected for a new setup');
  }
}

function printSuccessMessage() {
  header('🎉 Setup Complete!');
  
  log('Your development environment is ready. Here are the next steps:\n');
  
  log('📁 Project Structure:', colors.bright);
  log('  src/features/     - Feature modules (auth, patients, etc.)');
  log('  src/components/   - Shared UI components');
  log('  src/shared/       - Shared utilities and services');
  log('  src/config/       - Configuration files');
  log('  src/__tests__/    - Test utilities and mocks\n');
  
  log('🚀 Available Scripts:', colors.bright);
  log('  npm run dev       - Start development server');
  log('  npm run build     - Build for production');
  log('  npm run test      - Run tests in watch mode');
  log('  npm run test:ui   - Run tests with UI');
  log('  npm run lint      - Check code style');
  log('  npm run lint:fix  - Fix code style issues');
  log('  npm run typecheck - Check TypeScript types\n');
  
  log('📚 Documentation:', colors.bright);
  log('  README.md         - Project overview and setup');
  log('  src/guidelines/   - Development guidelines');
  log('  docs/             - Architecture documentation\n');
  
  log('🔧 Development Tips:', colors.bright);
  log('  - Use absolute imports: @/components, @/features, etc.');
  log('  - Follow the feature-first folder structure');
  log('  - Write tests for new features');
  log('  - Use conventional commits for git messages');
  log('  - Check the guidelines folder for coding standards\n');
  
  log('To start developing:', colors.green);
  log('  npm run dev\n');
}

function printErrorMessage() {
  header('❌ Setup Failed');
  
  log('Some setup steps failed. Please check the errors above and:', colors.red);
  log('1. Ensure you have the required Node.js and npm versions');
  log('2. Make sure you have internet connectivity for package installation');
  log('3. Check that you have proper permissions in this directory');
  log('4. Try running the setup script again\n');
  
  log('If problems persist, please check the README.md or ask for help.\n');
}

async function main() {
  header('🏥 WellieMD Patient Portal - Development Setup');
  
  log('This script will set up your development environment.\n');
  
  // Check prerequisites
  header('Checking Prerequisites');
  const nodeOk = checkNodeVersion();
  const npmOk = checkNpmVersion();
  const gitOk = checkGitConfig();
  
  if (!nodeOk || !npmOk) {
    printErrorMessage();
    process.exit(1);
  }
  
  // Environment setup
  header('Setting Up Environment');
  const envOk = createEnvFile();
  
  // Install dependencies
  const depsOk = installDependencies();
  if (!depsOk) {
    printErrorMessage();
    process.exit(1);
  }
  
  // Setup Git hooks
  setupHusky();
  
  // Run initial checks
  runInitialChecks();
  
  // Success message
  printSuccessMessage();
}

// Run the setup
main().catch((err) => {
  error('Setup script failed with error:');
  console.error(err);
  process.exit(1);
});
