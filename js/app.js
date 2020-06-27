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

// function createLegs()
// {
//     let limb1 = createLimb1();
//     let limb2 = createLimb2();

//     limb1.position.set(5,5,0);
//     limb2.position.set(2.5,5,0);

//     let hinge_constraint = new Physijs.HingeConstraint(
//         limb1,
//         limb2,
//         new THREE.Vector3(5,7,0),
//         new THREE.Vector3(1,0,0)
//     );

// 	let dot = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32),new THREE.MeshLambertMaterial({color:"rgb(0,255,0"}));
//     dot.position.x = 5;
//     dot.position.y = 3;
//     scene.add(dot);
    
//     scene.add(limb1);
//     scene.add(limb2);
        
// 	scene.addConstraint(hinge_constraint);
	
// 	// hinge_constraint.setLimits(
// 	// 	-Math.PI/3,
// 	// 	Math.PI/3,
// 	// 	0.1,
// 	// 	0.1
// 	// );

// 	// hinge_constraint.enableAngularMotor(10,1);


//     return limb1;
// }

function createAnt()
{
	// duplicate();
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

function duplicate()
{
	var quadrupus = [], constraints = [];

	var box_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial(),
		.4, // low friction
		.6 // high restitution
	);

	var main_body = new THREE.CubeGeometry( 4, 1, 4 );
	var ew_leg = new THREE.CubeGeometry( 6, 0.75, 0.75 );
	var ns_leg = new THREE.CubeGeometry( 0.75, 0.75, 6.0 );
	var ver_leg = new THREE.CubeGeometry( 0.75, 4.0, 0.75 );

	var evo_color = new THREE.Color("rgb(255,0,0)");
	var val_color = new THREE.Color("rgb(0,255,0)");

	var genome;

	var gen = [];

	for (var i = 0; i < 8; ++i) {
		gen.push((-1.0 + 2.0*Math.random()).toFixed(8));
	}

	for (var i = 8; i < 16; ++i) {
		gen.push(100 + Math.floor(100*Math.random()));	
	}

	var index = Math.floor(Math.random() * 16);
	if (index == 16) {
		index = 15;
	}
	if (index < 8) {
		gen[index] = (-1.0 + 2.0*Math.random()).toFixed(8);
	} else {
		gen[index] = Math.floor(200*Math.random());	
	}

	genome = gen.slice();

	var body_height = 16;

	box_material.color = evo_color;

	var joint_range = 1.04719755;

	box = new Physijs.BoxMesh(
		main_body,
		box_material,
		10
	);
	box.position.set(0,body_height,0);
	box.scale.set(1,1,1);
	box.castShadow = true;

	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	let dot = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32),new THREE.MeshLambertMaterial({color:"rgb(0,255,0"}));
	dot.position.x = 0;
	dot.position.y = body_height;
	scene.add(dot);

	scene.add( box );
	quadrupus.push( box );

	// West Upper Leg
	box = new Physijs.BoxMesh(
		ew_leg,
		box_material,
		1
	);
	box.position.set(-5,body_height,0);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	dot = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32),new THREE.MeshLambertMaterial({color:"rgb(0,255,0"}));
	dot.position.x = -2;
	dot.position.y = body_height;
	scene.add(dot);

	scene.add( box );
	quadrupus.push( box );

	var bias = 0.5, relaxation = 0.0;

	// Create Hinge between MB and WUL
	var hinge = new Physijs.HingeConstraint(quadrupus[0],quadrupus[1],new THREE.Vector3(-2,body_height,0),new THREE.Vector3(0,0,1));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// South Upper Leg
	box = new Physijs.BoxMesh(
		ns_leg,
		box_material,
		1
	);
	box.position.set(0,body_height,5);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[0],quadrupus[2],new THREE.Vector3(0,body_height,2),new THREE.Vector3(1,0,0));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// East Upper Leg
	box = new Physijs.BoxMesh(
		ew_leg,
		box_material,
		1
	);
	box.position.set(5,body_height,0);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[0],quadrupus[3],new THREE.Vector3(2,body_height,0),new THREE.Vector3(0,0,-1));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// North Upper Leg
	box = new Physijs.BoxMesh(
		ns_leg,
		box_material,
		1
	);
	box.position.set(0,body_height,-5);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[0],quadrupus[4],new THREE.Vector3(0,body_height,-2),new THREE.Vector3(-1,0,0));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// West Lower Leg
	box = new Physijs.BoxMesh(
		ver_leg,
		box_material,
		1
	);
	box.position.set(-8,body_height-2,0);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[1],quadrupus[5],new THREE.Vector3(-8,body_height,0),new THREE.Vector3(0,0,1));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// South Lower Leg
	box = new Physijs.BoxMesh(
		ver_leg,
		box_material,
		1
	);
	box.position.set(0,body_height-2,8);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[2],quadrupus[6],new THREE.Vector3(0,body_height,8),new THREE.Vector3(1,0,0));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// East Lower Leg
	box = new Physijs.BoxMesh(
		ver_leg,
		box_material,
		1
	);
	box.position.set(8,body_height-2,0);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[3],quadrupus[7],new THREE.Vector3(8,body_height,0),new THREE.Vector3(0,0,-1));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

	// North Lower Leg
	box = new Physijs.BoxMesh(
		ver_leg,
		box_material,
		1
	);
	box.position.set(0,body_height-2,-8);
	box.scale.set(1,1,1);
	box.castShadow = true;

	// Collision filtering to only collide with the ground.
	box._physijs.collision_type = 4;
	box._physijs.collision_masks = 1;
	
	scene.add( box );
	quadrupus.push( box );	

	hinge = new Physijs.HingeConstraint(quadrupus[4],quadrupus[8],new THREE.Vector3(0,body_height,-8),new THREE.Vector3(-1,0,0));//,new THREE.Vector3(0,0,1));
	scene.addConstraint(hinge);
	constraints.push(hinge);
	hinge.setLimits(-joint_range,joint_range,bias,relaxation);

}