// Shared URL inventory for the build and release checks. No HTML is rewritten.
export function htmlResourceUrls(html){
  const urls=[];
  for(const match of html.matchAll(/\b(?:href|src|poster|data-desktop-src|data-mobile-src)="([^"]+)"/g))urls.push(match[1]);
  for(const match of html.matchAll(/\bsrcset="([^"]+)"/g)){
    for(const candidate of match[1].split(','))urls.push(candidate.trim().split(/\s+/)[0]);
  }
  for(const match of html.matchAll(/<meta\b[^>]*>/g)){
    if(/(?:property|name)="(?:og:image|twitter:image)"/.test(match[0])){
      const content=match[0].match(/\bcontent="([^"]+)"/);if(content)urls.push(content[1]);
    }
  }
  return urls;
}

export function cssResourceUrls(css){
  return Array.from(css.matchAll(/url\(\s*(["']?)([^\)"']+)\1\s*\)/g),match=>match[2].trim());
}

export function localResourcePath(raw,origin,basePath=''){
  if(!raw||raw.startsWith('#'))return null;
  const url=new URL(raw.replaceAll('&amp;','&'),origin+'/');
  if(url.origin!==new URL(origin).origin)return null;
  const pathname=decodeURIComponent(url.pathname);
  if(basePath&&pathname!==basePath&&!pathname.startsWith(basePath+'/'))return null;
  return pathname.slice(basePath.length)||'/';
}

export function resourcePaths(pages,css,origin,basePath=''){
  return new Set([...pages.flatMap(page=>htmlResourceUrls(page.html)),...cssResourceUrls(css)]
    .map(raw=>localResourcePath(raw,origin,basePath)).filter(Boolean));
}
