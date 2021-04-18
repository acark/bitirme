

import { parse } from "intel-hex";
const { avrInstruction, AVRIOPort, AVRTimer, CPU, portDConfig, timer0Config, PinState } = require("avr8js");





const code = document.getElementById("editor");
const runBtn = document.getElementById("runbtn");

const led = document.getElementById("led");
const led2 = document.getElementById("led2");


//console.log(code.value);


// functions

// when clicked to run btn , it runs the code
async function runCode(){
    
    // compile arduino source code (we convert the code into machine code)
    //console.log(editor.getValue());

    const result = await fetch("https://hexi.wokwi.com/build",{
        
        method:"post",
        body: JSON.stringify({sketch: editor.getValue()}),
        headers: {
            "Content-Type" : "application/json"
        }
        
    });

    const {hex,stderr} = await result.json();

    if(!hex){

        alert("Server not responding");
        console.log(stderr);
        return;

    }

    console.log(hex);

    const output = parse(hex);
    
    const programData = new Uint8Array(output.data);


    const cpu = new CPU(new Uint16Array(programData.buffer));
    // setup simulation
    

    //Attach the virtual hardware
    const port  = new AVRIOPort(cpu,portDConfig);
    console.log("comes here !!");

    port.addListener(()=>{

        //when any change in this port
        const turnOn = port.pinState(1) === PinState.High;
        const turnOn2 = port.pinState(2) === PinState.High;
        //console.log("LED",turnOn); 

        if(turnOn){
            led.value = true;
        }else{
            led.value = false;
        }


        if(turnOn2){
            led2.value = true;
            
        }else{
            led2.value = false;
        }
    });

    // in order to detect delay code
    const timer = new AVRTimer(cpu,timer0Config);


    // run simulation
    while(true){

        for(let i=0 ; i< 500 ; i++){
            avrInstruction(cpu);
            timer.tick;
        }
        // make sure browser wont freeze
        await new Promise(resolve => setTimeout(resolve));
    }
}




// event listeners
runBtn.addEventListener("click",runCode);
