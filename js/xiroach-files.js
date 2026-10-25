/* XIROACH FILES — 3D-сцена на прокрутке (three.js r128).
   Требует: /js/vendor/three.min.js, /js/vendor/GLTFLoader.js, разметку из /pages/xiroach-files.html */
(function () {
  'use strict';

  /* ============================================================
     НАСТРОЙКИ
     ============================================================ */
  var MODEL_URL   = '/assets/models/xiroach-files.glb';
  var SHADOW_SIZE = 2048;   /* качество теней: 1024 / 2048 / 4096 (тени считаются один раз) */
  var MAX_DPR     = 2;      /* потолок плотности пикселей на десктопе; на телефонах 1.5 */

  /* Ссылки на объекты: ключ = имя объекта в Blender (видно при #debug).
     Если url пустой, клик только двигает камеру. */
  var LINKS = {
    /* 'Plane': { title: 'Back wall', url: 'https://example.com' }, */
  };

  /* Подписи объектов при клике */
  var NAMES = {
    'Sketchfab_model':     'Filing cabinet with folder',
    'Sketchfab_model.002': 'Filing cabinet',
    'Sketchfab_model.001': 'Grey aliens',
    'alex':                'Green chrome figure',
    'alex.001':            'Green chrome figure',
    'gloria':              'Pink chrome figure',
    'grandma':             'Grandma',
    'monkey':              'Monkey',
    'monkey.001':          'Monkey',
    'Plane':               'Back wall poster',
    'Plane.001':           'Right wall poster',
    'Plane.002':           'Right wall poster',
    'Plane.003':           'Sheet on the cabinet',
    'Plane.004':           'Sheet on the cabinet',
    'Plane.005':           'Sheet on the cabinet',
    'Text':                'Folder label',
    'Text.001':            'Folder label',
    'Curve':               'Spider logo on the floor',
    'Curve.001':           'Green logo'
  };

  /* ============================================================
     DOM
     ============================================================ */
  var header = document.querySelector('header');
  var tour   = document.getElementById('tour');
  var stage  = document.getElementById('stage');
  var canvas = document.getElementById('c');
  var msg    = document.getElementById('msg');
  var bar    = document.querySelector('#bar i');
  var hint   = document.getElementById('hint');
  var caps   = [].slice.call(document.querySelectorAll('.cap'));
  var backBtn = document.getElementById('back');
  var info   = document.getElementById('info');
  var nmEl   = document.getElementById('nm');
  var goEl   = document.getElementById('go');
  var debug  = (location.hash === '#debug');

  /* высота шапки нужна для sticky-сцены (шапка переносится на телефонах) */
  function setHeaderVar() {
    document.documentElement.style.setProperty('--hdr', header.offsetHeight + 'px');
  }
  setHeaderVar();
  if (window.ResizeObserver) new ResizeObserver(setHeaderVar).observe(header);

  function fail(t) { msg.textContent = t; msg.classList.remove('hide'); }
  if (!window.THREE || !THREE.GLTFLoader) { fail('could not load 3D library'); return; }

  /* ============================================================
     RENDERER / SCENE
     ============================================================ */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { fail('WebGL is not available on this device'); return; }

  var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  function dpr() { return Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : MAX_DPR); }

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;   /* сцена статична: тени считаем один раз после загрузки */

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b0b);
  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);

  /* процедурное окружение, чтобы хром было что отражать */
  (function () {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#9a949e');
    gr.addColorStop(0.55, '#6e6874'); gr.addColorStop(1, '#e0cc00');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#111';
    for (var y = 0; y < 4; y++) for (var x = 0; x < 16; x++) if ((x + y) % 2) g.fillRect(x * 64, y * 32, 64, 32);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
  })();

  /* свет: один жёсткий направленный (чёткие тени) + слабая подсветка */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b800, 0.28));
  var sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.position.set(7, 20, 14);
  sun.target.position.set(2, 0, 4);
  sun.castShadow = true;
  var smap = Math.min(SHADOW_SIZE, renderer.capabilities.maxTextureSize || 2048);
  sun.shadow.mapSize.set(smap, smap);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  /* плотно подгоняем карту теней под комнату */
  (function () {
    var m = new THREE.Matrix4().lookAt(sun.position, sun.target.position, new THREE.Vector3(0, 1, 0));
    var e = m.elements, X = new THREE.Vector3(e[0], e[1], e[2]), Y = new THREE.Vector3(e[4], e[5], e[6]), Z = new THREE.Vector3(e[8], e[9], e[10]);
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], r = new THREE.Vector3();
    [-9, 14.3].forEach(function (x) { [-0.5, 11].forEach(function (y) { [-9.6, 18.2].forEach(function (z) {
      r.set(x, y, z).sub(sun.position);
      var l = [r.dot(X), r.dot(Y), r.dot(Z)];
      for (var i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], l[i]); mx[i] = Math.max(mx[i], l[i]); }
    }); }); });
    var c = sun.shadow.camera;
    c.left = mn[0] - 0.5; c.right = mx[0] + 0.5; c.bottom = mn[1] - 0.5; c.top = mx[1] + 0.5;
    c.near = Math.max(0.5, -mx[2] - 1); c.far = -mn[2] + 1;
    c.updateProjectionMatrix();
  })();
  var fill = new THREE.PointLight(0xbfd0ff, 0.22, 60); fill.position.set(-6, 9, 2); scene.add(fill);

  /* ============================================================
     ПУТЬ КАМЕРЫ
     ============================================================ */
  function V(a) { return new THREE.Vector3(a[0], a[1], a[2]); }
  var camPts = [[2.7,3.7,16],[10.7,2.3,12],[9.6,4.7,2.2],[8.2,9.3,-6.1],[-2.7,7.5,-1.4],[-3.6,8.3,-1.3],[-5.8,6.4,6.0],[-2.3,5.8,4.3],[-1.5,2.4,16.2],[1,9.3,9]].map(V);
  var tgtPts = [[2,4,4],[0,4,4],[-1,4,3],[-1,3.5,4],[0,3.5,4],[3,3.5,5],[-5.3,4.3,3.6],[3,4,5],[3,3,3],[1,0.5,4]].map(V);
  var camCurve = new THREE.CatmullRomCurve3(camPts, false, 'catmullrom', 0.5);
  var tgtCurve = new THREE.CatmullRomCurve3(tgtPts, false, 'catmullrom', 0.5);

  var ROOM_CENTER = new THREE.Vector3(2.5, 4.5, 4.3);
  var MINB = new THREE.Vector3(-8, 0.7, -8.6), MAXB = new THREE.Vector3(13.3, 10, 17);

  var target = 0, cur = 0, mx = 0, my = 0;
  var ready = false, world = null, visible = true, needsRender = true;
  var focus = null, focusScroll = 0;
  var camPos = camPts[0].clone(), camLook = tgtPts[0].clone();
  var tmpT = new THREE.Vector3(), tmpP = new THREE.Vector3();
  var lastP = new THREE.Vector3(1e9, 0, 0), lastL = new THREE.Vector3(1e9, 0, 0);

  /* ============================================================
     ПРОКРУТКА / РАЗМЕР
     ============================================================ */
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function onScroll() {
    var range = tour.offsetHeight - stage.offsetHeight;
    var top = tour.getBoundingClientRect().top;
    target = range > 0 ? clamp01((header.offsetHeight - top) / range) : 0;
    if (focus && Math.abs(window.scrollY - focusScroll) > 4) clearFocus();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', function (e) {
    mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 78 : 60;
    camera.updateProjectionMatrix();
    needsRender = true;
    onScroll();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);
  resize();

  /* не рисуем, пока сцена за пределами экрана (пользователь читает детали альбома) */
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) needsRender = true;
    }).observe(stage);
  }

  /* ============================================================
     КЛИКИ: камера летит к объекту
     ============================================================ */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), box = new THREE.Box3();
  function rootOf(o) { while (o && o.parent && o.parent !== world) o = o.parent; return o; }
  function nameOf(root) { return (root.userData && root.userData.name) || root.name || 'object'; }

  function pick(cx, cy) {
    if (!world) return null;
    var r = canvas.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObject(world, true);
    for (var i = 0; i < hits.length; i++) {
      if (nameOf(rootOf(hits[i].object)) !== 'Cube') return hits[i];   /* стены, пол, потолок некликабельны */
    }
    return null;
  }
  function clampV(v) {
    v.x = Math.min(MAXB.x, Math.max(MINB.x, v.x));
    v.y = Math.min(MAXB.y, Math.max(MINB.y, v.y));
    v.z = Math.min(MAXB.z, Math.max(MINB.z, v.z));
    return v;
  }
  function safeUrl(u) { return (typeof u === 'string' && /^(https?:\/\/|mailto:)/i.test(u.trim())) ? u.trim() : ''; }

  var meshBoxes = [];   /* боксы всех мешей, чтобы камера не залетала в предметы */
  var YAXIS = new THREE.Vector3(0, 1, 0);
  function inRoom(p) { return p.x >= MINB.x && p.x <= MAXB.x && p.y >= MINB.y && p.y <= MAXB.y && p.z >= MINB.z && p.z <= MAXB.z; }
  function within(o, anc) { while (o) { if (o === anc) return true; o = o.parent; } return false; }
  /* что кадрировать: поднимаемся от меша вверх, пока группа остаётся «размером с предмет» */
  function unitOf(o) {
    var u = o, b = new THREE.Box3(), s = new THREE.Vector3();
    while (u.parent && u.parent !== world) {
      b.setFromObject(u.parent); b.getSize(s);
      if (Math.max(s.x, s.y, s.z) > 7.5) break;
      u = u.parent;
    }
    return u;
  }

  function focusOn(hit) {
    var root = rootOf(hit.object), nm = nameOf(root);
    if (nm === 'Cube') return;
    var unit = unitOf(hit.object);
    box.setFromObject(unit);
    var c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    var m = Math.max(sz.x, sz.y, sz.z, 1.5);
    var dir = new THREE.Vector3().subVectors(ROOM_CENTER, c); dir.y = 0;
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
    dir.normalize();
    var base = Math.min(8, Math.max(3.5, m * 1.5)), best = null, bestScore = 1e9;
    var angs = [0, 35, -35, 70, -70, 105, -105, 140, -140, 180], dists = [1, 0.8, 0.65, 1.25];
    for (var a = 0; a < angs.length; a++) {
      for (var d = 0; d < dists.length; d++) {
        var v = dir.clone().applyAxisAngle(YAXIS, angs[a] * Math.PI / 180);
        var p = c.clone().addScaledVector(v, base * dists[d]);
        p.y = Math.min(MAXB.y, Math.max(MINB.y, c.y + 0.8));
        if (!inRoom(p)) continue;
        var score = Math.abs(angs[a]) / 180 * 2 + Math.abs(dists[d] - 1);
        for (var b = 0; b < meshBoxes.length; b++) {
          var mb = meshBoxes[b];
          if (within(mb.mesh, unit)) continue;
          if (mb.box.distanceToPoint(p) < 0.5) score += 10;
        }
        if (score < bestScore) { bestScore = score; best = p; }
      }
    }
    if (!best) best = clampV(c.clone().addScaledVector(dir, Math.min(base, 6)));
    var L = LINKS[nm] || {};
    var label = L.title || NAMES[nm] || nm, url = safeUrl(L.url);
    if (debug) label += '  [' + nm + ']';
    focus = { pos: best, look: c };
    focusScroll = window.scrollY;
    needsRender = true;
    backBtn.classList.add('show');
    nmEl.textContent = label; info.classList.add('show');
    if (url) { goEl.href = url; goEl.classList.add('show'); }
    else { goEl.classList.remove('show'); goEl.removeAttribute('href'); }
  }
  function clearFocus() {
    focus = null; needsRender = true;
    backBtn.classList.remove('show'); info.classList.remove('show'); goEl.classList.remove('show');
  }
  backBtn.addEventListener('click', clearFocus);
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') clearFocus(); });

  var down = null;
  canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', function (e) {
    if (!down || !ready) { down = null; return; }
    var dx = e.clientX - down.x, dy = e.clientY - down.y, quick = performance.now() - down.t < 500;
    down = null;
    if (dx * dx + dy * dy < 64 && quick) { var h = pick(e.clientX, e.clientY); if (h) focusOn(h); }
  });
  var hoverBusy = false;
  canvas.addEventListener('pointermove', function (e) {
    if (!ready || hoverBusy || e.pointerType === 'touch') return;
    hoverBusy = true;
    var x = e.clientX, y = e.clientY;
    setTimeout(function () {
      var h = pick(x, y);
      canvas.style.cursor = (h && nameOf(rootOf(h.object)) !== 'Cube') ? 'pointer' : 'default';
      hoverBusy = false;
    }, 60);
  });

  /* ============================================================
     ЦИКЛ: рисуем только если камера реально сдвинулась
     ============================================================ */
  function frame() {
    requestAnimationFrame(frame);
    if (!ready || !visible) return;

    cur += (target - cur) * 0.07;
    var wantP, wantL;
    if (focus) { wantP = focus.pos; wantL = focus.look; }
    else { camCurve.getPoint(cur, tmpP); tgtCurve.getPoint(cur, tmpT); wantP = tmpP; wantL = tmpT; }
    var k = focus ? 0.06 : 0.12;
    camPos.lerp(wantP, k); camLook.lerp(wantL, k);
    camera.position.copy(camPos);
    camera.position.x += mx * 0.6; camera.position.y -= my * 0.4;

    var moved = needsRender ||
      camera.position.distanceToSquared(lastP) > 1e-8 ||
      camLook.distanceToSquared(lastL) > 1e-8;
    if (!moved) return;   /* сцена стоит: GPU отдыхает */

    camera.lookAt(camLook);
    lastP.copy(camera.position); lastL.copy(camLook); needsRender = false;

    bar.style.width = (cur * 100).toFixed(2) + '%';
    var atStart = cur < 0.03, atEnd = cur > 0.97;
    hint.textContent = atEnd ? 'details ↓' : '↓';
    hint.style.opacity = (!focus && (atStart || atEnd)) ? 1 : 0;
    var best = -1, bd = 1e9;
    for (var i = 0; i < caps.length; i++) {
      var d = Math.abs(cur - parseFloat(caps[i].getAttribute('data-at')));
      if (d < bd) { bd = d; best = i; }
    }
    for (var q = 0; q < caps.length; q++) caps[q].classList.toggle('on', !focus && q === best && bd < 0.09);

    renderer.render(scene, camera);
  }

  /* ============================================================
     ЗАГРУЗКА МОДЕЛИ
     ============================================================ */
  new THREE.GLTFLoader().load(MODEL_URL, function (gltf) {
    gltf.scene.traverse(function (o) {
      if (!o.isMesh) return;
      var isRoom = false, p = o; while (p) { if (p.name === 'Cube') { isRoom = true; break; } p = p.parent; }
      o.castShadow = !isRoom;      /* оболочка комнаты не должна закрывать свет */
      o.receiveShadow = true;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        m.side = THREE.DoubleSide;
        if (m.isMeshStandardMaterial) m.envMapIntensity = (m.metalness > 0.5) ? 1.1 : 0.3;
        m.needsUpdate = true;
      });
    });
    world = gltf.scene;
    scene.add(world);
    world.updateMatrixWorld(true);
    world.traverse(function (o) {
      if (!o.isMesh) return;
      var r = rootOf(o); if (!r || nameOf(r) === 'Cube') return;
      meshBoxes.push({ mesh: o, box: new THREE.Box3().setFromObject(o) });
    });
    renderer.shadowMap.needsUpdate = true;   /* единственный просчёт теней */
    ready = true; needsRender = true;
    msg.classList.add('hide');
    onScroll();
  }, function (e) {
    if (e.lengthComputable) msg.textContent = 'loading scene… ' + Math.round(e.loaded / e.total * 100) + '%';
  }, function (err) {
    console.error(err); fail('could not read the 3D scene');
  });

  frame();
})();
