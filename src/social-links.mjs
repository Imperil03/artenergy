import {socials} from './socials.mjs';
import {esc} from './components.mjs';

const platforms={
  instagram:{label:'Instagram',shape:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>'},
  tiktok:{label:'TikTok',shape:'<path d="M14 3v12a5 5 0 1 1-5-5m5-7c0 4 3 6 6 6"/>'},
  youtube:{label:'YouTube',shape:'<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>'},
  telegram:{label:'Telegram',shape:'<path d="m3 11 18-7-4 17-6-5-4 3 1-6 9-6-11 5Z"/>'},
  facebook:{label:'Facebook',shape:'<path d="M15 3h-3a4 4 0 0 0-4 4v4H5v4h3v6h4v-6h3l1-4h-4V7h3Z"/>'},
};

export const socialLabel=lang=>({ru:'Социальные сети',en:'Social media',es:'Redes sociales'}[lang]);

export function configuredSocialLinks(){
  return Object.entries(socials).filter(([key,url])=>{
    if(!platforms[key]||typeof url!=='string'||!url.trim())return false;
    try{return ['https:','http:'].includes(new URL(url).protocol);}catch{return false;}
  });
}

export function socialLinks(lang){
  const links=configuredSocialLinks();
  if(!links.length)return '';
  const label=socialLabel(lang);
  return `<nav class="social-links" aria-label="${esc(label)}">${links.map(([key,url])=>`<a class="social-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${platforms[key].shape}</svg><span>${esc(platforms[key].label)}</span></a>`).join('')}</nav>`;
}
