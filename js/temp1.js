let cummulativeReward=[];

function reset()
{
    let posx = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posx = (posx>=-25&&posx<=25)?posx*(2+Math.random()):posx;
	let posz = 25*(1+Math.random())*((Math.random()>0.5)?1:-1);
	posz = (posz>=-25&&posz<=25)?posz*(2+Math.random()):posz;

    target.position.set(posx,-0.5,posz);

    AntBody[0].position.set(0,10,0);
    cummulativeReward = 0;
}
class Memory
{
    constructor(max_size) 
    {
        this.max_size = max_size;
        this.buffer = new Array(max_size);

        for(let i=0;i<max_size;i++)
        {
            this.buffer[i]=null;
        }

        this.index = 0;
        this.length = 0;

        this.bufferIndices = [];
    }

    len()
    {
        return this.length;
    }

    push(state,action,reward,nextState,done)
    {
        this.bufferIndices.push(this.index);
        let experience = [state,action,reward,nextState,done]
        this.buffer[this.index] = experience;
        this.index+=1;
        this.length+=1; 
    }

    sample(batchSize)
    {
        tf.util.shuffle(this.bufferIndices);

        let stateBatch=[];
        let actionBatch=[];
        let rewardBatch=[];
        let nextStateBatch=[];
        let doneBatch=[];

        for(let i=0;i<batchSize;i++)
        {
            stateBatch.push(this.buffer[this.bufferIndices[i]][0]);
            actionBatch.push(this.buffer[this.bufferIndices[i]][1]);
            rewardBatch.push(this.buffer[this.bufferIndices[i]][2]);
            nextStateBatch.push(this.buffer[this.bufferIndices[i]][3]);
            doneBatch.push(this.buffer[this.bufferIndices[i]][4]);
        }

        return [stateBatch,actionBatch,rewardBatch,nextStateBatch,doneBatch];
    }
}

class DeepDPG
{
    constructor(numStates,numActions,actorLR=0.001,criticLR=0.01,gamma=0.99,tau=0.01,maxMemory=50000) 
    {
        this.numStates = numStates;
        this.numActions = numActions;
        this.gamma = gamma;
        this.tau = tau;        
        this.actorLR = actorLR;
        this.criticLR = criticLR;

        this.actor = this.actorModel(this.numStates,this.numActions);
        this.actorTarget = this.actorModel(this.numStates,this.numActions);
        this.critic = this.criticModel(this.numStates+this.numActions,this.numActions);
        this.criticTarget = this.criticModel(this.numStates+this.numActions,this.numActions);
    
        this.actorTarget.setWeights(this.actor.getWeights());
        this.criticTarget.setWeights(this.critic.getWeights());

        this.memory = new Memory(maxMemory);
        this.criticCriterion = 'meanSquaredError';
        this.actorOptimizer = 'adam';
        this.criticOptimizer = 'adam';

        this.actor.compile({
            optimizer:tf.train.adam(this.actorLR),
            loss:this.criticCriterion
        });

        this.actorTarget.compile({
            optimizer:tf.train.adam(this.actorLR),
            loss:this.criticCriterion
        });

        this.critic.compile({
            optimizer:tf.train.adam(this.criticLR),
            loss:this.criticCriterion,
            
        });

        this.criticTarget.compile({
            optimizer:tf.train.adam(this.criticLR),
            loss:this.criticCriterion
        });
    }    

    actorModel(inputSizeState,outputSize)
    {
        let model = tf.sequential();

        model.add(tf.layers.dense({
            units:256,
            activation:'relu',
            inputShape:[inputSizeState]
        }));

        model.add(tf.layers.dense({
            units:256,
            activation:'relu'
        }));

        model.add(tf.layers.dense({
            units:150,
            activation:'relu'
        }));
        
        model.add(tf.layers.dense({
            units:100,
            activation:'relu'
        }));

        model.add(tf.layers.dense({
            units:outputSize,
            activation:'tanh'
        }));

        return model;
    }

    criticModel(inputSize,outputSize)
    {
        let model = tf.sequential();

        model.add(tf.layers.dense({
            units:256,
            activation:'relu',
            inputShape:[inputSize]
        }));

        model.add(tf.layers.dense({
            units:256,
            activation:'relu'
        }));

        model.add(tf.layers.dense({
            units:150,
            activation:'relu'
        }));
        
        model.add(tf.layers.dense({
            units:100,
            activation:'relu'
        }));

        model.add(tf.layers.dense({
            units:outputSize,
            activation:'tanh'
        }));

        return model;
    }

    getAction(state)
    {
        state = tf.Tensor(state);
        action = this.actor.predict(state);
        return action;
    }

    update(batchSize)
    {
        [states,actions,rewards,nextStates,done] = this.memory.sample(batchSize);
        states = tf.Tensor(states);
        actions = tf.Tensor(actions);
        rewards = tf.Tensor(rewards);
        nextStates = tf.Tensor(nextStates);

        let Qvals = this.critic.predict(states,actions);
        let nextActions = this.actorTarget.predict(nextStates);
        let nextQ = this.criticTarget.predict(nextStates,nextActions);
        let Qprime = rewards+this.gamma*nextQ;
        
        this.actor.fit(Qvals,Qprime);
        this.critic.fit(states,this.actor.predict(states));

        this.actorTarget.setWeights(this.actor.getWeights()*this.tau+(1.0-this.tau)*this.actorTarget.getWeights());
        this.criticTarget.setWeights(this.critic.getWeights()*this.tau+(1.0-this.tau)*this.criticTarget.getWeights());
    }
}

function getStates()
{
    let b = getPosition(AntBody[0]);
    let t = getPosition(target);

    return [b[0],b[2],t[0],t[2]];
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
    let done = 0;
    let b = getPosition(AntBody[0]);
    let t = getPosition(target);

    if(b[0]==t[0]&&t[2]==b[2])
        done=1;

	return [getReward(getPosition(AntBody[0]),getPosition(target)),getStates(),1];
}

function trainModel()
{

    let agent = new DeepDPG(4,8);
    let batchSize = 32;
    // No of episodes
    let state = getStates();
    let episodeReward = 0;
    for(let i=0;i<100;i++)
    {
        reset();
        episodeReward = 0;
        
        for(let j=0;j<500;j++)
        {
            let action = agent.getAction(tf.Tensor(state));
            [newState,reward,done] = step(action);
            agent.memory.push(state,action,reward,newState,done);

            if(agent.memory.len()>batchSize)
                agent.update();
            
            state = newState;
            episodeReward+=reward;

            if (done)
            {
                console.log(done);
            }
        }
        cummulativeReward.push(episodeReward);
        agent.actor.save('downloads://actorModel');
        agent.critic.save('downloads://criticModel');
        agent.actorTarget.save('downloads://actorTargetModel');
        agent.criticTarget.save('downloads://criticTargetModel');
    }
    
}