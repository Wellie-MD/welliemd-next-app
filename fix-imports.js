#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix Radix UI imports
    const radixPattern = /@radix-ui\/react-([a-z-]+)@[\d\.\-]+/g;
    const newContent = content.replace(radixPattern, (match, component) => {
      modified = true;
      return `@radix-ui/react-${component}`;
    });

    // Fix class-variance-authority imports
    const cvaPattern = /class-variance-authority@[\d\.\-]+/g;
    const finalContent = newContent.replace(cvaPattern, () => {
      modified = true;
      return 'class-variance-authority';
    });

    // Fix lucide-react imports
    const lucidePattern = /lucide-react@[\d\.\-]+/g;
    const finalContent2 = finalContent.replace(lucidePattern, () => {
      modified = true;
      return 'lucide-react';
    });

    if (modified) {
      fs.writeFileSync(filePath, finalContent2);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      fixImportsInFile(fullPath);
    }
  }
}

// Process the UI components directory
const uiDir = path.join(__dirname, 'src', 'components', 'ui');
if (fs.existsSync(uiDir)) {
  console.log('Fixing imports in UI components...');
  processDirectory(uiDir);
  console.log('Done!');
} else {
  console.error('UI components directory not found');
}
