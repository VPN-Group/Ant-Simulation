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
    scene.setGravity(new THREE.Vector3(0,-20,0))

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
    camera = new THREE.PerspectiveCamera(35,container.clientWidth/container.clientHeight,1,200);
    camera.position.set(-50,50,50);
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
    mainLight.position.set(50,50,50);
    
    scene.add(ambientLight,mainLight);
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
}

let arm;

function loadModels() 
{   
    const loader = new THREE.FBXLoader();
    loader.load('models/ant1.fbx', function (model) {
        model.scale.set(1,1,1);
        helper = new THREE.SkeletonHelper(model);
        helper.material.linewidth = 5;
        helper.visible = true;
        arm = model.getObjectByName('Bone');
        console.log(model);
        model.traverse( function ( child ) {
            if (child.isMesh && child.material) {

                child.castShadow = true;
                child.receiveShadow = true;

                let oldMaterial = child.material;

                let newMaterial = new Physijs.createMaterial(
                    new THREE.MeshLambertMaterial({
                        color: oldMaterial.color,
                        map: oldMaterial.map,
                    }),
                    0.9,
                    0.2
                );
                
                child = new Physijs.CapsuleMesh(child.geometry,newMaterial,5);

                child.material.shininess=10;
                child.material.refractionRatio=1;
                child.material.reflectivity=1;
                child.material.metalness=1;

                console.log(child);

            }
        } );
        model.position.set(0,10,0);
        model.receiveShadow = true;
        model.castShadow = true;
        scene.add(model);
        scene.add(helper);

    });
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

    if(arm)
    {
        // console.log(arm.children);
        // console.log(arm.getObjectByName('Limb1002'))
        // arm.getObjectByName('Bone').rotation.z += 0.001;
        // arm.rotation.z += 0.005;
        // arm.rotation.x += 0.005;
        // arm.rotation.y += 0.005;

    }

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