const fs = require('fs');
const path = require('path');

// Function to completely fix import statements
function fixAllImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove all problematic import statements from lucide-react
    content = content.replace(/import\s*{[^}]*}\s*from\s*['"]lucide-react['"];?\s*\n?/g, '');
    
    // Remove empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    
    // Remove import statements with only commas
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    
    // Clean up multiple consecutive empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove leading empty lines
    content = content.replace(/^\s*\n+/, '');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed all imports in: ${filePath}`);
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
console.log('Fixing all import statements...');
const srcDir = path.join(__dirname, 'src');
const files = findTsFiles(srcDir);

files.forEach(file => {
  fixAllImports(file);
});

console.log('Done!');

