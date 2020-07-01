let genomeSize = 8;
let genomeBound = [0,2];
let generation = 300;
let mutStrength = 2.0;
let steps = 300;

let genome = [];
let parentFitness = 0;

for(let i=0;i<8;i++)
{
    genome[i] = 2*Math.random();
}

function F(x)
{
    return Math.sin(10*x)*x + Math.cos(2*x)*x;
}

function clamp(num, min, max) 
{
    return num <= min ? min : num >= max ? max : num;
}

function makeKid(parent)
{
    let kid = [];
    for(let i=0;i<parent.length;i++)
    {
        kid[i] = parent[i] + mutStrength*Math.random();
        kid[i] = clamp(kid[i],genomeBound[0],genomeBound[1]);
    }
    return kid;
}

function reset()
{
    let posx = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posx = (posx>=-25&&posx<=25)?posx*(2+Math.random()):posx;
	let posz = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posz = (posz>=-25&&posz<=25)?posz*(2+Math.random()):posz;

    target.position.set(posx,-0.5,posz);

    AntBody[0].position.set(0,10,0);
}

function getReward(bodyPos,DestPos)
{   
    if(bodyPos[0] === DestPos[0]&&bodyPos[2] === DestPos[2])
        return 20;

    let x = bodyPos[0]-DestPos[0];
    let y = bodyPos[2]-DestPos[2];

    let distance = Math.floor(Math.sqrt(x*x+y*y));
    let distanceFromOrigin = Math.floor(Math.sqrt(DestPos[0]*DestPos[0]+DestPos[2]*DestPos[2]));

    if(distance > distanceFromOrigin)
        return -10;

    return 10 + 10*(1/distance);
}

function step(action)
{
	for(let i=0;i<constraint.length;i++)
	{
		constraint[i].enableAngularMotor(2*(-1+action[i]),500);
	}
}

function getFitness(genome)
{   
    // reset();
    for(let i=0;i<steps;i++)
    {
        step(genome);
    }
    let reward = getReward(getPosition(AntBody[0]),getPosition(target));
    return reward;
}

function killBad(parent,child)
{
    let childFitness = getFitness(child);
    
    let pTarget = 1/5;
    let ps=0;

    if(parentFitness<childFitness)
    {
        parent = child;
        parentFitness = childFitness;
        ps = 1;
    } 

    mutStrength *= Math.exp(1/(Math.sqrt(genomeSize+1)))*(ps-pTarget)/(1-pTarget);

    return parent;
}

async function runSim()
{
    for(let i=0;i<generation;i++)
    {
        let child = makeKid(genome);
        genome = killBad(genome,child);
    }
}