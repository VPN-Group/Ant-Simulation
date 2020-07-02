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
        if(i<8)
        {
            kid[i] = clamp(kid[i],genomeBound[0],genomeBound[1]);
        }
        else 
        {
            kid[i] = clamp(kid[i],0,150);
        }
    }
    return kid;
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
        return -5;

    return 10 + 10*(1/distance);
}

function step(action)
{
	for(let i=0;i<constraint.length;i++)
	{
        if((round%action[i+8])<action[i+8]/2)
        {
            constraint[i].enableAngularMotor(2*(action[i]),500);
        }
        else 
        {
            constraint[i].enableAngularMotor(-2*(action[i]),500);
        }
	}

	return getReward(getPosition(AntBody[0]),getPosition(target));
}

function getFitness(action)
{       
    return step(action);;
}

function mutation(genome)
{
	let index = Math.floor(Math.random()*16);
    if(index<8)
    {
        genome[index] = Math.random()*2;
    }
    else 
    {
        genome[index] = Math.random()*150;
    }

	return genome;
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
		console.log("child")
    } 
	
    mutStrength *= Math.exp(1/(Math.sqrt(genomeSize+1)))*(ps-pTarget)/(1-pTarget);

    return parent;
}