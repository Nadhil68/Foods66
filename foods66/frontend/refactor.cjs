const fs = require('fs');
const path = require('path');

const traverse = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', 'dist', 'contexts'].includes(file)) {
        traverse(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;

      // Replace imports
      content = content.replace(/import\s*\{\s*useAuth\s*\}\s*from\s*['"]\.\.?\/(contexts\/AuthContext|contexts\/AppContext|contexts\/CartContext|contexts\/NotificationContext)['"];?/g, "import { useAuthStore } from '../store/useStore';");
      content = content.replace(/import\s*\{\s*useAppContext\s*\}\s*from\s*['"]\.\.?\/(contexts\/AuthContext|contexts\/AppContext|contexts\/CartContext|contexts\/NotificationContext)['"];?/g, "import { useAppStore } from '../store/useStore';");
      content = content.replace(/import\s*\{\s*useCart\s*\}\s*from\s*['"]\.\.?\/(contexts\/AuthContext|contexts\/AppContext|contexts\/CartContext|contexts\/NotificationContext)['"];?/g, "import { useCartStore } from '../store/useStore';");
      content = content.replace(/import\s*\{\s*useNotifications\s*\}\s*from\s*['"]\.\.?\/(contexts\/AuthContext|contexts\/AppContext|contexts\/CartContext|contexts\/NotificationContext)['"];?/g, "import { useNotificationStore } from '../store/useStore';");
      
      content = content.replace(/import\s*\{\s*(useAuth|useAppContext|useCart|useNotifications)(?:\s*,\s*(useAuth|useAppContext|useCart|useNotifications))*\s*\}\s*from\s*['"]\.\.?\/contexts\/.*?['"];?/g, (match) => {
          let imports = [];
          if (match.includes('useAuth')) imports.push('useAuthStore');
          if (match.includes('useAppContext')) imports.push('useAppStore');
          if (match.includes('useCart')) imports.push('useCartStore');
          if (match.includes('useNotifications')) imports.push('useNotificationStore');
          // For simplicity, we just import them all from useStore
          return `import { ${imports.join(', ')} } from '../store/useStore';`;
      });
      
      // Some might still be missed if imported in a single line like import { useAuth, useCart } from '../contexts/something'
      // We'll replace the generic one
      content = content.replace(/import\s*\{([^}]+)\}\s*from\s*['"](?:\.\.\/|\.\/)contexts\/[^'"]+['"];?/g, (match, p1) => {
          let newImports = [];
          if (p1.includes('useAuth')) newImports.push('useAuthStore');
          if (p1.includes('useAppContext')) newImports.push('useAppStore');
          if (p1.includes('useCart')) newImports.push('useCartStore');
          if (p1.includes('useNotifications')) newImports.push('useNotificationStore');
          if (newImports.length > 0) {
              const dots = fullPath.includes('pages\\') || fullPath.includes('components\\') || fullPath.includes('tests\\') ? '../' : './';
              return `import { ${newImports.join(', ')} } from '${dots}store/useStore';`;
          }
          return '';
      });

      // Providers removal in App.tsx
      if (fullPath.endsWith('App.tsx')) {
        content = content.replace(/import\s*\{[^}]*Provider[^}]*\}\s*from\s*['"]\.\/contexts\/[^'"]+['"];?\n/g, '');
        content = content.replace(/<([A-Za-z]+Provider)>/g, '');
        content = content.replace(/<\/([A-Za-z]+Provider)>/g, '');
      }

      // Replace hooks
      content = content.replace(/useAuth\(\)/g, "useAuthStore()");
      content = content.replace(/useAppContext\(\)/g, "useAppStore()");
      content = content.replace(/useCart\(\)/g, "useCartStore()");
      content = content.replace(/useNotifications\(\)/g, "useNotificationStore()");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
};

traverse(path.join(__dirname));
console.log("Done");
