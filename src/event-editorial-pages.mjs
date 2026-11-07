import {celebrationPage} from './birthday-page.mjs';
import {familyEventCopy} from './family-event-copy.mjs';
import {socialEventCopy} from './social-event-copy.mjs';

export const editorialEventKeys=['event-2','event-3','event-4','event-6'];
export const approvedEventCopy={...familyEventCopy,...socialEventCopy};

const media={
  'event-2':{galleryKeys:['overview_day','cabana','bar'],planImage:'covered'},
  'event-3':{galleryKeys:['pool','covered','overview_day']},
  'event-4':{galleryKeys:['overview_day','bar','organizers'],planImage:'covered'},
  'event-6':{galleryKeys:['pool_night','drink','terrace_night'],planImage:'cabana',foodImage:'bar'},
};

export function editorialEventPage(key,lang){
  const copy=approvedEventCopy[key]?.[lang];
  if(!copy)throw new Error('Missing approved event copy: '+key+'/'+lang);
  return celebrationPage(key,lang,copy,media[key]);
}
