const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use("/lib",express.static(path.join(__dirname,'/lib')))
app.use("/js",express.static(path.join(__dirname,'/js')));
app.use("/css",express.static(path.join(__dirname,'/css')))
app.use("/textures",express.static(path.join(__dirname,'/textures')))
app.use("/models",express.static(path.join(__dirname,'/models')))

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.set('port',5000);

const server = app.listen(app.get('port'),()=>{
    console.log("Server is running");
});