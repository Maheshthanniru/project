const fs = require('fs');
const path = require('path');

// Common unused imports to remove
const unusedImports = [
  'Calendar', 'Search', 'Filter', 'Download', 'Building', 'User', 'DollarSign',
  'ChevronDown', 'ChevronUp', 'Settings', 'ArrowUpDown', 'TrendingUp', 'TrendingDown',
  'BarChart3', 'Check', 'CheckCircle', 'AlertCircle', 'Clock', 'Users', 'PieChart',
  'FileText', 'Eye', 'Input', 'Select', 'Printer', 'Trash2', 'RefreshCw', 'CheckSquare',
  'Square', 'AlertTriangle', 'Phone', 'MapPin', 'Save', 'Plus', 'Calculator', 'Wifi',
  'WifiOff', 'X', 'ChevronLeft', 'ChevronRight', 'FileDown', 'jsPDF'
];

// Function to remove unused imports from a file
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove unused imports from lucide-react
    unusedImports.forEach(importName => {
      const importRegex = new RegExp(`\\b${importName}\\b(?=\\s*,|\\s*})`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, '');
        modified = true;
      }
    });

    // Clean up empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
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
console.log('Fixing ESLint issues...');
const srcDir = path.join(__dirname, 'src');
const files = findTsFiles(srcDir);

files.forEach(file => {
  removeUnusedImports(file);
});

console.log('Done!');

