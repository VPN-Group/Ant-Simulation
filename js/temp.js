let optimizer = 'adam';

let onlineNetwork = createDeepQLNetwork(actions.length,getPosition(AntBody[0]),getPosition(target));

let cummulativeReward = 0;
let epsilon = 0.1;
let numEpisodes = 10000;
let prevReward = 0;

function createDeepQLNetwork(numActions,bodyPos,destPos)
{
    let model = tf.sequential();
    
    model.add(tf.layers.dense({
        units:250,
        activation:'tanh',
        inputShape:[13]
    }));
    model.add(tf.layers.dense({
        units:175,
        activation:'tanh',
    }));
    model.add(tf.layers.dense({
        units:150,
        activation:'tanh',
    }));
    model.add(tf.layers.dense({
        units:100,
        activation:'tanh'
    }))
    model.add(tf.layers.dense({
        units:50,
        activation:'tanh'
    }))
    model.add(tf.layers.dense({
        units:numActions+1,
        activation:'tanh',
    }));

    model.compile({
        optimizer:optimizer,
        loss:'meanSquaredError'
    });

    return model;
}

function reset()
{
	let posx = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posx = (posx>=-25&&posx<=25)?posx*(2+Math.random()):posx;
	let posz = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posz = (posz>=-25&&posz<=25)?posz*(2+Math.random()):posz;

    target.position.set(posx,-0.5,posz);

	circle.position.set(posx,-0.5,posz);
    AntBody[0].position.set(0,10,0);
    cummulativeReward = 0;
}

function getRandomAction()
{
    let action=new Array(8);

	for(let i=0;i<action.length();i++)
	{
		action[i] = -1 + Math.random()*2;
    }
    
    return action;
}

function getReward(bodyPos,DestPos)
{   
    if(bodyPos[0] === DestPos[0]&&bodyPos[2] === DestPos[2])
        return 100;

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
		constraint[i].enableAngularMotor(action[i],500);
	}

	return getReward(getPosition(AntBody[0]),getPosition(target));
}

function train()
{
    for(let i=0;i<numEpisodes;i++)
    {
        reset();

        // Running for 100 steps
        for(let j=0;j<100;j++)
        {
            let bPos = getPosition(AntBody[0]);
            let dPos = getPosition(target);
    
            let state = actions.concat([bPos[0],bPos[2],dPos[0],dPos[2],prevReward]);
            let action;
            
            if(Math.random() < epsilon)
            {
                action = getRandomAction();
            }
            else 
            {
                let state_tensor = tf.Tensor(state);

                tf.tidy(()=>{
                    action = onlineNetwork.predict(state_tensor);
                })
            }

            let reward = step(action);

            cummulativeReward += reward;

            let state_tensor = tf.Tensor(action);
            onlineNetwrok.fit(state_tensor);
        }
    }
    await onlineNetwork.save('downloads://model');
}