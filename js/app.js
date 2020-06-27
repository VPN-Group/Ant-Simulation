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
    mainLight.position.set(50,50,50);

    scene.add(ambientLight,mainLight);
}

function createLimb1()
{
	let merged = new THREE.Geometry();
	let cyl = new THREE.CylinderGeometry(0.5,0.5,2,32);
	let top = new THREE.SphereGeometry(0.5,20,20);
	let bot = new THREE.SphereGeometry(0.5,20,20);

	let matrix = new THREE.Matrix4();
	matrix.makeTranslation(0,1,0);
	top.applyMatrix4(matrix);

	matrix = new THREE.Matrix4();
	matrix.makeTranslation(0,-1,0);
	bot.applyMatrix4(matrix);

	merged.merge(top);
	merged.merge(bot);
	merged.merge(cyl);

	let legMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({
			color:"rgb(255,0,0)",
		}),
        0.9,
        0.2
    );
	
	let limb = new Physijs.CapsuleMesh(merged,legMaterial,1,{
        restitution: 0.2, friction: 0.7
    });
	limb.rotation.z += Math.PI/2;
	limb.castShadow = true;
	limb.receiveShadow = true;

	limb._physijs.collision_type = 4;
	limb._physijs.collision_masks = 1;
	
	return limb;
}

function createLimb2()
{
	let merged = new THREE.Geometry();
	let cyl = new THREE.CylinderGeometry(0.5,0.5,3,32);
	let top = new THREE.SphereGeometry(0.5,20,20);
	let bot = new THREE.SphereGeometry(0.5,20,20);

	let matrix = new THREE.Matrix4();
	matrix.makeTranslation(0,1.5,0);
	top.applyMatrix4(matrix);

	matrix = new THREE.Matrix4();
	matrix.makeTranslation(0,-1.5,0);
	bot.applyMatrix4(matrix);

	merged.merge(top);
	merged.merge(bot);
	merged.merge(cyl);

	let legMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({
			color:"rgb(255,0,0)",
		}),
        0.9,
        0.2
    );

	let limb = new Physijs.CapsuleMesh(merged,legMaterial,1,{
        restitution: 0.2, friction: 0.7
    });
	limb.rotation.z += Math.PI/2;

	limb.castShadow = true;
	limb.receiveShadow = true;

	limb._physijs.collision_type = 4;
	limb._physijs.collision_masks = 1;

    return limb;
}

function createAnt()
{
	let bodyHeight = 10;
	let bias = 0.5, relaxation = 0.0;
	let degree = (Math.Pi/180)*60;
    let sphereGeometry = new THREE.SphereGeometry(2,32,32);
    let sphereMaterial = new THREE.MeshLambertMaterial({
        color:"rgb(255,0,0)",
    });

    let sphere = new Physijs.SphereMesh(sphereGeometry,sphereMaterial,1);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

	sphere._physijs.collision_type = 4;
	sphere._physijs.collision_masks = 1;

	sphere.position.set(0,bodyHeight,0);

    scene.add(sphere);

	// Limb 11
	
	let limb11 = createLimb1();
	limb11.position.set(-3.5,bodyHeight,0);

	scene.add(limb11);

	let limb11_constraint = new Physijs.HingeConstraint(sphere,limb11,new THREE.Vector3(-2,bodyHeight,0),new THREE.Vector3(0,0,1));

	scene.addConstraint(limb11_constraint);

	limb11_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 21

	let limb21 = createLimb1();
	limb21.position.set(3.5,bodyHeight,0);

	scene.add(limb21);

	let limb21_constraint = new Physijs.HingeConstraint(sphere,limb21,new THREE.Vector3(2,bodyHeight,0),new THREE.Vector3(0,0,1));

	scene.addConstraint(limb21_constraint);

	limb21_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 31

	let limb31 = createLimb1();
	limb31.position.set(0,bodyHeight,-3.5);
	limb31.rotation.y = Math.PI/2;

	scene.add(limb31);

	let limb31_constraint = new Physijs.HingeConstraint(sphere,limb31,new THREE.Vector3(0,bodyHeight,-2),new THREE.Vector3(1,0,0));

	scene.addConstraint(limb31_constraint);

	limb31_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 41

	let limb41 = createLimb1();
	limb41.position.set(0,bodyHeight,3.5);
	limb41.rotation.y = Math.PI/2;

	scene.add(limb41);

	let limb41_constraint = new Physijs.HingeConstraint(sphere,limb41,new THREE.Vector3(0,bodyHeight,2),new THREE.Vector3(1,0,0));

	scene.addConstraint(limb41_constraint);

	limb41_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 12

	let limb12 = createLimb2();
	limb12.position.set(-7,bodyHeight,0);
	
	scene.add(limb12);

	let limb12_constraint = new Physijs.HingeConstraint(limb11,limb12,new THREE.Vector3(-5,bodyHeight,0),new THREE.Vector3(0,0,1));

	scene.addConstraint(limb12_constraint);

	limb12_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 22

	let limb22 = createLimb2();
	limb22.position.set(7,bodyHeight,0);

	scene.add(limb22);

	let limb22_constraint = new Physijs.HingeConstraint(limb21,limb22,new THREE.Vector3(5,bodyHeight,0),new THREE.Vector3(0,0,1));

	scene.addConstraint(limb22_constraint);

	limb22_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 32

	let limb32 = createLimb2();
	limb32.position.set(0,bodyHeight,-7)
	limb32.rotation.y = Math.PI/2;

	scene.add(limb32);

	let limb32_constraint = new Physijs.HingeConstraint(limb31,limb32,new THREE.Vector3(0,bodyHeight,-5),new THREE.Vector3(1,0,0));

	scene.addConstraint(limb32_constraint);

	limb32_constraint.setLimits(-degree,degree,bias,relaxation);

	// Limb 42

	let limb42 = createLimb2();
	limb42.position.set(0,bodyHeight,7)
	limb42.rotation.y = Math.PI/2;

	scene.add(limb42);

	let limb42_constraint = new Physijs.HingeConstraint(limb41,limb42,new THREE.Vector3(0,bodyHeight,5),new THREE.Vector3(1,0,0));

	scene.addConstraint(limb42_constraint);

	limb42_constraint.setLimits(-degree,degree,bias,relaxation);

}

function createTerrain()
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

function createModels()
{
    createTerrain();
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
