// MAIN APP FILE

import { parse } from "intel-hex";
import {
  avrInstruction,
  AVRIOPort,
  AVRTimer,
  CPU,
  portDConfig,
  timer0Config,
  PinState,
} from "avr8js";

// editor default value

const defaultCode = `void setup(){
	
	pinMode(1,OUTPUT);
	pinMode(2,OUTPUT);
	
}

void loop(){
	
	
	digitalWrite(1,HIGH);
	digitalWrite(2,LOW);
	delay(1000);
	digitalWrite(1,LOW);
	digitalWrite(2,HIGH);
	delay(1000);
	
}
`;

editor.setValue(defaultCode);
editor.clearSelection();

// UI class
const svg = new SVG();

const run = document.getElementById("runbtn");
const loader = document.querySelector(".loader");
const arduinoList = [];

run.addEventListener("click", () => {
  // create new instance of arduino;
  const arduino = new Arduino(svg);

  if (arduinoList.length !== 0) {
    arduinoList.splice(0, 0);
    console.log("11111");
  } else {
    arduinoList.push(arduino);
  }

  console.log("working....");
});

class Arduino {
  constructor(svg) {
    this.code = editor.getValue();
    this.svg = svg;
    this.compile();
    this.stopBtn = document.getElementById("stopbtn");
    this.stopBtnPressed = false;
    this.init();
  }

  async compile() {
    loader.className = "loader show";

    const result = await fetch("https://hexi.wokwi.com/build", {
      method: "post",
      body: JSON.stringify({ sketch: this.code }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { hex, stderr } = await result.json();

    if (!hex) {
      alert("Server not responding");
      console.log(stderr);
      return;
    }

    console.log(hex);

    const output = parse(hex);

    const programData = new Uint8Array(output.data);
    console.log(programData);

    const cpu = new CPU(new Uint16Array(programData.buffer));
    // setup simulation

    //Attach the virtual hardware
    const port = new AVRIOPort(cpu, portDConfig);

    port.addListener(() => {
      loader.className = "loader";

      //when any change in this port
      const turnOn = port.pinState(1) === PinState.High;
      const turnOn2 = port.pinState(2) === PinState.High;
      //console.log("LED",turnOn);

      if (turnOn) {
        svg.updateD1State("on");
      } else {
        svg.updateD1State("off");
      }

      if (turnOn2) {
        svg.updateD2State("on");
      } else {
        svg.updateD2State("off");
      }
    });

    // in order to detect delay code
    const timer = new AVRTimer(cpu, timer0Config);

    // run simulation
    while (true) {
      for (let i = 0; i < 500; i++) {
        avrInstruction(cpu);
        timer.tick;
      }
      // make sure browser wont freeze
      await new Promise((resolve) => setTimeout(resolve));

      if (this.stopBtnPressed) {
        this.stopBtnPressed = false;
        break;
      }
    }
  }

  init() {
    this.stopBtn.addEventListener("click", () => {
      this.stopBtnPressed = true;
    });
  }
}
