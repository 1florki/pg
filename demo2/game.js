import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.134.0-dfARp6tVCbGvQehLfkdx/mode=imports,min/optimized/three.js';

import * as PG from './../pg.js'


var renderer, scene, camera, clock, lights = {}, keys = {}, mousePressed = false, stats, mesh;

let choosenExample;

let examples = {
  empty: `{
  subs: 4,
  noise: {
    seed: 1, 
    min: 0.5,
  },
  gradient: {between: [0xffffff]},
}
`,
  simple1: `{
  subs: 5,
  noise: {
    seed: 1, 
    max: 1, 
    min: 0.8,
  }, 
  gradient: {between: [0xaa4444, 0x33ffff]}
}`,
  simple2: `{
  subs: 6,
  noise: {
    seed: 1,
    min: 0.7,
    oct: 3,
    erosion: 1,
  },
  gradient: {between: [0x770077, 0x33ff00]},
}
`,
  simple3: `{
  subs: 7,
  noise: {
    seed: 1,
    min: 0.7,
    oct: 0,
    erosion: 1,
  },
  gradient: {stops: [[0, 0x004477], [1, 0xaa0044]]},
}
`,
colors1: `{
  subs: 6,
  noise: {
    seed: 1,
    min: 0.7,
    oct: 4,
    scl: 0.8,
    erosion: 0.6,
    layers: [{amp: 0.5}, {amp: 2, warp: 0.3}, {sharpness: -1}]
  },
  gradient: {
    between: [
      {between: [0xaa0077, 0x0077ff]},
      {between: [0x33ff00, 0x33ffaa, 0x3300ff]}
    ]
  },
  colorNoise: { min: -1, max: 0, scl: 1.5, oct: 4, warp: 0.5, sharpness: 0},
}`,
  lava: `{
  subs: 6,
  noise: {
    max: 1, 
    min: 1,
    scl: 1,
    oct: 3,
    per: 0.4,
    warp: 0.7,
    warp2: 0.6,
  }, 
  gradient: {stops: [[-0.4, 0x000000], [-0.2, 0x330000], [0.1, 0xcc2211], [0.3, 0xdd7705], [0.6, 0xccaa00], [0.7, 0xccaa00], [1, 0xffffaa]]}
}`,
  alien_ice: `{
  subs: 6,
  noise: {
    max: {min: 0.9, max: 0.8, scl: 0.1}, 
    min: {min: 1, max: 1.2, scl: 1},
    scl: 0.4,
    oct: 4,
    lac: { min: 1.5, max: 3.5, scl: 1},
    per: { min: 0.1, max: 0.5, scl: 1},
  }, 
  gradient: {between: [0x00aaff, 0xffffff]}
}`,
  green: `{
  subs: 6,
  noise: {
    seed: 1, 
    max: 1, 
    min: 0.95,
    warp: 0.3,
    oct: 4,
    sharpness: 1,
    per: {min: 0.3, max: 0.7, scl: 3, oct: 2},
    gain: {min: 0.3, max: 0.6, scl: 2},
  }, 
  gradient: {between: [0x114400, 0x446611, 0x55aa33]}
}`
};

var settings = {
  geometry: 'sphere',
  size: 1,
  distance: 2,
  speed: 1,
  update: updateGeo,
  example: "empty",
  load: loadExample,
}

function loadExample() {
  if(examples[settings.example]) document.getElementById("code").value = examples[settings.example];
}

function setupScene() {
  renderer = new THREE.WebGLRenderer()//{logarithmicDepthBuffer: true});
  clock = new THREE.Clock();

  renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  stats = new Stats(); 
  document.body.appendChild(stats.dom);

  var gui = new dat.GUI({name: 'settings'});
  gui.add(settings, 'geometry', ["sphere", "plane"]);
  
  choosenExample = gui.add(settings, 'example', Object.keys(examples));
  gui.add(settings, 'load');
  
  gui.add(settings, 'speed', 0, 3, 0.1);
  gui.add(settings, 'distance', 1, 10, 0.01).onChange((a) => {
    camera.position.set(0, 0, a);
  })
  gui.add(settings, 'update');
  
  
  renderer.outputEncoding = THREE.LinearEncoding;
  
  let d = renderer.domElement;
  d.style.position = 'absolute';

  let text = document.getElementById("code");
  text.style.position = 'absolute';
  text.style.left = '0px';
  text.style.top = '0px';
  
  updateDomPositions();
  
  scene = new THREE.Scene();

  let background = 0x000000
  scene.background = new THREE.Color(background)

  //scene.fog = new THREE.Fog(background, 3, 4)
  document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
    if (event.metaKey && event.keyCode == 13) {
      updateGeo();
    }
    if(event.keyCode == 9) {
      event.preventDefault();
      return false;
    }
  }, false);

  document.addEventListener("keyup", (event) => {
    keys[event.key] = false
  }, false);

  document.addEventListener("mousemove", mouseMove, false);
  document.addEventListener("mousedown", () => mousePressed = true, false);
  document.addEventListener("mouseup", () => mousePressed = false, false);

  window.addEventListener("resize", onWindowResize, false);
  
  let pointlight = new THREE.PointLight(0xffffff, 0.5, 0.25, 2);
  scene.add(pointlight);
  
  let ambi = new THREE.AmbientLight(0xffffdd, 0.4);
  scene.add(ambi);
  
  let directionallight = new THREE.DirectionalLight(0xffaa77, 0.8);
  directionallight.position.set(-1, 0.2, 0.5);
  scene.add(directionallight);
  
  let directionallight2 = new THREE.DirectionalLight(0xffffaa, 1);
  directionallight2.position.set(1, -0.1, 0.5);
  scene.add(directionallight2);
  
  camera = new THREE.PerspectiveCamera(60, (window.innerWidth * 0.7) / window.innerHeight, 0.05, 12);
  camera.position.set(0, 0, settings.distance);
  
  loadExample();
  updateGeo();
}

function updateGeo() {
  let oldRotation;
  if(mesh) {
    oldRotation = mesh.rotation.y;
    scene.remove(mesh);
  }
  let code;
  try {
    code = eval('(' + document.getElementById("code").value + ')');
  } catch (error) {
    console.log(error);
    return;
  }
  
  let noise = new PG.Noise(code.noise);
  let gradient = new PG.Mixer(code.gradient);
  let colorNoise = new PG.Noise(code.colorNoise);
  
  let shape = new PG.Geo({shape: settings.geometry, subs: code.subs});
  
  if(settings.geometry == "sphere") {
    shape.color((face) => {
      let v = face.mid;
      let n = noise.getNorm(v.x, v.y, v.z, v);
      return gradient.get(n, code.colorNoise != undefined ? colorNoise.get(v) : 0);

    })
    shape.change((v) => {
      v.setLength(noise.get(v.x, v.y, v.z, v));
    });
  } else if(settings.geometry == "plane") {
    let up = new THREE.Vector3(0, 1, 0);
    shape.color((face) => {
      let v = face.mid;
      let n = noise.getNorm(v.x, v.y, v.z);
      
      return gradient.get(n);
    })
    shape.change((v) => {
      v.y = noise.get(v.x, v.y, v.z) - noise.min;
    });
    shape.scale(new THREE.Vector3(3, 3, 3))
  }
  
  mesh = shape.mesh();
  if(settings.geometry == "plane") {
    mesh.rotation.x = 1;
  }
  if(oldRotation) {
    mesh.rotation.y = oldRotation;
  }
  scene.add(mesh);
}

function updateDomPositions() {
  let newPos = Math.floor(window.innerWidth * 0.3) + 'px';
  stats.dom.style.position = 'absolute';
  stats.dom.style.left = newPos;
  
  renderer.domElement.style.left = newPos;
  renderer.domElement.style.top = '0px';
  
  let text = document.getElementById("code");
  
  text.style.width = newPos;
  text.style.height = window.innerHeight + 'px';
}


function onWindowResize() {
  camera.aspect = (window.innerWidth * 0.7) / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
  updateDomPositions();
}


function animate(now) {
  requestAnimationFrame(animate);
  
  let delta = clock.getDelta();
  let total = clock.getElapsedTime();
  stats.update();
  
  if(mesh) mesh.rotation.y += delta * settings.speed * 0.5;
  
  renderer.render(scene, camera);
  
  let delayStats = 1 / 10;
  if(Math.floor((total - delta) * delayStats) != Math.floor(total * delayStats)) console.log(renderer.info);
}



function mouseMove(event) {
  event.preventDefault();
}

setupScene();
animate();
