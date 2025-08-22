const fs = require('fs');
const path = require('path');

// Function to fix broken import statements
function fixBrokenImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix import statements with empty commas
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    content = content.replace(/import\s*{\s*[^}]*,\s*,+\s*[^}]*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, (match) => {
      // Remove all empty commas from the import statement
      return match.replace(/,\s*,+/g, ',').replace(/,\s*}/g, '}').replace(/{\s*,/g, '{');
    });

    // Fix import statements with only commas
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    
    // Remove trailing commas in import statements
    content = content.replace(/(\w+),\s*}/g, '$1}');
    content = content.replace(/{\s*,/g, '{');
    
    // Clean up multiple consecutive empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed broken imports in: ${filePath}`);
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
console.log('Fixing broken import statements...');
const srcDir = path.join(__dirname, 'src');
const files = findTsFiles(srcDir);

files.forEach(file => {
  fixBrokenImports(file);
});

console.log('Done!');

