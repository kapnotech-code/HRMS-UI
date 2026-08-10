import { Routes, Route } from '@angular/router';

export interface RouteOption {
  name: string;
  url: string;
}

// Route se ek readable "name" banata hai path ke aakhri segment se
// jaise 'masters/department' -> 'Department'
function humanizeRouteName(path: string): string {
  const segments = path.split('/').filter(s => s && !s.startsWith(':'));
  const last = segments[segments.length - 1] || path;
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Routes array ko recursively flatten karta hai (children bhi include karega)
export function extractRouteOptions(
  routes: Routes,
  excludePaths: string[] = ['login', '', '**'],
  parentPath = ''
): RouteOption[] {
  let options: RouteOption[] = [];

  for (const route of routes) {
    const path = route.path ?? '';

    if (excludePaths.includes(path)) {
      // Login/redirect/wildcard routes skip karo, lekin agar children hain (layout wrapper)
      // to unke andar zaroor jaao
      if (route.children && route.children.length) {
        options = options.concat(extractRouteOptions(route.children, excludePaths, parentPath));
      }
      continue;
    }

    const fullPath = parentPath ? `${parentPath}/${path}` : path;

    // Param wale routes skip karo (jaise :id), kyunki wo dropdown mein select karne layak nahi
    if (route.component && !fullPath.includes(':')) {
      options.push({
        name: humanizeRouteName(fullPath),
        url: `/${fullPath}`
      });
    }

    if (route.children && route.children.length) {
      options = options.concat(extractRouteOptions(route.children, excludePaths, fullPath));
    }
  }

  return options;
}
