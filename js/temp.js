let container;
let camera;
let controls;
let renderer;
let scene;
let clock;

Physijs.scripts.worker = 'lib/physijs_worker.js'

function init()
{
    container = document.getElementById("scene");
    
    scene = new Physijs.Scene();
    scene.setGravity(new THREE.Vector3(0,-10,0))

    scene.background = new THREE.Color('rgb(30,30,30)');

    clock = new THREE.Clock();

    createCamera();
    createControls();
    createLights();
    createRenderer();
    createModels();
    loadModels();

    renderer.setAnimationLoop(()=>{
        update();
        scene.simulate();
        render();
    }) ;  
}

function createCamera() 
{
    camera = new THREE.PerspectiveCamera(35,container.clientWidth/container.clientHeight,1,100);
    camera.position.set(-30,30,30);
    camera.lookAt(scene.position)
}

function createControls() 
{
    controls = new THREE.FirstPersonControls(camera);
    controls.lookSpeed = 0.05;
    controls.movementSpeed = 10;
}

function createLights()
{
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 1);

    const mainLight = new THREE.DirectionalLight(0xffffff, 10);
    mainLight.position.set(0,100,0);

    scene.add(ambientLight,mainLight);
}

function createLimb1()
{
    let legGeometry = new THREE.Geometry();

    let cylinderGeometry1 = new THREE.CylinderGeometry(0.5,0.5,2,32);
    let cylinderMesh1 = new Physijs.BoxMesh(cylinderGeometry1,5);
    cylinderMesh1.rotation.z = -Math.PI/2;

    let ball1Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball1Mesh = new Physijs.SphereMesh(ball1Geometry,5);
    ball1Mesh.position.x = 1;
    
    let ball2Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball2Mesh = new Physijs.SphereMesh(ball2Geometry,5);
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
    let limb = new Physijs.CapsuleMesh(legGeometry,legMaterial,5,
        {
            restitution: 0.3, friction: 0.6
        });

    return limb;
}

function createLimb2()
{
    let legGeometry = new THREE.Geometry();

    let cylinderGeometry2 = new THREE.CylinderGeometry(0.5,0.5,3,32);
    let cylinderMesh2 = new Physijs.BoxMesh(cylinderGeometry2,5);
    cylinderMesh2.rotation.z = -Math.PI/2;
    cylinderMesh2.position.x = -2.5;

    let ball3Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball3Mesh = new Physijs.SphereMesh(ball3Geometry,5);
    ball3Mesh.position.x = -4;

    let ball4Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball4Mesh = new Physijs.SphereMesh(ball4Geometry,5);
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
    let limb = new Physijs.CapsuleMesh(legGeometry,legMaterial,5,
        {
            restitution: 0.3, friction: 0.6
        });
    
    return limb
}

function createLegs()
{
    let limb1 = createLimb1();
    let limb2 = createLimb2();

    limb1.position.set(3,0.5,0);
    limb2.position.set(-1,0.5,0);

    limb2.rotation.y += -Math.PI/2;

    let hinge_constraint = new Physijs.HingeConstraint(
        limb1,
        limb2,
        new THREE.Vector3(0,0.5,0),
        new THREE.Vector3(0,0,-1)
    );
    
    let dot = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32),new THREE.MeshLambertMaterial({color:"rgb(0,255,0"}));
    dot.position.x = 2;
    dot.position.y = 0.5;
    scene.add(dot);
    
    scene.add(limb1);
    scene.add(limb2);
        
    scene.addConstraint(hinge_constraint);

    return limb1;
}

function createAnt()
{
    createLegs();
    // let sphereGeometry = new THREE.SphereGeometry(2,32,32);
    // let sphereMaterial = new THREE.MeshLambertMaterial({
    //     color:"rgb(255,0,0)",
    // });

    // let sphere = new Physijs.SphereMesh(sphereGeometry,sphereMaterial,1);
    // sphere.castShadow = true;
    // sphere.receiveShadow = true;

    // scene.add(sphere);

    // let leg1 = createLegs();
    // leg1.position.x = 5;
    // let leg1_constraint = new Physijs.HingeConstraint(
    //     sphere,
    //     leg1,
    //     new THREE.Vector3(1,2,0),
    //     new THREE.Vector3(0,0,1)
    // )

    // scene.addConstraint(leg1_constraint);

}

function createModels()
{
    let planeGeometry = new THREE.PlaneGeometry(80,80,120,120);
    let planeMaterial = new Physijs.createMaterial(
        new THREE.MeshBasicMaterial({
            map:new THREE.TextureLoader().load('textures/chess.jpg')
        }),
        0.9,
        0.2
    );
    planeMaterial.map.wrapS = planeMaterial.map.wrapT = THREE.RepeatWrapping;
    planeMaterial.map.repeat.set( 1, 1 );
    let plane = new Physijs.PlaneMesh(planeGeometry,planeMaterial,0,{
        restitution: 0.2, friction: 0.8
    });
    plane.rotation.x = -Math.PI/2;
    plane.receiveShadow = true;
    plane.castShadow = true;

    scene.add(plane);

    createAnt();
}

function loadModels() 
{
    
}

function createRenderer() 
{
    renderer = new THREE.WebGLRenderer(
        { antialias : true }
    );
    renderer.setSize(container.clientWidth, container.clientHeight);

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;

    renderer.physicallyCorrectLights = true;

    container.appendChild(renderer.domElement);

}

function update()
{
    let delta = clock.getDelta();

    // leg1[1].rotation.x +=0.01;

    controls.update(delta);
}

function render()
{
    renderer.render(scene, camera);
}

function onWindowResize() 
{
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize',onWindowResize);

init();