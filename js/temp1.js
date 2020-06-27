let physicsWorld;
let scene;
let camera;
let renderer;
let container;
let controls;
let rigidBodies = [];
let tmpTrans;


Ammo().then(init);

function setupPhysicsWorld()
{
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -20, 0));
    
}

function setupGraphics()
{
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color('rgb(0,0,0)');

    container = document.getElementById("scene");

    camera = new THREE.PerspectiveCamera(60,container.clientWidth/container.clientHeight,1,150);
    camera.position.set(-30,30,30);
    camera.lookAt(scene.position);

    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
    hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
    hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 100 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    let d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 13500;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( container.clientWidth, container.clientHeight );
    container.appendChild(renderer.domElement);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
}

function renderFrame()
{
    let deltaTime = clock.getDelta();

    updatePhysics(deltaTime);

    renderer.render(scene,camera);

    controls.update(deltaTime);

    requestAnimationFrame( renderFrame );
}

function createControls() 
{
    controls = new THREE.FirstPersonControls(camera);
    controls.lookSpeed = 0.05;
    controls.movementSpeed = 10;
}

function onWindowResize() 
{
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize',onWindowResize);

function createModels()
{
    createPlane();
    createAnt();
}

function createPlane()
{
    let plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(100,100,100,100), new THREE.MeshPhongMaterial({
        map:new THREE.TextureLoader().load('textures/chess.jpg')
    }));
    plane.position.set(0,0,0);
    plane.rotation.x = -Math.PI/2;

    plane.castShadow = true;
    plane.receiveShadow = true;

    scene.add(plane);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0,0,0));
    transform.setRotation(new Ammo.btQuaternion(0,0,0,1));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape( new Ammo.btVector3(50*0.5,2*0.5,50*0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia(0,localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body );
}

function createAnt()
{
    createLegs();
}

function createLegs()
{
    let limb1 = createLimb1();
    let limb2 = createLimb2();

    limb2.position.set(1,0,0);

    let pivot = new THREE.Group();
    pivot.position.set(-1.25,0,0);

    pivot.material = {};

    limb1.add(limb2);
    limb1.add(pivot);
    pivot.add(limb2);
    limb1.position.y=10;
    pivot.rotation.z += Math.PI/4;

    limb1.castShadow = true;
    limb1.receiveShadow = true;
    limb2.castShadow = true;
    limb2.receiveShadow = true;

    scene.add(limb1);

    let pos = {x: 0, y: 20, z: 0};
    let radius = 2;
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 1;

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );


    physicsWorld.addRigidBody(body);
    
    limb1.userData.physicsBody = body;
    rigidBodies.push(limb1);
    
}

function createLimb1()
{
    let legGeometry = new THREE.Geometry();

    let cylinderGeometry1 = new THREE.CylinderGeometry(0.5,0.5,2,32);
    let cylinderMesh1 = new THREE.Mesh(cylinderGeometry1);
    cylinderMesh1.rotation.z = -Math.PI/2;

    let ball1Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball1Mesh = new THREE.Mesh(ball1Geometry);
    ball1Mesh.position.x = 1;
    
    let ball2Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball2Mesh = new THREE.Mesh(ball2Geometry);
    ball2Mesh.position.x = -1;

    cylinderMesh1.updateMatrix();
    legGeometry.merge(cylinderMesh1.geometry,cylinderMesh1.matrix);

    ball1Mesh.updateMatrix();
    legGeometry.merge(ball1Mesh.geometry,ball1Mesh.matrix);

    ball2Mesh.updateMatrix();
    legGeometry.merge(ball2Mesh.geometry,ball2Mesh.matrix);

    let legMaterial = new THREE.MeshLambertMaterial({
        color:"rgb(255,0,0)",
    });
    let limb = new THREE.Mesh(legGeometry,legMaterial);

    return limb;
}

function createLimb2()
{
    let legGeometry = new THREE.Geometry();

    let cylinderGeometry2 = new THREE.CylinderGeometry(0.5,0.5,3,32);
    let cylinderMesh2 = new THREE.Mesh(cylinderGeometry2);
    cylinderMesh2.rotation.z = -Math.PI/2;
    cylinderMesh2.position.x = -2.5;

    let ball3Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball3Mesh = new THREE.Mesh(ball3Geometry);
    ball3Mesh.position.x = -4;

    let ball4Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball4Mesh = new THREE.Mesh(ball4Geometry);
    ball4Mesh.position.x = -1;

    cylinderMesh2.updateMatrix();
    legGeometry.merge(cylinderMesh2.geometry,cylinderMesh2.matrix);

    ball3Mesh.updateMatrix();
    legGeometry.merge(ball3Mesh.geometry,ball3Mesh.matrix);

    ball4Mesh.updateMatrix();
    legGeometry.merge(ball4Mesh.geometry,ball4Mesh.matrix);
    
    let legMaterial = new THREE.MeshLambertMaterial({
        color:"rgb(255,0,0)",
    });
    let limb = new THREE.Mesh(legGeometry,legMaterial);
    
    return limb
}

// function createBall(){
    
//     let pos = {x: 0, y: 20, z: 0};
//     let radius = 2;
//     let quat = {x: 0, y: 0, z: 0, w: 1};
//     let mass = 1;

//     let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

//     ball.position.set(pos.x, pos.y, pos.z);
    
//     ball.castShadow = true;
//     ball.receiveShadow = true;

//     scene.add(ball);


//     let transform = new Ammo.btTransform();
//     transform.setIdentity();
//     transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
//     transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
//     let motionState = new Ammo.btDefaultMotionState( transform );

//     let colShape = new Ammo.btSphereShape( radius );
//     colShape.setMargin( 0.05 );

//     let localInertia = new Ammo.btVector3( 0, 0, 0 );
//     colShape.calculateLocalInertia( mass, localInertia );

//     let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
//     let body = new Ammo.btRigidBody( rbInfo );


//     physicsWorld.addRigidBody( body );
    
//     ball.userData.physicsBody = body;
//     rigidBodies.push(ball);
// }


function updatePhysics(deltaTime){

    physicsWorld.stepSimulation( deltaTime, 10 );

    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
    }
}


function init()
{
    tmpTrans = new Ammo.btTransform();

    setupPhysicsWorld();
    setupGraphics();
    createControls();
    createModels();
    renderFrame();
}