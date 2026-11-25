const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const {posts} = JSON.parse(read('blog/posts.json'));
assert.equal(posts.length,18);
assert.equal(new Set(posts.map(p=>p.image)).size,posts.length,'Each article needs a distinct image');
assert.equal(new Set(posts.map(p=>require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,p.image))).digest('hex'))).size,posts.length,'Article photos must not duplicate image content');
for (const p of posts) assert(/^blog\/images\/[^/]+\.(jpg|png|webp)$/.test(p.image),'Keep article images in blog/images');
assert(read('blog.html').includes('data-journal="listing"'));
assert(read('blog-post.html').includes('noindex'),'Old article address should not be indexed');
assert.equal((read('blog.html').match(/class="journal-card"/g)||[]).length,posts.length,'Listing should link to every article');
assert.deepEqual(fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')&&f!=='blog-shell.html').sort(),posts.map(p=>p.slug+'.html').sort(),'Run npm run build:blog: article pages are out of date');
assert(!read('blog.html').includes('journal-hero'),'Listing should not have a large hero');
const all = ['blog.html','blog-post.html',...posts.map(p=>'blog/'+p.slug+'.html')];
for (const file of all) {
  const html=read(file);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+': expected one h1');
  assert(!html.includes('{{'),file+': unexpanded template');
  assert(!html.includes('Loading&hellip;'),file+': loading placeholder');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,file+': duplicate IDs');
  for(const [,attribute,value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if(/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
    if(value.startsWith('#')) { assert(ids.includes(value.slice(1)),file+': missing anchor '+value); continue; }
    const [target,fragment]=value.split('#');
    const page=target.split('?')[0];
    const local=page.startsWith('/')?path.join(root,page==='/'?'index.html':path.extname(page)?page:page+'.html'):path.resolve(root,path.dirname(file),page);
    assert(fs.existsSync(local),file+': missing '+attribute+' '+value);
    if(fragment && local.endsWith('.html')) assert(fs.readFileSync(local,'utf8').includes('id="'+fragment+'"'),file+': missing target anchor '+value);
  }
  for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
}
for(const p of posts) {
  assert(fs.existsSync(path.join(root,p.image)),p.slug+': missing image');
  assert(fs.existsSync(path.join(root,p.service.href.split('#')[0]+'.html')),p.slug+': missing service');
  assert(p.content.reduce((n,b)=>n+(b.text||(b.items||[]).join(' ')).split(/\s+/).length,0)>=500,p.slug+': too little editorial content');
  for(const b of p.content) for(const [,number] of (b.text||(b.items||[]).join(' ')).matchAll(/\[(\d+)\]/g)) assert(p.sources[number-1],p.slug+': missing citation');
  assert(read('sitemap.xml').includes('/blog/'+p.slug+'<'));
}
console.log('PASS: 18 article pages, listing, images, links, citations and sitemap.');
