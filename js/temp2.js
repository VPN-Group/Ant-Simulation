let world;
let camera;
let scene;
let renderer;
let controls;
let container;
let clock;
let plane, cannon_plane;
let bodies=[], cannon_bodies=[];

function init()
{
    initTHREE();
    initCannon();
    createModels();
    createControls();
    animate();
}

function initTHREE()
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

function createModels()
{
    createPlane();
    loadAnt();
    // createAnt();
    // createBall();
}

function loadAnt()
{
    const loader = new THREE.FBXLoader();
    loader.load('models/ant1.fbx', function (model) {
        model.scale.set(1,1,1);
        helper = new THREE.SkeletonHelper(model);
        helper.material.linewidth = 5;
        helper.visible = true;
        arm = model.getObjectByName('Bone');
        console.log(model);
        var body = new CANNON.Body({ mass: 1 });
        model.traverse( function ( child ) {
            if (child.isMesh && child.material) {

                child.castShadow = true;
                child.receiveShadow = true;

                child.material.shininess=10;
                child.material.refractionRatio=1;
                child.material.reflectivity=1;
                child.material.metalness=1;

                child.geometry.computeBoundingBox();
                child.size = child.geometry.boundingBox.getSize(new THREE.Vector3());
                // let ant = new CANNON.Box(child.geometry)
                body.addShape(new CANNON.Box(child.size),child.position);
            }
        } );
        model.position.set(0,10,0);
        model.receiveShadow = true;
        model.castShadow = true;
        scene.add(model);
        scene.add(helper);

        // ant.geometry.computeBoundingBox();
        // ant.geometry.computeBoundingSphere();

        // ant.size = ant.geometry.boundingBox.getSize(new THREE.Vector3());

        // let ant_material = new CANNON.Material("antMaterial");
        // let ant_shape = new CANNON.Box(new CANNON.Vec3().copy(ant.size).scale(0.475));
        // cannon_ant = new CANNON.Body({
        //     mass:500,
        //     material:ant_material
        // });
        // cannon_ant.addShape(ant_shape);
        // world.addBody(cannon_ant); 

        // bodies.push(mant);
        // cannon_bodies.push(cannon_ant);
    });
}

function createPlane()
{
    plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(100,100,100,100), new THREE.MeshPhongMaterial({
        map:new THREE.TextureLoader().load('textures/chess.jpg')
    }));
    plane.useQuaternion = true;

    plane.castShadow = true;
    plane.receiveShadow = true;

    scene.add(plane);

    let plane_material = new CANNON.Material("groundMaterial");
    let plane_shape = new CANNON.Plane();
    cannon_plane = new CANNON.Body({
        mass:0,
        material:plane_material
    });
    cannon_plane.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    cannon_plane.addShape(plane_shape);
    world.addBody(cannon_plane); 

    bodies.push(plane);
    cannon_bodies.push(cannon_plane);
}

function createAnt()
{
    createLegs();
}

function createLegs()
{
    let limb1 = createLimb1();
    let limb2 = createLimb2();

    limb1.castShadow = true;
    limb1.receiveShadow = true;
    limb2.castShadow = true;
    limb2.receiveShadow = true;

    limb1.size = limb1.geometry.boundingBox.getSize(new THREE.Vector3());
    limb2.size = limb2.geometry.boundingBox.getSize(new THREE.Vector3());
    
    scene.add(limb1); 
    scene.add(limb2);

    let limb_material = new CANNON.Material();

    let limb1_shape = new CANNON.Box(new CANNON.Vec3().copy(limb1.size).scale(0.475));
    let cannon_limb1 = new CANNON.Body({
        mass:100,
        material:limb_material
    });
    cannon_limb1.position.set(0,1,0);
    cannon_limb1.addShape(limb1_shape);

    let limb2_shape = new CANNON.Box(new CANNON.Vec3().copy(limb2.size).scale(0.475));
    let cannon_limb2 = new CANNON.Body({
        mass:1,
        material:limb_material
    });
    cannon_limb2.position.set(8,1,0);
    cannon_limb2.addShape(limb2_shape);

    let hinge_constraint = new CANNON.HingeConstraint(cannon_limb1,cannon_limb2,{
        pivotA: new CANNON.Vec3(2.5,0,0),
        axisA: new CANNON.Vec3(1,0,0),
    })

    let dot = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32),new THREE.MeshLambertMaterial({color:"rgb(0,255,0"}));
    dot.position.x = 2.5;
    dot.position.y = 0;
    scene.add(dot);

    world.addConstraint(hinge_constraint);

    hinge_constraint.enableMotor();
    hinge_constraint.setMotorSpeed(5);

    world.addBody(cannon_limb1); 
    world.addBody(cannon_limb2); 

    bodies.push(limb1);
    bodies.push(limb2);
    cannon_bodies.push(cannon_limb1);
    cannon_bodies.push(cannon_limb2);
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

    legGeometry.computeBoundingBox();
    legGeometry.computeBoundingSphere();

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
    
    legGeometry.computeBoundingBox();
    legGeometry.computeBoundingSphere();

    let legMaterial = new THREE.MeshLambertMaterial({
        color:"rgb(255,0,0)",
    });
    let limb = new THREE.Mesh(legGeometry,legMaterial);
    
    return limb
}

function createBall() 
{
    let ball = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshPhongMaterial({
        color:"rgb(255,0,0)",
    }));
    ball.useQuaternion = true;

    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    let ball_material = new CANNON.Material();
    let ball_shape = new CANNON.Sphere(1);
    let cannon_ball = new CANNON.Body({
        mass:1,
        material:ball_material
    });
    cannon_ball.position.set(0,10,0);
    cannon_ball.addShape(ball_shape);
    world.addBody(cannon_ball); 

    bodies.push(ball);
    cannon_bodies.push(cannon_ball);
}

function initCannon()
{
    world = new CANNON.World();
    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
}

function createControls() 
{
    controls = new THREE.FirstPersonControls(camera);
    controls.lookSpeed = 0.05;
    controls.movementSpeed = 10;
}

function animate()
{
    let deltaTime = clock.getDelta();
    requestAnimationFrame(animate);
    updatePhysics();
    controls.update(deltaTime)
    renderer.render(scene,camera);
}

function updatePhysics()
{
    world.step(1/60);
    for(let i=0;i<bodies.length;i++)
    {
        bodies[i].position.copy(cannon_bodies[i].position);
        bodies[i].quaternion.copy(cannon_bodies[i].quaternion);
    }
}

init();