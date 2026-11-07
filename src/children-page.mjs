import {celebrationPage} from './birthday-page.mjs';
import {childrenPartyCopy} from './children-copy.mjs';

export function childrenPartyPage(lang){
  return celebrationPage('event-1',lang,childrenPartyCopy[lang],{
    galleryKeys:['overview_day','pool','covered'],
  });
}
