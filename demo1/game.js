import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.134.0-dfARp6tVCbGvQehLfkdx/mode=imports,min/optimized/three.js';

import * as PG from './../pg.js'


var renderer, scene, camera, clock, lights = {}, stats;
var keys = {}, mousePressed = false;


var mesh;

// create some basic shapes
function shapeDemo() {
  let geo = new PG.Geo({shape: "sphere", radius: 1, subs: 1, 
                       color: new THREE.Color(0xaa0022)});
  geo.addShape("para", {a: new THREE.Vector3(), c: new THREE.Vector3(2, 1, 0), b: new THREE.Vector3(-1, 1, 0), 
                        color: new THREE.Color(0x007733), pos: new THREE.Vector3(3, -1), maxSideLength: 0.5});
  geo.addShape("para", {a: new THREE.Vector3(), c: new THREE.Vector3(-1, 1, 0), b: new THREE.Vector3(2, 1, 0), 
                        color: new THREE.Color(0x007733), pos: new THREE.Vector3(3, -1), maxSideLength: 0.5});
  geo.addShape("box", {color: new THREE.Color(0x0033aa), pos: new THREE.Vector3(3, 0, 3), maxSideLength: 0.5});
  geo.addShape("cylinder", {rot: new THREE.Euler(.9, 0, 0), color: new THREE.Color(0xccaa00), caps: true, pos: new THREE.Vector3(-3, 0), maxSideLength: 0.5});
  geo.addShape("beam", {a: new THREE.Vector3(-1, -0.5, 0), b: new THREE.Vector3(1, 0.5, 0), size: new THREE.Vector3(0.7, 0.2), color: new THREE.Color(0x444444), pos: new THREE.Vector3(-3, 0, 3), maxSideLength: 0.5})
  geo.addShape("pyramid", {height: 1.5, sides: 4, color: new THREE.Color(0x550099), pos: new THREE.Vector3(0, -0.5, 3), subs: 2, scatter: 0.05, rows: 2})
  geo.addShape("ring", {rot: new THREE.Euler(.2, 0, 0), pos: new THREE.Vector3(3, 0, -3), sides: 8, innerRadius: 0.6, maxSideLength: 0.5, color: new THREE.Color(0xff7700)});
  geo.addShape("plane", {rot: new THREE.Euler(0, 0, 0), pos: new THREE.Vector3(0, 0, -3), size: new THREE.Vector3(1, 0, 0.5), maxSideLength: 0.5, color: new THREE.Color(0x00aacc)});
  geo.addShape("tube", {rot: new THREE.Euler(2, 0, 0), height: 0.5, pos: new THREE.Vector3(-3, 0, -3), innerRadius: 0.8, caps: true, size: new THREE.Vector3(1, 0, 0.5), maxSideLength: 0.5, color: new THREE.Color(0xcc4499)});
  geo.scatter(0.08)
  return geo.mesh();
}

// create little low poly lighthouse procedurally
function shapeDemo2() {
  // main part
  let cyl = new PG.Geo({shape:"cylinder", sides: 4, subs: 1, rows: 3, height: 2});
  let noise = new PG.Noise({max: 0.05, min: 0});
  // make smaller on top
  cyl.changeVertices((v) => {
    let y = v.y;
    v.y = 0;
    v.setLength((1 - y) * 0.1 + 0.2 + noise.get(v.x, y, v.z));
    v.y = y;
  })
  cyl.setFaceColor((face) =>  {
    return (face.mid.y + 100.33) % 0.66 < 0.33 ? new THREE.Color(0xff0000) : new THREE.Color(0xffffff)
  })
  
  // top start
  // top floor 
  let cyl2 = new PG.Geo({shape:"cylinder", sides: 7, subs: 1, rows: 1, height: 0.05, radius: 0.4, caps: true});
  cyl2.changeVertices((a) => a.y += 1);
  cyl2.setColor(new THREE.Color(0x222222));
  cyl.merge(cyl2);
  
  // top ceiling
  cyl2 = new PG.Geo({shape:"cylinder", sides: 7, subs: 1, rows: 1, height: 0.07, radius: 0.34, caps: true});
  cyl2.changeVertices((a) => a.y += 1.5);
  cyl2.setColor(new THREE.Color(0x222222));
  cyl.merge(cyl2);
  
  // bottom floor
  cyl2 = new PG.Geo({shape:"cylinder", sides: 7, subs: 1, rows: 1, height: 0.05, radius: 0.8, caps: true});
  cyl2.changeVertices((a) => a.y -= 1);
  cyl2.setColor(new THREE.Color(0x222222));
  cyl.merge(cyl2);
  
  // top cap
  cyl2 = new PG.Geo({shape:"cylinder", sides: 7, subs: 0, rows: 0, height: 0.1, radius: 0.1, caps: true});
  cyl2.changeVertices((a) => {
    if(a.y > 0) {
      let y = a.y;
      a.y = 0;
      a.setLength(0.07);
      a.y = y;
    }
    a.y += 1.68
  });
  cyl2.setColor(new THREE.Color(0x990000));
  cyl.merge(cyl2);
  
  // top "cage"
  let oldPos;
  let verts = [];
  let geo = new PG.Geo();
  for(let i = 0; i < 15; i++) {
    let a = i / 14 * Math.PI * 2;
    let vec = new THREE.Vector3(Math.sin(a) * 0.3, 1, Math.cos(a) * 0.3);
    let vec2 = vec.clone();
    vec2.y += 0.5
    let up = vec.clone();
    up.y = 0;
    if(i % 2 == 0) {
      geo.addShape("beam", {a: vec, b: vec2, size: new THREE.Vector3(0.03, 0.03, 0), up: up});
    }
    vec = new THREE.Vector3(Math.sin(a) * 0.35, 1, Math.cos(a) * 0.35);
    vec2 = vec.clone();
    vec2.y += 0.2
    geo.addShape("beam", {a: vec, b: vec2, size: new THREE.Vector3(0.02, 0.02, 0), up: up});
    if(oldPos) {
      geo.addShape("beam", {a: vec2, b: oldPos, size: new THREE.Vector3(0.02, 0.02, 0), up: new THREE.Vector3(0, 1, 0)});
    }
    oldPos = vec2;
  }
  geo.setColor(new THREE.Color(0x222222));
  cyl.merge(geo);
  
  // roof
  let pyr = new PG.Geo({shape:"pyramid", base: true, sides: 10, height: 0.2});
  pyr.changeVertices((a) =>{
    let y = a.y;
    a.y = 0;
    a.setLength(0.4);
    a.y = y + 1.525
  });
  pyr.setFaceColor((face) => {
    return new THREE.Color(0x990000)
  });
  cyl.merge(pyr);
  cyl.scatter(0.02);
  let mesh = cyl.mesh();
  
  // light ray
  pyr = new PG.Geo({shape:"cylinder", sides: 8, height: 10, caps: true});
  pyr.change((v) => {
    if(v.y > 0) {
      let y = v.y;
      v.y = 0;
      v.setLength(0.05);
      v.y = y;
    }
  })
  pyr.applyEuler(new THREE.Euler(0, 0, Math.PI / 2));
  pyr.setPosition(new THREE.Vector3(5, 0, 0))
  let color = new THREE.Color(0xff5500);
  pyr.setColor(color);
  let lightmesh = pyr.mesh();
  lightmesh.position.y = 1.3
  lightmesh.material.transparent = true;
  lightmesh.material.opacity = 0.5;
  lightmesh.material.emissive = color;
  lightmesh.material.side = THREE.DoubleSide
  lightmesh.onBeforeRender(() => lightmesh.rotation.y += 0.2);
  mesh.add(lightmesh);
  
  // top, windows (glass)
  cyl2 = new PG.Geo({shape:"cylinder", sides: 7, subs: 1, rows: 3, height: 0.5, radius: 0.3});
  cyl2.changeVertices((a) => a.y += 1.25);
  cyl2.setColor(new THREE.Color(0x999999));
  
  let mesh2 = cyl2.mesh();
  mesh2.material.transparent = true;
  mesh2.material.opacity = 0.7;
  mesh.add(mesh2);
  
  mesh.scale.set(1.7, 1.7, 1.7)
  
  return mesh;
}

// create box and show 3d color mixer
function mixerDemo() {
  let geo = new PG.Geo({size: new THREE.Vector3(5, 4, 4), shape: "box", radius: 1, subs: 3, maxSideLength: .5, reverse: true});
  
  let mix = new PG.Mixer({stops: [[-1, {stops: [[-1, {between: [0xdaa933, 0x004466]}], [0, 0xc35300], [1, 0xff4466]]}], [1, {between: [0xaa0000, 0x330099]}]]});
  geo.setVertexColor((v) => {
    return mix.get(v.x / 2, v.y / 2, v.z / 2);
  })
  return geo.mesh();
}

function octDemo() {
  let minDist = 0.13;
  let oct = new PG.Octree({size: 5});
  let maxTries = 100;
  for(let i = 0; i < 2000; i++) {
    let j = 0, p, close;
    do {
      p = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      p.setLength(3.5);
      close = oct.query(p, minDist);
      j++;
    } while(j < maxTries && close.length > 0);
    if(close.length == 0) {
      oct.insert(p);
    }
  }
  
  return oct.show({pointsOnly: true, p: new THREE.Vector3(0, 1, 3.5), min: 0.9, size: 0.05, sizeAttenuation: true});
}

var demos = [octDemo, shapeDemo, shapeDemo2, mixerDemo];
var currentDemo = 0;

function nextDemo() {
  if(mesh) scene.remove(mesh);
  mesh = demos[currentDemo]();
  scene.add(mesh);
  currentDemo = (currentDemo + 1) % demos.length;
}

function setupScene() {
  renderer = new THREE.WebGLRenderer()
  clock = new THREE.Clock();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  stats = new Stats(); 
  document.body.appendChild(stats.dom);
  
  renderer.outputEncoding = THREE.LinearEncoding;
  let d = renderer.domElement;
  d.style.position = 'absolute';
  d.style.left = '0px';
  d.style.top = '0px';

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 20);
  
  let background = 0x111111
  scene.background = new THREE.Color(background)

  document.addEventListener("keydown", (event) => {
    keys[event.key] = true
    if(event.key == "n") {
      nextDemo();
    }
  }, false);

  document.addEventListener("keyup", (event) => {
    keys[event.key] = false
  }, false);

  document.addEventListener("mousemove", mouseMove, false);
  document.addEventListener("mousedown", () => mousePressed = true, false);
  document.addEventListener("mouseup", () => mousePressed = false, false);

  window.addEventListener("resize", onWindowResize, false);

  let l = new THREE.DirectionalLight(0xffffaa, 0.9);
  l.position.set(0.5, 1, 1)
  scene.add(l);
  
  lights.ambi = new THREE.AmbientLight(0xffffaa, 0.3); // soft white light
  scene.add(lights.ambi);
  
  camera.position.set(0, 1, 6.5);
  
  nextDemo();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
function animate(now) {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();
  let total = clock.getElapsedTime();
  
  stats.update();
  if(mesh) {
    mesh.rotation.y -= delta * 0.2;
  }
  renderer.render(scene, camera);
}



function mouseMove(event) {
  event.preventDefault();
}



setupScene();
animate();
