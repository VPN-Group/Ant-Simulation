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

function createLegs()
{
    let legGeometry = new THREE.Geometry();

    let cylinderGeometry1 = new THREE.CylinderGeometry(0.5,0.5,2,32);
    let cylinderMesh1 = new THREE.Mesh(cylinderGeometry1);
    cylinderMesh1.rotation.z = -Math.PI/2;
    cylinderMesh1.position.y = 0.5;

    let ball1Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball1Mesh = new THREE.Mesh(ball1Geometry);
    ball1Mesh.position.x = 1;
    ball1Mesh.position.y = 0.5;
    
    let ball2Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball2Mesh = new THREE.Mesh(ball2Geometry);
    ball2Mesh.position.x = -1;
    ball2Mesh.position.y = 0.5;

    let cylinderGeometry2 = new THREE.CylinderGeometry(0.5,0.5,3,32);
    let cylinderMesh2 = new THREE.Mesh(cylinderGeometry2);
    cylinderMesh2.rotation.z = -Math.PI/2;
    cylinderMesh2.position.x = -2.5;
    cylinderMesh2.position.y = 0.5;

    let ball3Geometry = new THREE.SphereGeometry(0.5,20,20);
    let ball3Mesh = new THREE.Mesh(ball3Geometry);
    ball3Mesh.position.x = -4;
    ball3Mesh.position.y = 0.5;

    cylinderMesh1.updateMatrix();
    legGeometry.merge(cylinderMesh1.geometry,cylinderMesh1.matrix);

    ball1Mesh.updateMatrix();
    legGeometry.merge(ball1Mesh.geometry,ball1Mesh.matrix);

    ball2Mesh.updateMatrix();
    legGeometry.merge(ball2Mesh.geometry,ball2Mesh.matrix);

    cylinderMesh2.updateMatrix();
    legGeometry.merge(cylinderMesh2.geometry,cylinderMesh2.matrix);

    ball3Mesh.updateMatrix();
    legGeometry.merge(ball3Mesh.geometry,ball3Mesh.matrix);

    let legMaterial = new THREE.MeshLambertMaterial({
        color:"rgb(255,0,0)",
    });
    let leg = new Physijs.BoxMesh(legGeometry,legMaterial);
    leg.position.y = 10;
    
    return leg;
}

function createAnt()
{
    // let sphereGeometry = new THREE.SphereGeometry(2,32,32);
    // let sphereMaterial = new THREE.MeshLambertMaterial({
    //     color:"rgb(255,0,0)",
    // });

    // let sphere = new Physijs.SphereMesh(sphereGeometry,sphereMaterial);
    // sphere.position.y = 2;
    // scene.add(sphere);

    createLegs()
}

function createModels()
{
    let planeGeometry = new THREE.PlaneGeometry(80,80,120,120);
    let planeMaterial = new THREE.MeshBasicMaterial({
        map:new THREE.TextureLoader().load('textures/chess.jpg')
    });

    let plane = new Physijs.BoxMesh(planeGeometry,planeMaterial,0);
    plane.rotation.x = -Math.PI/2;
    plane.receiveShadow = true;

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