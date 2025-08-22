const fs = require('fs');
const path = require('path');

// Function to fix critical syntax errors
function fixCriticalErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix empty icon attributes in JSX
    content = content.replace(/icon=\{\}/g, '');
    content = content.replace(/icon=\{\s*\}/g, '');
    
    // Fix empty icon values in object literals
    content = content.replace(/icon:\s*,/g, 'icon: undefined,');
    content = content.replace(/icon:\s*}/g, 'icon: undefined}');
    
    // Fix broken TypeScript generic syntax
    content = content.replace(/Omit<,\s*'([^']+)'/g, "Omit<any, '$1'");
    
    // Remove empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    
    // Clean up multiple consecutive empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed critical errors in: ${filePath}`);
      modified = true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to find all TypeScript/React files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('Fixing critical syntax errors...');
const srcDir = path.join(__dirname, 'src');
const files = findTsFiles(srcDir);

files.forEach(file => {
  fixCriticalErrors(file);
});

console.log('Done!');

