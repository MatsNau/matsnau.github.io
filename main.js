import './main.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Geometry } from 'https://unpkg.com/three@0.125.2/examples/jsm/deprecated/Geometry.js'
import { OrbitControls } from "https://unpkg.com/three@0.125.2/examples/jsm/controls/OrbitControls.js";

//TODO:
//EDIT MATERIAL
//Bring more structure into the project

// - Global variables -
// Graphics variables
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg")
});
let loadingManager;
let softBodies = [];
let textureLoader = new THREE.TextureLoader();
var clock = new THREE.Clock();
var clickRequest = false;
var controls;
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial({
  color: 0x202020, // Farbe des Materials
  transparent: true, // Aktiviere Transparenz
  opacity: 0.01, // Setze die Opazität auf einen niedrigen Wert, um das Objekt fast unsichtbar zu machen
});
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();

// Physics variables
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var softBodySolver;
var rigidBodies = [];
var margin = 0.05;

Ammo().then( function ( AmmoLib ) {

    Ammo = AmmoLib;

    var transformAux1 = new Ammo.btTransform();
		var softBodyHelpers = new Ammo.btSoftBodyHelpers();

    init();
    initPhysics();
    createObjects();
    initInput();
    animate();

  function init(){

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0F0F10);
    camera.position.setZ(7);
    camera.position.setX(0);
    camera.position.setY(0.5);
    
    renderer.render(scene, camera);   

    
    /*controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 2, 0 );
    controls.update();*/
    
    const pointLight = new THREE.PointLight(0xffffff, 5.0); //og50
    pointLight.position.set(5, 5, 5);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);//og10
    scene.add(pointLight, ambientLight);

    loadingManager = new THREE.LoadingManager( () => {
	
      const loadingScreen = document.getElementById( 'loader' );
      loadingScreen.classList.add( 'fade-out' );
            
    } );

  }

  function initPhysics() {

    // Physics configuration

    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
    physicsWorld.setGravity( new Ammo.btVector3( 0, 0, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, 0, 0 ) );

  }
  
  function createObjects(){
    /*const loader = new GLTFLoader();
    loader.load('/kopflowpoly.glb', (glb) => {
        glbModel = glb.scene;
        glbModel.position.set(0 ,0,0);
        glbBufferGeometry = glbModel.geometry;
    },
    // called while loading is progressing
    function ( xhr ) {
    
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
    },
    // called when loading has errors
    function ( error ) {
    
      console.log( 'An error happened: \n ' + error );
    
    });*/


    //This is not needed, should be deleted in the future
    let mapDef = textureLoader.load( 'https://threejs.org/examples/textures/uv_grid_opengl.jpg' );
    let mat = new THREE.MeshPhongMaterial({ map: mapDef, wireframe: true });
    let mat1 = new THREE.MeshPhongMaterial({ map: mapDef, wireframe: false, side: THREE.DoubleSide });
    let loader = new GLTFLoader(loadingManager);


    loader.load('/kopflowpoly0.9.glb' , function ( gltf ) {
      var threeObject = gltf.scene.children[0];
           
       for(let i = 0; i<gltf.scene.children.length; i++){
         threeObject = gltf.scene.children[i];			
       }
     
       let mapmat;
       gltf.scene.traverse( child => {
         if ( child.isMesh ) {
           child.castShadow = true;
           child.receiveShadow = true;
           if ( child.material.map ) {
             mapmat = child.material;
             child.material.map.anisotropy = 8;
           }
         }
       });

      let threeG3d = threeObject.geometry;        
      let pos1Atrib = threeG3d.attributes.position;
      let vec3 = new THREE.Vector3();

      for (let i = 0; i < pos1Atrib.count; i++) {
        vec3.fromBufferAttribute(pos1Atrib, i);
        vec3.multiplyScalar( 1 );
        pos1Atrib.setXYZ(i, vec3.x, vec3.y, vec3.z);
      }


      let dod = setupAttributes( threeG3d );

      dod.computeVertexNormals();
      dod.computeBoundingSphere();

      let posAtrAr1 = dod.attributes.position.array;
      let vertices = [];
      for ( let i = 0; i < posAtrAr1.length; i +=3 ) {
        let v1 = new THREE.Vector3(posAtrAr1[i], posAtrAr1[i+1], posAtrAr1[i+2]); // x,y,z
        vertices.push(v1);
      } 

      let normals = dod.attributes.normals;

      let uvs = [];
      uvs = new Float32Array(dod.attributes.uv.array);

      let indices = [];
      let posAtr = dod.attributes.position;
      let posAtrAr = dod.attributes.position.array;
      indices = dod.index;

      let pointsMaterial = new THREE.PointsMaterial( {color: 0x0080ff,size: 0.1, alphaTest: 0.5} );
      let pointsGeometry = new THREE.BufferGeometry().setFromPoints( vertices );
      let points = new THREE.Points( pointsGeometry, pointsMaterial );

      let mesh2 = new THREE.Mesh(pointsGeometry, mat);
      mesh2.material.side = THREE.DoubleSide;

      mesh2.geometry.setFromPoints(vertices);  
      mesh2.geometry.setIndex( indices );  
      mesh2.geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ))
      mesh2.geometry.computeVertexNormals();
      mesh2.geometry.needsUpdate = true;
      mesh2.geometry.computeBoundingSphere();
      mesh2.geometry.translate(0, 0, 0);
      mesh2.material = mat1;
        
      createSoftVolume( mesh2.geometry, 50000, 200 );
      });
}

function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

  threeObject.position.copy( pos );
  threeObject.quaternion.copy( quat );

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  const motionState = new Ammo.btDefaultMotionState( transform );

  const localInertia = new Ammo.btVector3( 0, 0, 0 );
  physicsShape.calculateLocalInertia( mass, localInertia );

  const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
  const body = new Ammo.btRigidBody( rbInfo );

  threeObject.userData.physicsBody = body;

  scene.add( threeObject );

  if ( mass > 0 ) {

    rigidBodies.push( threeObject );

    // Disable deactivation
    body.setActivationState( 4 );

    // Entferne den rigidBody nach 0.5 Sekunden
    setTimeout(() => {
      physicsWorld.removeRigidBody(body);
      scene.remove(threeObject);
    }, 500); // 0.5 Sekunden Verzögerung

  }
  physicsWorld.addRigidBody( body );
  return body;
}



  function setupAttributes( geometry ) {
    const vectors = [
      new THREE.Vector3(), // new THREE.Vector3( 1, 0, 0 ),
      new THREE.Vector3(), // new THREE.Vector3( 0, 1, 0 ),
      new THREE.Vector3() // new THREE.Vector3( 0, 0, 1 )
    ];
    const position = geometry.attributes.position;
    const centers = new Float32Array( position.count * 3 );

    for ( let i = 0, l = position.count; i < l; i ++ ) {
      vectors[ i % 3 ].toArray( centers, i * 3 );
    }
    geometry.setAttribute( 'center', new THREE.BufferAttribute( centers, 3 ) );
    return geometry;
  }
  

  function createSoftVolume( bufferGeom, mass, pressure, map ) {

    processGeometry( bufferGeom );

    //var volume = new THREE.Mesh( bufferGeom, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
    var volume = new THREE.Mesh( bufferGeom, new THREE.MeshPhongMaterial() );
    volume.castShadow = true;
    volume.receiveShadow = true;
    volume.frustumCulled = false;

    //Find out how to add the original material
  textureLoader.load( "./FBHead_baked_tex.png", function( texture ) {
        volume.material.map = texture;
        volume.material.needsUpdate = true;
    } );
    // Volume physic object

    var volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
        physicsWorld.getWorldInfo(),
        bufferGeom.ammoVertices,
        bufferGeom.ammoIndices,
        bufferGeom.ammoIndices.length / 3,
        true );

    var sbConfig = volumeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 40 );
    sbConfig.set_piterations( 40 );

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions( 0x11 );

    // Friction
    sbConfig.set_kDF( 0.5 );
    // Damping
    sbConfig.set_kDP( 0.01 );
    // Pressure
    sbConfig.set_kPR( 500 );
    // Stiffness
    volumeSoftBody.get_m_materials().at( 0 ).set_m_kLST( 1.00 );
    volumeSoftBody.get_m_materials().at( 0 ).set_m_kAST( 1.00 );

    volumeSoftBody.setTotalMass( mass, true )
    Ammo.castObject( volumeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin );
    physicsWorld.addSoftBody( volumeSoftBody, 1, -1 );
    volume.userData.physicsBody = volumeSoftBody;
    // Disable deactivation
    volumeSoftBody.setActivationState( 1 );
    softBodies.push(volume);
    scene.add( volume );
  }

  function processGeometry( bufGeometry ) {

    // Obtain a Geometry
    let bfgeometry = new Geometry().fromBufferGeometry(bufGeometry); // если что, он воссозд из точек
    bfgeometry.mergeVertices();

    // Convert again to BufferGeometry, indexed
    var indexedBufferGeom = createIndexedBufferGeometryFromGeometry( bfgeometry );

    // Create index arrays mapping the indexed vertices to bufGeometry vertices
    mapIndices( bufGeometry, indexedBufferGeom );

  }

  function createIndexedBufferGeometryFromGeometry( geometry ) {

    var numVertices = geometry.vertices.length;
    var numFaces = geometry.faces.length;

    var bufferGeom = new THREE.BufferGeometry();
    var vertices = new Float32Array( numVertices * 3 );
    var indices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

    for ( var i = 0; i < numVertices; i++ ) {
      var p = geometry.vertices[ i ];
      var i3 = i * 3;
      vertices[ i3 ] = p.x;
      vertices[ i3 + 1 ] = p.y;
      vertices[ i3 + 2 ] = p.z;
    }

    for ( var i = 0; i < numFaces; i++ ) {
      var f = geometry.faces[ i ];
      var i3 = i * 3;
      indices[ i3 ] = f.a;
      indices[ i3 + 1 ] = f.b;
      indices[ i3 + 2 ] = f.c;
    }

    bufferGeom.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    bufferGeom.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    return bufferGeom;
  }

  function isEqual( x1, y1, z1, x2, y2, z2 ) {
    var delta = 0.000001;
    return Math.abs( x2 - x1 ) < delta &&
            Math.abs( y2 - y1 ) < delta &&
            Math.abs( z2 - z1 ) < delta;
  }

  function mapIndices( bufGeometry, indexedBufferGeom ) {

    // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

    var vertices = bufGeometry.attributes.position.array;
    var idxVertices = indexedBufferGeom.attributes.position.array;
    var indices = indexedBufferGeom.index.array;

    var numIdxVertices = idxVertices.length / 3;
    var numVertices = vertices.length / 3;

    bufGeometry.ammoVertices = idxVertices;
    bufGeometry.ammoIndices = indices;
    bufGeometry.ammoIndexAssociation = [];

    for ( var i = 0; i < numIdxVertices; i++ ) {

        var association = [];
        bufGeometry.ammoIndexAssociation.push( association );

        var i3 = i * 3;

        for ( var j = 0; j < numVertices; j++ ) {
            var j3 = j * 3;
            if ( isEqual( idxVertices[ i3 ], idxVertices[ i3 + 1 ],  idxVertices[ i3 + 2 ],
                          vertices[ j3 ], vertices[ j3 + 1 ], vertices[ j3 + 2 ] ) ) {
                association.push( j3 );
            }
        }

    }

  }

  function updatePhysics( deltaTime ) {

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update soft volume
    for ( let i = 0, il = softBodies.length; i < il; i ++ ) {
      const volume = softBodies[i];
      const geometry = volume.geometry;
      const softBody = volume.userData.physicsBody;
      const volumePositions = geometry.attributes.position.array;
      const volumeNormals = geometry.attributes.normal.array;
      const association = geometry.ammoIndexAssociation;
      const numVerts = association.length;
      const nodes = softBody.get_m_nodes();
      for ( let j = 0; j < numVerts; j ++ ) {

        const node = nodes.at( j );
        const nodePos = node.get_m_x();
        const x = nodePos.x();
        const y = nodePos.y();
        const z = nodePos.z();
        const nodeNormal = node.get_m_n();
        const nx = nodeNormal.x();
        const ny = nodeNormal.y();
        const nz = nodeNormal.z();

        const assocVertex = association[ j ];

        for ( let k = 0, kl = assocVertex.length; k < kl; k ++ ) {

          let indexVertex = assocVertex[ k ];
          volumePositions[ indexVertex ] = x;
          volumeNormals[ indexVertex ] = nx;
          indexVertex ++;
          volumePositions[ indexVertex ] = y;
          volumeNormals[ indexVertex ] = ny;
          indexVertex ++;
          volumePositions[ indexVertex ] = z;
          volumeNormals[ indexVertex ] = nz;

        }

      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
    }

    
      // Update rigid bodies
      for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {

        const objThree = rigidBodies[ i ];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if ( ms ) {

          ms.getWorldTransform( transformAux1 );
          const p = transformAux1.getOrigin();
          const q = transformAux1.getRotation();
          objThree.position.set( p.x(), p.y(), p.z() );
          objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        }
      }

  }

  function initInput() {

    window.addEventListener( 'pointerdown', function ( event ) {

      if ( ! clickRequest ) {

        mouseCoords.set(
          ( event.clientX / window.innerWidth ) * 2 - 1,
          - ( event.clientY / window.innerHeight ) * 2 + 1
        );

        clickRequest = true;

      }

    } );

  }

  function processClick() {
    if ( clickRequest ) {
      raycaster.setFromCamera( mouseCoords, camera );

      // Creates a ball
      const ballMass = 3;
      const ballRadius = 0.4;

      const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 18, 16 ), ballMaterial );
      ball.castShadow = true;
      ball.receiveShadow = true;
      const ballShape = new Ammo.btSphereShape( ballRadius );
      ballShape.setMargin( margin );
      pos.copy( raycaster.ray.direction );
      pos.add( raycaster.ray.origin );
      quat.set( 0, 0, 0, 1 );
      const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
      ballBody.setFriction( 1 );

      pos.copy( raycaster.ray.direction );
      pos.multiplyScalar( 40 );
      ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

      clickRequest = false;

    }

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( window.innerWidth, window.innerHeight );
  
  }
  
  // NOTE: MUST HAVE AN ANIMATE FUNCTION
  function animate () {
      var time = Date.now();
      const deltaTime = clock.getDelta();
  
      if(softBodies.length > 0){
        updatePhysics( deltaTime );
        //softBodies[0].rotation.y += 0.008;
      }

      processClick();
      onWindowResize();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
  };




} );