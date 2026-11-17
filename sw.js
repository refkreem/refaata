/* مقاول Pro — خدمة التطبيق: تسمح بالتثبيت وفتح الواجهة بدون إنترنت. البيانات تبقى سحابية (Firebase). */
var C='moq-shell-v1',SHELL=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);
 if(/firestore|identitytoolkit|securetoken|googleapis\.com\/(?!css)|api\.anthropic/.test(u.href))return;
 if(u.origin===location.origin){/* الواجهة: الشبكة أولًا (لتصل التحديثات) ثم النسخة المخزّنة */
  e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}));return}
 /* مكتبات CDN: المخزّن أولًا */
 e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)})}return res})}))});
