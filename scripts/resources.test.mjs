import assert from 'node:assert/strict';
import {htmlResourceUrls,cssResourceUrls,localResourcePath,resourcePaths} from './resource-urls.mjs';

const origin='https://example.test/artenergy',prefix='/artenergy';
assert.deepEqual(htmlResourceUrls('<img src="/a.webp" srcset="/a.webp 400w, /b.webp 800w"><video poster="/poster.webp"></video>'),['/a.webp','/poster.webp','/a.webp','/b.webp']);
assert.deepEqual(htmlResourceUrls('<meta property="og:image" content="/share.webp"><meta name="description" content="No asset here">'),['/share.webp']);
assert.deepEqual(cssResourceUrls('@font-face{src:url("/fonts/site.ttf")}div{background:url(/background.webp)}'),['/fonts/site.ttf','/background.webp']);
for(const value of ['/artenergy/a.webp','https://example.test/artenergy/a.webp?size=800#photo','a.webp']){
  assert.equal(localResourcePath(value,origin,prefix),'/a.webp');
}
for(const value of ['#main','https://other.test/a.webp','data:image/svg+xml;base64,AA==','mailto:test@example.test','/another-project/a.webp']){
  assert.equal(localResourcePath(value,origin,prefix),null);
}
assert.equal(localResourcePath('/artenergy/a%20b.webp',origin,prefix),'/a b.webp');
assert.equal(localResourcePath('/a.webp','https://example.test'),'/a.webp');
const refs=resourcePaths([{html:'<a href="/artenergy/menu/#menu-bar">Menu</a><img src="/artenergy/a.webp" srcset="/artenergy/a.webp 1x, /artenergy/b.webp 2x">'}],
  '@font-face{src:url(/artenergy/font.ttf)}',origin,prefix);
assert.deepEqual([...refs],['/menu/','/a.webp','/b.webp','/font.ttf']);
console.log('PASS: root/prefixed asset inventory, srcset, poster, metadata, CSS URLs, external exclusion and URL decoding.');
