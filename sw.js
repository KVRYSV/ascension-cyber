/* ASCENSION service worker — offline cache. Bump VERSION on each deploy. */
const VERSION = "ascension-v10.0.0";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      c.addAll(CORE).then(() =>
        /* large optional asset: cache if present, never fail the install */
        c.add("./hamr-audio.mp3").catch(() => {})
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // navigations: cache-first on index.html so the app always opens offline
  if (req.mode === "navigate") {
    // only the app itself is served cache-first; any other page (e.g. a test build) goes to the network first
    const isApp = /\/(index\.html)?$/.test(new URL(req.url).pathname);
    if (isApp) {
      e.respondWith(
        caches.match("./index.html").then((cached) =>
          cached || fetch(req).catch(() => caches.match("./index.html"))
        )
      );
    } else {
      e.respondWith(
        fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); }
          return res;
        }).catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
      );
    }
    return;
  }

  // ranged requests (the pacer seeking inside hamr-audio.mp3): build a 206 from the cached copy;
  // if nothing is cached, go straight to the network and never cache the partial response
  const range = req.headers.get("range");
  if (range) {
    e.respondWith(
      caches.match(req).then((cached) => cached ? rangeResponse(cached, range) : fetch(req))
    );
    return;
  }

  // everything else: cache-first, then network (and cache the result; only full 200s, never 206/opaque)
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // never store the worker script itself (the browser fetches it fresh for update checks)
        if (res && res.status === 200 && res.type === "basic" && !/\/sw\.js$/.test(new URL(req.url).pathname)) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

/* serve "Range: bytes=start-end" / "bytes=start-" / "bytes=-suffix" out of a full cached response */
function rangeResponse(cached, range) {
  return cached.blob().then((blob) => {
    const size = blob.size;
    const type = cached.headers.get("Content-Type") || "audio/mpeg";
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) {                 // multi-range / malformed: ignore Range, send the whole file
      return new Response(blob, { status: 200, statusText: "OK",
        headers: { "Content-Type": type, "Content-Length": String(size), "Accept-Ranges": "bytes" } });
    }
    let start, end;
    if (m[1] === "") {                                         // suffix: last N bytes
      start = Math.max(size - Number(m[2]), 0);
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (start >= size || start > end) {
      return new Response(null, {
        status: 416,
        statusText: "Range Not Satisfiable",
        headers: { "Content-Range": "bytes */" + size }
      });
    }
    return new Response(blob.slice(start, end + 1, type), {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "Content-Type": type,
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes"
      }
    });
  });
}


/* ---------- reminders: play the dated plan the app leaves in IndexedDB ---------- */
function planRead(){ return new Promise(res=>{ try{
  const r=indexedDB.open("ascension-notif",1);
  r.onupgradeneeded=()=>{ try{ r.result.createObjectStore("kv"); }catch(e){} };
  r.onsuccess=()=>{ try{ const db=r.result, g=db.transaction("kv","readonly").objectStore("kv").get("plan");
    g.onsuccess=()=>{ try{db.close();}catch(e){} res(g.result||null); }; g.onerror=()=>res(null);
  }catch(e){ res(null); } };
  r.onerror=()=>res(null); }catch(e){ res(null); } }); }
function planWrite(v){ return new Promise(res=>{ try{
  const r=indexedDB.open("ascension-notif",1);
  r.onupgradeneeded=()=>{ try{ r.result.createObjectStore("kv"); }catch(e){} };
  r.onsuccess=()=>{ try{ const db=r.result, tx=db.transaction("kv","readwrite");
    tx.objectStore("kv").put(v,"plan"); tx.oncomplete=()=>{ try{db.close();}catch(e){} res(true); }; tx.onerror=()=>res(false);
  }catch(e){ res(false); } };
  r.onerror=()=>res(false); }catch(e){ res(false); } }); }
function localDay(){ const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
async function playPlan(){
  const p=await planRead();
  if(!p||!p.on||!Array.isArray(p.items)) return;
  const today=localDay();
  p.shown=p.shown||{};
  const due=p.items.filter(it=>it.d===today && !p.shown[it.tag+":"+it.d]).sort((a,b)=>(a.pri||9)-(b.pri||9));
  if(!due.length) return;
  const it=due[0];
  p.shown[it.tag+":"+it.d]=1;
  for(const k in p.shown){ if(k.split(":")[1] < today) delete p.shown[k]; }   /* forget old marks */
  await planWrite(p);
  await self.registration.showNotification("ASCENSION",{ body:it.body, tag:it.tag,
    icon:"./icons/icon-192.png", badge:"./icons/icon-192.png", data:{url:"./"} });
}
self.addEventListener("periodicsync",(e)=>{ if(e.tag==="ascension-check") e.waitUntil(playPlan()); });
self.addEventListener("sync",(e)=>{ if(e.tag==="ascension-check") e.waitUntil(playPlan()); });
self.addEventListener("push",(e)=>{ e.waitUntil(playPlan()); });          /* ready for a server later */
self.addEventListener("notificationclick",(e)=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||"./";
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list){ if("focus" in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
