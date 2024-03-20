import './main.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// main.js
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg")
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0F0F10);
camera.position.setZ(7);
camera.position.setX(0);
camera.position.setY(0.5);

renderer.render(scene, camera);

const loader = new GLTFLoader();
let glbModel;

loader.load('/kopf.glb', (glb) => {
    glbModel = glb.scene;
    glbModel.position.set(0 ,0,0);
    scene.add(glbModel);
},
// called while loading is progressing
function ( xhr ) {

  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

},
// called when loading has errors
function ( error ) {

  console.log( 'An error happened: \n ' + error );

});


const pointLight = new THREE.PointLight(0xffffff, 50.0);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff, 10.0);
scene.add(pointLight, ambientLight);



// NOTE: MUST HAVE AN ANIMATE FUNCTION
var animate = function () {
    var time = Date.now();

    if(glbModel){
        glbModel.rotation.y += 0.01;
    }


    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};
animate();
