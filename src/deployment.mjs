const target=new URL(process.env.SITE_URL||'https://artenergy.do');
if(!['http:','https:'].includes(target.protocol)||target.search||target.hash)throw new Error('SITE_URL must be an HTTP(S) site root without a query or fragment');

export const origin=target.href.replace(/\/+$/,'');
export const basePath=target.pathname.replace(/\/+$/,'');
export const noIndex=process.env.SITE_NOINDEX==='1';

export function publishHtml(html){
  if(basePath){
    html=html.replace(/\b(href|src|poster|data-desktop-src|data-mobile-src)="\/(?!\/)/g,(_,attribute)=>`${attribute}="${basePath}/`);
    html=html.replace(/\bsrcset="([^"]+)"/g,(_,value)=>`srcset="${value.split(',').map(candidate=>candidate.trim().replace(/^\/(?!\/)/,basePath+'/')).join(', ')}"`);
  }
  if(noIndex&&!html.includes('<meta name="robots"'))html=html.replace('</head>','<meta name="robots" content="noindex, nofollow"></head>');
  return html;
}

export function publishCss(css){
  return basePath?css.replace(/url\((["']?)\/(?!\/)/g,(_,quote)=>`url(${quote}${basePath}/`):css;
}
