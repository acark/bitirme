//TODO: correct the cable adding function...
//TODO: add event listner to the document and add components to the list
//TODO: before adding elements , create drag and drop feature
//TODO: Create label for some elements

// ui class which paints everything
class SVG {
  constructor() {
    this.svg = document.getElementById("main");
    this.rect = this.svg.getBoundingClientRect();
    this.width = this.rect.width;
    this.height = this.rect.height;
    this.dx = 10;
    this.dy = 10;
    this.components = [];

    //dragging elements
    this.dragState = false;
    this.dragElement = null;
    this.selectedGroupItem = null;
    this.wireDrag = false;
    this.wireDragStartX = null;
    this.wireDragStartY = null;

    // creating new cable
    this.cableState = false;
    this.currentCable = null;
    this.cables = [];

    //FIXME: // test componenets
    this.components.push(new ResistorSymbol(8, 8, 1, 5));
    this.components.push(new ResistorSymbol(3, 8, 1, 7));
    this.components.push(new GroundSymbol(4, 4, 1, 0));
    this.components.push(new ArduinoSymbol(30, 30, 1, 0));
    this.components.push(new LEDsymbol(0, 0, 1, 0));
    this.components.push(new GroundSymbol(9, 9, 1, 0));
    this.components.push(new YellowLEDsymbol(2, 2, 1, 0));
    this.components.push(new BlueLEDsymbol(5, 5, 1, 0));

    // analyse results
    this.results = null;

    this.init();
  }

  // drawing grid view on svg
  drawGrid() {
    for (let i = this.dx; i < this.width; i = i + this.dx) {
      let horizontal = this.drawLine(i, 0, i, this.height, "#999999", 2);
      let vertical = this.drawLine(0, i, this.width, i, "#999999", 2);
      this.svg.appendChild(horizontal);
      this.svg.appendChild(vertical);
    }
  }

  // draw line with svg (for grid layout)
  drawLine(x1, y1, x2, y2, color, w) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", w);
    return line;
  }

  // CONVERSIONS BETWEEN DEVICE COORDINATES AND GRID COORDINATES
  xToDevice(x) {
    return x * this.dx;
  }

  yToDevice(y) {
    return y * this.dy;
  }

  xToGrid(x) {
    return Math.floor(x / this.dx);
  }

  yToGrid(y) {
    return Math.floor(y / this.dx);
  }
  smoothCordiates(x) {
    return this.xToDevice(this.xToGrid(x));
  }

  // draw all elements in component list
  drawElements() {
    this.components.forEach((component) => {
      component.draw(
        component.x,
        component.y,
        this.svg,
        component.id,
        component.png,
        component.pngWidth,
        component.pngHeight
      );
    });
  }

  // draw circle on intersection points (for cables)
  drawCircleOnIntersectionPoints() {
    this.clearUselessCircles();

    this.cables.forEach((cable, index) => {
      // second loop
      this.cables.forEach((cab, i) => {
        if (index !== i) {
          if (cable.x === cab.x && cable.y === cab.y) {
            this.drawCircle(cable.x, cable.y);
          }
          if (cable.x2 === cab.x2 && cable.y2 === cab.y2) {
            this.drawCircle(cable.x2, cable.y2);
          }
          if (cable.x2 === cab.x && cable.y2 === cab.y) {
            this.drawCircle(cab.x, cab.y);
          }
          if (cable.x === cab.x2 && cable.y === cab.y2) {
            this.drawCircle(cab.x2, cab.y2);
          }
        }
      });
    });
  }

  // clears all cable connection circles
  clearUselessCircles() {
    const circles = this.svg.getElementsByTagNameNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    Array.from(circles).forEach((circ) => {
      circ.remove();
    });
  }

  // draw circle on svg (For cable intersections)
  drawCircle(x, y) {
    // draws circle and appends to SVG
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", this.xToDevice(x));
    circle.setAttribute("cy", this.yToDevice(y));
    circle.setAttribute("r", 3.5);
    circle.setAttribute("fill", "red");
    circle.setAttribute("name", "connector");
    this.svg.appendChild(circle);
  }

  // find component by id

  findComponentByID(id) {
    let foundElement;
    this.components.forEach((element) => {
      if (element.id === id) {
        foundElement = element;
      }
    });

    return foundElement;
  }

  // get group element with id -- id is the group id // same with rect and component id
  getSVGgroupElementWithID(id) {
    let foundElement;
    const gElements = this.svg.getElementsByTagNameNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    Array.from(gElements).forEach((g) => {
      if (g.id === id) {
        foundElement = g;
      }
    });

    return foundElement;
  }

  // get image by id
  getImageById(id) {
    let foundElement;
    const images = this.svg.getElementsByTagNameNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    Array.from(images).forEach((img) => {
      if (img.id === id) {
        foundElement = img;
      }
    });

    return foundElement;
  }

  // delete cable by id
  deleteCableFromWires(id) {
    this.cables.forEach((cable, index) => {
      if (cable.id === id) {
        // we remove the item with the same id
        this.cables.splice(index, 1);
      }
    });
  }

  // remove component with specific id (remove from component array)
  removeComponentFromArray(id) {
    this.components.forEach((component, index) => {
      if (component.id === id) {
        this.components.splice(index, 1);
      }
    });
  }

  updateComponentPosition(newX, newY, id) {
    const x = this.xToGrid(newX);
    const y = this.yToGrid(newY);
    const currentElement = this.findComponentByID(id);
    currentElement.x = x;
    currentElement.y = y;
    //update port location of each component // works for arduino ports as well
    currentElement.updatePorts();
    //console.log(currentElement);
  }

  updateWirePositionUI(newX, newY) {
    // first we get the difference between the current position and last position in x and y axis
    const changeInX = newX - this.wireDragStartX;
    const changeInY = newY - this.wireDragStartY;
    // update elements position
    this.dragElement.setAttribute(
      "x1",
      +this.dragElement.getAttribute("x1") + changeInX
    );
    this.dragElement.setAttribute(
      "y1",
      +this.dragElement.getAttribute("y1") + changeInY
    );
    this.dragElement.setAttribute(
      "x2",
      +this.dragElement.getAttribute("x2") + changeInX
    );
    this.dragElement.setAttribute(
      "y2",
      +this.dragElement.getAttribute("y2") + changeInY
    );
    //update drag start position
    this.wireDragStartX = newX;
    this.wireDragStartY = newY;
  }

  // update wire position in wires array
  updateWirePosition(x1, x2, y1, y2, id) {
    //loop all cables and find by id
    this.cables.forEach((cable) => {
      if (cable.id === id) {
        cable.x = this.xToGrid(x1);
        cable.y = this.yToGrid(y1);
        cable.x2 = this.xToGrid(x2);
        cable.y2 = this.yToGrid(y2);
        // update ports
        cable.updatePorts(null, null);
      }
    });
  }

  // IMPORTANT:  function for checking connection between components and creating smthing like a node list

  buildConnection() {
    this.clearAllConnections();

    // cable - cable control
    this.cables.forEach((cable, index) => {
      // second loop
      this.cables.forEach((cab, i) => {
        if (index !== i) {
          if (cable.port1.x === cab.port1.x && cable.port1.y === cab.port1.y) {
            cable.updatePort1(cab);
          } else if (
            cable.port1.x === cab.port2.x &&
            cable.port1.y === cab.port2.y
          ) {
            cable.updatePort1(cab);
          } else if (
            cable.port2.x === cab.port1.x &&
            cable.port2.y === cab.port1.y
          ) {
            cable.updatePort2(cab);
          } else if (
            cable.port2.x === cab.port2.x &&
            cable.port2.y === cab.port2.y
          ) {
            cable.updatePort2(cab);
          }
        }
      });
    });

    // cable - component control

    this.components.forEach((component) => {
      // if component type is not A(arduino)
      this.cables.forEach((cable) => {
        if (component.type !== "A") {
          if (
            cable.port1.x === component.port1.x &&
            cable.port1.y === component.port1.y
          ) {
            cable.updatePort1(component);
            component.updatePort1(cable);
          } else if (
            cable.port2.x === component.port1.x &&
            cable.port2.y === component.port1.y
          ) {
            cable.updatePort2(component);
            component.updatePort1(cable);
          } else if (
            cable.port1.x === component.port2.x &&
            cable.port1.y === component.port2.y
          ) {
            cable.updatePort1(component);
            component.updatePort2(cable);
          } else if (
            cable.port2.x === component.port2.x &&
            cable.port2.y === component.port2.y
          ) {
            cable.updatePort2(component);
            component.updatePort2(cable);
          }
        } else if (component.type === "A") {
          // we will check each arduino pin , and their connection

          // for D1 pin
          if (
            cable.port1.x === component.D1.x &&
            cable.port1.y === component.D1.y
          ) {
            cable.updatePort1(component);
            component.updateD1(cable);
          } else if (
            cable.port2.x === component.D1.x &&
            cable.port2.y === component.D1.y
          ) {
            cable.updatePort2(component);
            component.updateD1(cable);
          }

          // for D2 pin
          else if (
            cable.port1.x === component.D2.x &&
            cable.port1.y === component.D2.y
          ) {
            cable.updatePort1(component);
            component.updateD2(cable);
          } else if (
            cable.port2.x === component.D2.x &&
            cable.port2.y === component.D2.y
          ) {
            cable.updatePort2(component);
            component.updateD2(cable);
          }
        }
      });
    });

    // after bulding node list we analize the circuit
    const analyzer = new Analyse(this.components, this.cables);
    this.results = analyzer.results;
    // switch off leds FIXME:
    this.switchOffUselessLeds(this.results);

    console.log(this.results, "Analizer results in schematic");
  }

  // before updating new connections , clear the old ones
  clearAllConnections() {
    // cable-cable connections

    this.cables.forEach((cable) => {
      cable.port1.connected = [];
      cable.port2.connected = [];
    });

    // cable to component positions

    this.components.forEach((component) => {
      if (component.type !== "A") {
        component.port1.connected = [];
        component.port2.connected = [];
      } else {
        // for arduino we have special case
        component.D1.connected = [];
        component.D2.connected = [];
      }
    });
  }

  // UPDATING D1 STATE IF ANYTHING CHANGE IN ARDUINO PIN D1
  updateD1State(state) {
    if (this.results !== null) {
      this.results.forEach((result) => {
        if (result.node === "D1" && result.result) {
          this.changeLEDstate(state, result.connectedLEDs);
        } else if (result.node === "D1" && !result.result) {
          this.changeLEDstate("off", result.connectedLEDs);
        }
      });

      // if led is not in connected led list , we close the led
    }
  }

  updateD2State(state) {
    if (this.results !== null) {
      this.results.forEach((result) => {
        if (result.node === "D2" && result.result) {
          this.changeLEDstate(state, result.connectedLEDs);
        } else if (result.node === "D2" && !result.result) {
          this.changeLEDstate("off", result.connectedLEDs);
        }
      });
    }
  }

  // change LED states
  changeLEDstate(state, leds) {
    // led is the id of the led
    leds.forEach((led) => {
      const currentLed = this.findComponentByID(led);

      if (state === "on") {
        if (currentLed.color === "red") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledOn.png"
          );
        } else if (currentLed.color === "yellow") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledYellowOn.png"
          );
        } else if (currentLed.color === "blue") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledBlueOn.png"
          );
        }
      } else {
        if (currentLed.color === "red") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/led.png"
          );
        } else if (currentLed.color === "yellow") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledYellowOff.png"
          );
        } else if (currentLed.color === "blue") {
          this.getImageById(led).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledBlueOff.png"
          );
        }
      }
    });
  }

  // FIXME:  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
  switchOffUselessLeds(results) {
    //here we switch off useless leds -- this works after each analysis
    let correctLeds = [];

    results.forEach((result) => {
      if (result.result) {
        result.connectedLEDs.forEach((led) => {
          correctLeds.push(led);
        });
      }
    });

    //console.log(correctLeds,"correct leds");

    // filtering leds
    this.components.forEach((component) => {
      if (component.type === "L") {
        if (component.color === "red" && !correctLeds.includes(component.id)) {
          this.getImageById(component.id).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/led.png"
          );
        } else if (
          component.color === "yellow" &&
          !correctLeds.includes(component.id)
        ) {
          this.getImageById(component.id).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledYellowOff.png"
          );
        } else if (
          component.color === "blue" &&
          !correctLeds.includes(component.id)
        ) {
          this.getImageById(component.id).setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            "./img/ledBlueOff.png"
          );
        }
      }
    });
  }

  // all event listeners for svg
  loadEventListeners() {
    this.svg.addEventListener("mousedown", (e) => {
      //cliked to an element or empty space ???
      if (e.target.nodeName === "image") {
        // start dragging
        this.dragState = true;
        this.dragElement = this.findComponentByID(e.target.getAttribute("id"));
      }
      // cable dragging
      else if (e.target.nodeName === "line") {
        // if we select a cable
        this.wireDrag = true;
        this.cableState = false;
        // starting position of mouse cursor
        this.wireDragStartX = e.offsetX;
        this.wireDragStartY = e.offsetY;
        console.log(e.target.getAttribute("id"), "this one works");
        //selected element for dragging(cable)
        this.dragElement = e.target;
      } else {
        this.cableState = true;
        //FIXME: // rotation is null currently
        this.currentCable = new WireSymbol(
          this.xToGrid(e.offsetX),
          this.yToGrid(e.offsetY),
          null,
          this.svg
        );
        //console.log(this.currentCable);
      }

      // first it clears all connections then rebuild again
      this.buildConnection();
    });

    this.svg.addEventListener("mousemove", (e) => {
      // for cable
      if (this.cableState) {
        // update the cable to the current mouse position
        this.currentCable.drawWire(
          this.xToGrid(e.offsetX),
          this.yToGrid(e.offsetY)
        );
      } else if (this.dragState) {
        const groupElement = this.getSVGgroupElementWithID(this.dragElement.id);
        //FIXME: change the name of smoothCoordinate function
        // changing position of group on UI
        groupElement.setAttribute(
          "transform",
          `translate(${this.smoothCordiates(e.offsetX)},${this.smoothCordiates(
            e.offsetY
          )})`
        );
      } else if (this.wireDrag) {
        this.updateWirePositionUI(e.offsetX, e.offsetY);
      }
    });

    this.svg.addEventListener("mouseup", (e) => {
      // for cable
      if (this.cableState) {
        this.cableState = false;
        this.cables.push(this.currentCable);
        this.currentCable = null;
        // check cable intersections(when we add a new cable we check for intersections(nodes))
        this.drawCircleOnIntersectionPoints();
      } else if (this.dragState) {
        this.dragState = false;
        console.log("dragg stoped !!!!!");
        //updating current components x and y positions
        this.updateComponentPosition(e.offsetX, e.offsetY, this.dragElement.id);
        this.dragElement = null;
      } else if (this.wireDrag) {
        console.log("wire update finished");
        this.wireDrag = false;
        // position them on the grid
        const x1 = this.smoothCordiates(+this.dragElement.getAttribute("x1")),
          x2 = this.smoothCordiates(+this.dragElement.getAttribute("x2")),
          y1 = this.smoothCordiates(+this.dragElement.getAttribute("y1")),
          y2 = this.smoothCordiates(+this.dragElement.getAttribute("y2"));

        this.dragElement.setAttribute("x1", x1);
        this.dragElement.setAttribute("y1", y1);
        this.dragElement.setAttribute("x2", x2);
        this.dragElement.setAttribute("y2", y2);
        // update the wire object
        this.updateWirePosition(x1, x2, y1, y2, this.dragElement.id);
        this.dragElement = null;
        // clear useless circle and build new ones
        this.drawCircleOnIntersectionPoints();
      }

      this.buildConnection();
      console.log(this.components);
      console.log(this.cables);
    });

    // EVENT LISTENER FOR DELETING ITEM FROM UI AND COMPONENT LIST OR CABLE LIST

    document.addEventListener("keydown", (e) => {
      if (e.key === "r") {
        //console.log("r is pressed");

        if (this.dragState) {
          // remove component from uı (group element)
          this.getSVGgroupElementWithID(this.dragElement.id).remove();
          // remove from component list
          this.removeComponentFromArray(this.dragElement.id);
          // reset drag state
          this.dragState = false;
        }

        if (this.wireDrag) {
          // delete cable from ui
          this.dragElement.remove();
          // delete cable from wire array
          this.deleteCableFromWires(this.dragElement.id);
          // reset wire drag state
          this.wireDrag = false;
          // remove unneccasry circles
          this.drawCircleOnIntersectionPoints();
        }
      }
    });
  }

  //initialize everything when page is loaded
  init() {
    // first we draw the grid system
    //this.drawGrid();

    // draw all elements
    this.drawElements();

    this.loadEventListeners();

    this.svg.addEventListener("mousemove", (e) => {
      //console.log(e.target.nodeName);
    });
  }
}

// COMPONENT CLASS
// each component has x and y(in grid system)  and rotation
class Component {
  constructor(x, y, rotation) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
  }

  xToDevice(x) {
    return x * 10;
  }

  yToDevice(y) {
    return y * 10;
  }

  //generate random id for each component
  randID() {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(2, 10);
  }
  // draws component to the given context(SVG);
  draw(x, y, context, id, png, width, height) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    group.setAttribute("height", `${height}`);
    group.setAttribute("width", `${width}`);
    group.id = id;
    group.setAttribute("stroke", "transparent");
    group.setAttribute(
      "transform",
      `translate(${this.xToDevice(x)},${this.yToDevice(y)})`
    );

    // svg image of the component
    const svgimg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    svgimg.setAttributeNS(null, "height", `${height}px`);
    svgimg.setAttributeNS(null, "width", `${width}px`);
    svgimg.setAttributeNS("http://www.w3.org/1999/xlink", "href", `${png}`);
    svgimg.setAttributeNS(null, "visibility", "visible");
    svgimg.setAttribute("id", id);

    group.appendChild(svgimg);
    context.appendChild(group);
  }
}

// SUBCLASSES FOR EACH ELEMENT

class ResistorSymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);
    this.value = value;
    this.type = "R";
    this.id = this.randID();
    this.png = "./img/resistor.png";
    this.pngHeight = 20;
    this.pngWidth = 60;

    // connections with other elements
    this.port1 = { x: this.x, y: this.y + 1, connected: [] };
    this.port2 = { x: this.x + 6, y: this.y + 1, connected: [] };
  }

  // works when element position is changed
  updatePorts(port1, port2) {
    this.port1.x = this.x;
    this.port1.y = this.y + 1;
    this.port2.x = this.x + 6;
    this.port2.y = this.y + 1;
  }

  updatePort1(to) {
    this.port1.connected.push(to);
  }

  updatePort2(to) {
    this.port2.connected.push(to);
  }
}

class LEDsymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);

    this.type = "L";
    this.color = "red";
    this.id = this.randID();
    this.png = "./img/led.png";
    this.pngHeight = 40;
    this.pngWidth = 20;

    this.port1 = { x: this.x, y: this.y + 4, connected: [], type: "kathod" };
    this.port2 = { x: this.x + 2, y: this.y + 4, connected: [], type: "anod" };
  }

  updatePorts() {
    this.port1.x = this.x;
    this.port1.y = this.y + 4;
    this.port2.x = this.x + 2;
    this.port2.y = this.y + 4;
  }

  updatePort1(to) {
    this.port1.connected.push(to);
  }

  updatePort2(to) {
    this.port2.connected.push(to);
  }
}

class GroundSymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);

    this.type = "G";
    this.id = this.randID();
    this.png = "./img/g3496.png";
    this.pngHeight = 40;
    this.pngWidth = 40;
    this.port1 = { x: this.x + 2, y: this.y, connected: [], type: "G" };
    this.port2 = { x: this.x + 2, y: this.y, connected: [], type: "G" };
  }

  // when we move the object , we update the ports location as well
  updatePorts() {
    this.port1.x = this.x + 2;
    this.port1.y = this.y;
    this.port2.x = this.x + 2;
    this.port2.y = this.y;
  }

  //   :)
  updatePort1(to) {
    this.port1.connected.push(to);
    this.port2.connected.push(to);
  }

  updatePort2(to) {
    this.port1.connected.push(to);
    this.port2.connected.push(to);
  }
}

class ArduinoSymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);

    this.type = "A";
    this.id = this.randID();
    this.png = "./img/arduino.png";
    this.pngHeight = 210;
    this.pngWidth = 280;

    // each arduino pin behaves like a component , it has unique id and type
    this.D1 = {
      x: this.x + 25,
      y: this.y + 1,
      connected: [],
      type: "D1",
      id: this.randID(),
    };
    this.D2 = {
      x: this.x + 24,
      y: this.y + 1,
      connected: [],
      type: "D2",
      id: this.randID(),
    };
  }

  updatePorts() {
    this.D1.x = this.x + 25;
    this.D1.y = this.y + 1;
    this.D2.x = this.x + 24;
    this.D2.y = this.y + 1;
  }

  // updating D1 port
  updateD1(to) {
    this.D1.connected.push(to);
  }

  // updating D2 port
  updateD2(to) {
    this.D2.connected.push(to);
  }
}

// Wire class
class WireSymbol extends Component {
  constructor(x, y, rotation, context) {
    super(x, y, rotation);
    this.x2 = x;
    this.y2 = y;
    this.context = context;
    this.line = null;
    this.w = 3; // wire width
    this.color = "red";
    this.id = this.randID();
    this.type = "W";
    this.wireInit();

    // connection
    this.port1 = { x: this.x, y: this.y, connected: [] };
    this.port2 = { x: this.x2, y: this.y2, connected: [] };
  }

  // update port locations
  updatePorts(from, to) {
    this.port1.x = this.x;
    this.port1.y = this.y;
    this.port2.x = this.x2;
    this.port2.y = this.y2;
  }

  //update port1 connections
  updatePort1(to) {
    this.port1.connected.push(to);
  }

  // update port2 connection
  updatePort2(to) {
    this.port2.connected.push(to);
  }

  // update wire end point coordinates while creating cable
  drawWire(x2, y2) {
    // updating new positions
    this.x2 = x2;
    this.y2 = y2;
    // we change the attributes of the line
    this.line.setAttribute("x2", this.xToDevice(x2));
    this.line.setAttribute("y2", this.yToDevice(y2));

    this.updatePorts(null, null);
  }

  wireInit() {
    this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.line.setAttribute("x1", this.xToDevice(this.x));
    this.line.setAttribute("y1", this.yToDevice(this.y));
    this.line.setAttribute("x2", this.xToDevice(this.x2));
    this.line.setAttribute("y2", this.yToDevice(this.y2));
    this.line.setAttribute("stroke", this.color);
    this.line.setAttribute("stroke-width", this.w);
    this.line.setAttribute("stroke-linecap", "round");
    this.line.setAttribute("id", this.id);
    this.context.appendChild(this.line);
  }
}

// Yellow led symbol
class YellowLEDsymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);

    this.type = "L";
    this.color = "yellow";
    this.id = this.randID();
    this.png = "./img/ledYellowOff.png";
    this.pngHeight = 40;
    this.pngWidth = 20;

    this.port1 = { x: this.x, y: this.y + 4, connected: [], type: "kathod" };
    this.port2 = { x: this.x + 2, y: this.y + 4, connected: [], type: "anod" };
  }

  updatePorts() {
    this.port1.x = this.x;
    this.port1.y = this.y + 4;
    this.port2.x = this.x + 2;
    this.port2.y = this.y + 4;
  }

  updatePort1(to) {
    this.port1.connected.push(to);
  }

  updatePort2(to) {
    this.port2.connected.push(to);
  }
}

// Blue led symbol
class BlueLEDsymbol extends Component {
  constructor(x, y, rotation, value) {
    super(x, y, rotation);

    this.type = "L";
    this.color = "blue";
    this.id = this.randID();
    this.png = "./img/ledBlueOff.png";
    this.pngHeight = 40;
    this.pngWidth = 20;

    this.port1 = { x: this.x, y: this.y + 4, connected: [], type: "kathod" };
    this.port2 = { x: this.x + 2, y: this.y + 4, connected: [], type: "anod" };
  }

  updatePorts() {
    this.port1.x = this.x;
    this.port1.y = this.y + 4;
    this.port2.x = this.x + 2;
    this.port2.y = this.y + 4;
  }

  updatePort1(to) {
    this.port1.connected.push(to);
  }

  updatePort2(to) {
    this.port2.connected.push(to);
  }
}

//TODO:   (  common svg elements  )
//<path xmlns="http://www.w3.org/2000/svg" d="M10 15 l15 0 l2.5 -5 l5 10 l5 -10 l5 10 l5 -10 l5 10 l2.5 -5 l15 0" stroke="black" stroke-width="1" stroke-linejoin="bevel" fill="none"/>

// TODO:
// arduino svg

//<path xmlns="http://www.w3.org/2000/svg" gorn="0.2.0.0" id="_x30_.1.0.0" d="m 200.852,0 4.32,4.32 v 32.4 l 7.199,7.2 v 92.879 L 205.172,144 v 4.36 c 0,1.565 -1.271,2.837 -2.834,2.837 -0.002,0 -0.002,0 -0.002,0 H 20.806 c -1.565,0 -2.834,-1.271 -2.834,-2.834 0,0 0,0 0,-0.003 V 2.834 C 17.972,1.269 19.241,0 20.806,0 v 0 h 180.046 m -0.217,50.4 c -0.004,2.505 2.023,4.539 4.527,4.543 2.506,0.004 4.539,-2.023 4.545,-4.528 0,-0.005 0,-0.01 0,-0.016 0.004,-2.505 -2.023,-4.539 -4.528,-4.543 -2.505,-0.004 -4.539,2.022 -4.544,4.527 0,0.007 0,0.012 0,0.017 z m 0,79.2 c -0.004,2.505 2.023,4.539 4.527,4.543 2.506,0.004 4.539,-2.021 4.545,-4.527 0,-0.006 0,-0.011 0,-0.016 0.004,-2.505 -2.023,-4.539 -4.528,-4.543 -2.505,-0.006 -4.539,2.021 -4.544,4.527 0,0.004 0,0.01 0,0.016 z M 56.636,7.2 c -0.004,2.504 2.023,4.539 4.528,4.543 2.504,0.004 4.539,-2.022 4.543,-4.527 0,-0.005 0,-0.011 0,-0.016 0.004,-2.505 -2.024,-4.539 -4.529,-4.542 -2.505,-0.003 -4.539,2.024 -4.542,4.529 0,0.004 0,0.009 0,0.013 z m -3.6,136.8 c -0.003,2.504 2.024,4.537 4.529,4.541 2.505,0.004 4.539,-2.023 4.542,-4.528 0,-0.005 0,-0.009 0,-0.013 0.004,-2.506 -2.024,-4.539 -4.529,-4.543 -2.505,-0.004 -4.538,2.021 -4.542,4.525 0,0.009 0,0.015 0,0.018 z m 107.731,0 c -0.001,0.664 0.536,1.205 1.202,1.207 0.664,0.002 1.205,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.537,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.208,1.203 0,0.003 0,0.005 0,0.006 z m 7.2,0 c -0.002,0.664 0.537,1.205 1.201,1.207 0.666,0.002 1.207,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.207,1.203 0,0.003 0,0.005 0,0.006 z m 7.2,0 c 0,0.664 0.537,1.205 1.203,1.207 0.666,0.002 1.205,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.537,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.209,1.203 0,0.003 0,0.005 0,0.006 z m 7.201,0 c -0.002,0.664 0.536,1.205 1.201,1.207 0.666,0.002 1.206,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.666,0 -1.205,0.537 -1.207,1.203 0,0.003 0,0.005 0,0.006 z m 7.199,0 c -0.002,0.664 0.537,1.205 1.202,1.207 0.665,0.002 1.206,-0.537 1.208,-1.203 0,-0.002 0,-0.004 0,-0.004 0.001,-0.666 -0.537,-1.207 -1.203,-1.209 -0.665,0 -1.205,0.537 -1.207,1.203 0,0.003 0,0.005 0,0.006 z m 7.2,0 c -0.001,0.664 0.536,1.205 1.202,1.207 0.664,0.002 1.205,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.537,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.208,1.203 0,0.003 0,0.005 0,0.006 z m 0.219,-79.2 c -10e-4,0.744 0.601,1.348 1.345,1.349 0.744,0.001 1.352,-0.601 1.352,-1.344 0,-0.001 0,-0.003 0,-0.004 0.002,-0.744 -0.604,-1.347 -1.348,-1.348 -0.744,-0.001 -1.348,0.601 -1.349,1.344 0,0 0,0.002 0,0.003 z m 7.2,0 c -0.001,0.744 0.602,1.348 1.344,1.349 0.744,0.001 1.348,-0.601 1.35,-1.344 0,-0.001 0,-0.003 0,-0.004 0,-0.744 -0.602,-1.347 -1.344,-1.348 -0.744,-0.001 -1.349,0.601 -1.35,1.344 0,0 0,0.002 0,0.003 z m -7.2,7.2 c -10e-4,0.744 0.601,1.347 1.345,1.349 0.744,10e-4 1.352,-0.601 1.352,-1.345 0,-0.001 0,-0.002 0,-0.004 0.002,-0.744 -0.604,-1.347 -1.348,-1.349 -0.744,-10e-4 -1.348,0.601 -1.349,1.345 0,0.001 0,0.003 0,0.004 z m 7.2,0 c -0.001,0.744 0.602,1.347 1.344,1.349 0.744,10e-4 1.348,-0.601 1.35,-1.345 0,-0.001 0,-0.002 0,-0.004 0,-0.744 -0.602,-1.347 -1.344,-1.349 -0.744,-10e-4 -1.349,0.601 -1.35,1.345 0,0.001 0,0.003 0,0.004 z m -7.2,7.2 c -10e-4,0.744 0.601,1.348 1.345,1.35 0.744,0 1.352,-0.602 1.352,-1.346 0,0 0,-0.002 0,-0.004 0.002,-0.742 -0.604,-1.348 -1.348,-1.348 -0.744,-0.002 -1.348,0.6 -1.349,1.344 0,0.002 0,0.004 0,0.004 z m 7.2,0 c -0.001,0.744 0.602,1.348 1.344,1.35 0.744,0 1.348,-0.602 1.35,-1.346 0,0 0,-0.002 0,-0.004 0,-0.742 -0.602,-1.348 -1.344,-1.348 -0.744,-0.002 -1.349,0.6 -1.35,1.344 0,0.002 0,0.004 0,0.004 z M 75.666,16.56 c -10e-4,0.744 0.601,1.347 1.344,1.349 0.744,0.001 1.348,-0.601 1.349,-1.345 0,-0.001 0,-0.002 0,-0.004 0.001,-0.744 -0.601,-1.348 -1.344,-1.349 -0.743,-10e-4 -1.348,0.601 -1.349,1.345 0,10e-4 0,0.003 0,0.004 z m 0,7.2 c -10e-4,0.743 0.601,1.347 1.344,1.348 0.744,0.001 1.348,-0.601 1.349,-1.344 0,-10e-4 0,-0.003 0,-0.004 0.001,-0.744 -0.601,-1.348 -1.344,-1.349 -0.744,-0.001 -1.348,0.601 -1.349,1.344 0,0.002 0,0.004 0,0.005 z m -7.201,-7.2 c -0.001,0.744 0.601,1.347 1.344,1.349 0.744,0.001 1.348,-0.601 1.349,-1.345 0,-0.001 0,-0.002 0,-0.004 0.001,-0.744 -0.601,-1.348 -1.345,-1.349 -0.743,-10e-4 -1.347,0.601 -1.348,1.345 0,10e-4 0,0.003 0,0.004 z m 0,7.2 c -0.001,0.743 0.601,1.347 1.344,1.348 0.744,0.001 1.348,-0.601 1.349,-1.344 0,-10e-4 0,-0.003 0,-0.004 0.001,-0.744 -0.601,-1.348 -1.345,-1.349 -0.743,-0.001 -1.347,0.601 -1.348,1.344 0,0.002 0,0.004 0,0.005 z m -7.2,-7.2 c 0,0.744 0.603,1.346 1.347,1.346 0.744,0 1.346,-0.604 1.346,-1.346 0,-0.743 -0.603,-1.347 -1.346,-1.347 -0.743,0 -1.347,0.603 -1.347,1.347 z m 0,7.2 c 0,0.743 0.603,1.346 1.347,1.346 0.744,0 1.346,-0.603 1.346,-1.346 0,-0.744 -0.603,-1.347 -1.346,-1.347 -0.743,0 -1.347,0.603 -1.347,1.347 z M 134.847,7.2 c -0.001,0.665 0.536,1.206 1.202,1.207 0.664,10e-4 1.205,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.537,-1.206 -1.202,-1.208 -0.665,-0.002 -1.206,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z m -7.2,0 c -0.002,0.665 0.537,1.206 1.202,1.207 0.665,10e-4 1.206,-0.537 1.208,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.536,-1.207 -1.201,-1.209 -0.666,-0.002 -1.207,0.536 -1.209,1.201 0,0.003 0,0.005 0,0.008 z m -7.199,0 c -0.003,0.665 0.535,1.207 1.199,1.208 0.666,0.002 1.207,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.199,-1.209 -0.666,-0.002 -1.207,0.536 -1.209,1.201 0,0.004 0,0.006 0,0.009 z m -7.201,0 c -0.002,0.665 0.535,1.207 1.201,1.208 0.666,0.002 1.207,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.664,-0.002 -1.207,0.536 -1.209,1.201 0,0.004 0,0.006 0,0.009 z m -7.2,0 c -0.002,0.665 0.536,1.207 1.202,1.208 0.664,0.002 1.205,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 0.002,-0.666 -0.537,-1.207 -1.201,-1.209 -0.666,-0.002 -1.207,0.536 -1.208,1.201 -0.002,0.004 -0.002,0.006 -0.002,0.009 z m -7.2,0 c -0.002,0.665 0.535,1.207 1.201,1.208 0.666,0.002 1.207,-0.535 1.208,-1.201 0,-0.002 0,-0.005 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.665,-0.002 -1.207,0.536 -1.208,1.201 0,0.004 0,0.006 0,0.009 z m -7.201,0 c -0.002,0.665 0.536,1.207 1.201,1.208 0.666,0.002 1.207,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 C 94.058,6.533 93.52,5.992 92.855,5.99 92.189,5.988 91.648,6.526 91.646,7.191 c 0,0.004 0,0.006 0,0.009 z m -7.199,0 c -0.002,0.665 0.535,1.207 1.201,1.208 0.665,0.002 1.207,-0.535 1.208,-1.201 0,-0.002 0,-0.005 0,-0.008 C 86.858,6.533 86.321,5.992 85.655,5.99 84.99,5.988 84.448,6.526 84.447,7.191 c 0,0.004 0,0.006 0,0.009 z m -7.2,0 c -0.002,0.665 0.536,1.207 1.201,1.208 0.666,0.002 1.207,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 C 79.659,6.533 79.121,5.992 78.456,5.99 77.791,5.988 77.25,6.526 77.248,7.191 77.247,7.195 77.247,7.197 77.247,7.2 Z m -7.2,0 c -0.002,0.665 0.535,1.207 1.201,1.208 0.666,0.002 1.207,-0.535 1.209,-1.201 0,-0.002 0,-0.005 0,-0.008 C 72.459,6.533 71.921,5.992 71.256,5.99 70.59,5.988 70.049,6.526 70.047,7.191 c 0,0.004 0,0.006 0,0.009 z m 126.72,0 c -0.001,0.665 0.536,1.206 1.202,1.207 0.664,10e-4 1.205,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.537,-1.206 -1.201,-1.208 -0.666,-0.001 -1.207,0.537 -1.208,1.202 0,0.003 0,0.004 0,0.006 z m -7.2,0 c -0.002,0.665 0.537,1.206 1.202,1.207 0.665,10e-4 1.206,-0.537 1.208,-1.202 0,-0.001 0,-0.003 0,-0.005 0.001,-0.666 -0.537,-1.206 -1.203,-1.208 -0.665,-0.001 -1.205,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z m -7.199,0 c -0.002,0.665 0.536,1.206 1.201,1.207 0.666,10e-4 1.206,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.535,-1.206 -1.201,-1.208 -0.666,-0.001 -1.205,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z m -7.201,0 c 0,0.665 0.537,1.206 1.203,1.207 0.666,10e-4 1.205,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.537,-1.206 -1.201,-1.208 -0.666,-0.002 -1.207,0.537 -1.209,1.202 0,0.003 0,0.004 0,0.006 z m -7.2,0 c -0.002,0.665 0.537,1.206 1.201,1.207 0.666,10e-4 1.207,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.535,-1.206 -1.201,-1.208 -0.666,-0.002 -1.207,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z m -7.2,0 c -0.001,0.665 0.536,1.206 1.202,1.207 0.664,10e-4 1.205,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.537,-1.206 -1.201,-1.208 -0.666,-0.001 -1.207,0.537 -1.208,1.202 0,0.003 0,0.004 0,0.006 z m -7.2,0 c -0.002,0.665 0.537,1.206 1.202,1.207 0.665,10e-4 1.206,-0.537 1.208,-1.202 0,-0.001 0,-0.003 0,-0.005 0.001,-0.666 -0.537,-1.206 -1.203,-1.208 -0.665,-0.001 -1.205,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z m -7.199,0 c -0.002,0.665 0.536,1.206 1.201,1.207 0.666,10e-4 1.206,-0.537 1.207,-1.202 0,-0.001 0,-0.003 0,-0.005 0.002,-0.666 -0.535,-1.206 -1.201,-1.208 -0.666,-0.001 -1.205,0.537 -1.207,1.202 0,0.003 0,0.004 0,0.006 z M 103.167,144 c -0.002,0.664 0.535,1.205 1.201,1.207 0.666,0.004 1.207,-0.535 1.208,-1.199 0,-0.004 0,-0.006 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.2,-1.209 -0.666,-0.002 -1.207,0.535 -1.209,1.201 0,0.003 0,0.007 0,0.008 z m -7.199,0 c -0.002,0.664 0.535,1.205 1.201,1.207 0.666,0.004 1.207,-0.535 1.208,-1.199 0,-0.004 0,-0.006 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.2,-1.209 -0.666,-0.002 -1.207,0.535 -1.209,1.201 0,0.003 0,0.007 0,0.008 z m 14.4,0 c -0.002,0.664 0.535,1.205 1.2,1.207 0.665,0.004 1.206,-0.535 1.208,-1.199 0,-0.004 0,-0.006 0,-0.008 0.003,-0.666 -0.535,-1.207 -1.199,-1.209 -0.666,-0.002 -1.207,0.535 -1.209,1.201 0,0.003 0,0.007 0,0.008 z m 7.199,0 c -0.002,0.664 0.535,1.205 1.201,1.207 0.665,0.004 1.206,-0.535 1.209,-1.199 0,-0.004 0,-0.006 0,-0.008 0.002,-0.666 -0.536,-1.207 -1.201,-1.209 -0.666,-0.002 -1.207,0.535 -1.209,1.201 0,0.003 0,0.007 0,0.008 z m 7.2,0 c -0.003,0.664 0.534,1.205 1.2,1.207 0.666,0.004 1.207,-0.535 1.209,-1.199 0,-0.004 0,-0.006 0,-0.008 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.664,-0.002 -1.206,0.535 -1.208,1.201 0,0.003 0,0.007 0,0.008 z m 7.2,0 c -0.002,0.664 0.537,1.205 1.201,1.207 0.666,0.002 1.207,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.207,1.203 0,0.003 0,0.005 0,0.006 z m 7.2,0 c 0,0.664 0.537,1.205 1.203,1.207 0.666,0.002 1.205,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.537,-1.207 -1.201,-1.209 -0.666,0 -1.207,0.537 -1.209,1.203 0,0.003 0,0.005 0,0.006 z m 7.201,0 c -0.002,0.664 0.536,1.205 1.201,1.207 0.666,0.002 1.206,-0.537 1.207,-1.203 0,-0.002 0,-0.004 0,-0.004 0.002,-0.666 -0.535,-1.207 -1.201,-1.209 -0.666,0 -1.205,0.537 -1.207,1.203 0,0.003 0,0.005 0,0.006 z" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:connector-curvature="0" style="fill:#0f7391"/>

// resistor svg

// <path class="cgfx__hitarea" style="fill:#ff0000;" opacity="0" display="inline" d="M3.69-3.66c0-2.16,1.11-2.67,1.11-5.53s-3.35-3.81-3.58-4.55c-0.17-0.53-0.19-0.95-0.19-0.95s0.05-0.25-0.56-0.28s-1.49,0.28-1.49,0.28s-0.02,0.41-0.19,0.95C-1.45-13.01-4.8-12.06-4.8-9.2s1.11,3.37,1.11,5.53c0,0.99,0,6.05,0,7.04c0,2.16-1.11,2.67-1.11,5.53s3.35,3.81,3.58,4.55c0.17,0.53,0.19,0.95,0.19,0.95s-0.01,0.42,0.5,0.42s1.55-0.42,1.55-0.42s0.02-0.41,0.19-0.95c0.23-0.74,3.58-1.69,3.58-4.55S3.69,5.53,3.69,3.38C3.69,2.39,3.69-2.68,3.69-3.66z"></path>

//// led svg

// <g id="id_1788f8b0ce5-fa-38a2702c-fa91-4226-a904-ebed1df5d7ed_14" transform="translate(489.67949967962284,-292.43568100844874) rotate(0) scale(1,1)"><g><path class="cgfx__hitarea" display="inline" style="stroke:#ff0000;fill:none;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" opacity="0" d="M5,0c0,0,0-1.13,0-2.06S2.5-4.48,2.5-5.72s0-4.54,0-4.54"></path><line class="cgfx__hitarea" display="inline" style="stroke:#ff0000;fill:none;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" opacity="0" x1="-5" y1="-10.26" x2="-5" y2="0"></line><path class="cgfx__hitarea" display="inline" style="fill:#ff0000;" opacity="0" d="M5.55-13.41v-8.26c0-3.76-3.04-6.8-6.8-6.8c-3.76,0-6.8,3.04-6.8,6.8v8.26v2.03v3.37c1.38,1.14,3.9,1.91,6.8,1.91c4.37,0,7.91-1.74,7.91-3.88c0-0.23,0-1.15,0-1.4C6.66-12.12,6.25-12.81,5.55-13.41z"></path></g><g transform="translate(-5,0) rotate(90)"><rect x="-4" y="-4" width="8" height="8" fill="#ff0000" fill-opacity="0" stroke="none" title="Katot"></rect><g></g><rect x="-4" y="-4" width="8" height="8" fill="#ff0000" fill-opacity="0" stroke="none" title="" original-title="Katot"></rect></g><g transform="translate(5,0) rotate(90)"><rect x="-4" y="-4" width="8" height="8" fill="#ff0000" fill-opacity="0" stroke="none" title="Anot"></rect><g></g><rect x="-4" y="-4" width="8" height="8" fill="#ff0000" fill-opacity="0" stroke="none" title="" original-title="Anot"></rect></g></g>

// <g><line class="cgfx__hitarea" style="stroke:#ff0000;fill:none;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" opacity="0" display="inline" x1="0" y1="-20" x2="0" y2="20"></line><path class="cgfx__hitarea" style="fill:#ff0000;" opacity="0" display="inline" d="M3.69-3.66c0-2.16,1.11-2.67,1.11-5.53s-3.35-3.81-3.58-4.55c-0.17-0.53-0.19-0.95-0.19-0.95s0.05-0.25-0.56-0.28s-1.49,0.28-1.49,0.28s-0.02,0.41-0.19,0.95C-1.45-13.01-4.8-12.06-4.8-9.2s1.11,3.37,1.11,5.53c0,0.99,0,6.05,0,7.04c0,2.16-1.11,2.67-1.11,5.53s3.35,3.81,3.58,4.55c0.17,0.53,0.19,0.95,0.19,0.95s-0.01,0.42,0.5,0.42s1.55-0.42,1.55-0.42s0.02-0.41,0.19-0.95c0.23-0.74,3.58-1.69,3.58-4.55S3.69,5.53,3.69,3.38C3.69,2.39,3.69-2.68,3.69-3.66z"></path></g>

// led normal
// <g><path class="cgfx__hitarea" display="inline" style="stroke:#ff0000;fill:none;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" opacity="0" d="M5,0c0,0,0-1.13,0-2.06S2.5-4.48,2.5-5.72s0-4.54,0-4.54"></path><line class="cgfx__hitarea" display="inline" style="stroke:#ff0000;fill:none;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" opacity="0" x1="-5" y1="-10.26" x2="-5" y2="0"></line><path class="cgfx__hitarea" display="inline" style="fill:#ff0000;" opacity="0" d="M5.55-13.41v-8.26c0-3.76-3.04-6.8-6.8-6.8c-3.76,0-6.8,3.04-6.8,6.8v8.26v2.03v3.37c1.38,1.14,3.9,1.91,6.8,1.91c4.37,0,7.91-1.74,7.91-3.88c0-0.23,0-1.15,0-1.4C6.66-12.12,6.25-12.81,5.55-13.41z"></path></g>

// TODO:
// M 0 0 L 5 0 L 12 0 L 29 0 L 35 0 L 40 0 M 12 0 C 18 -19 23 -19 29 0    ---> example led styling ....

//const group = `<g transform="translate(${this.xToDevice(x)},${this.yToDevice(y)})"></g>`;

// add the shape of element inside group

// FIXME: UPDATE THIS FUNCTION
// draw component at a given location

// draw(x,y,context,id){

//     // create a group and locate it in a specific position
//     //const group = document.createElement("svg");
//     const group = document.createElementNS("http://www.w3.org/2000/svg","g");

//     group.setAttribute("height","20px");
//     group.setAttribute("width","40px");
//     group.id = id;
//     group.setAttribute("stroke","transparent");

//     group.setAttribute("transform",`translate(${this.xToDevice(x)},${this.yToDevice(y)})`);

//     group.innerHTML = (this.path);

//     // adding bounding rect to the group at the same position for selecting item by attribute
//     const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
//     // this is inside the group , thats why x,y = 0
//     rect.setAttribute("height","20px");
//     rect.setAttribute("width","40px");
//     rect.setAttribute("x",0);
//     rect.setAttribute("y",-10);
//     rect.setAttribute("fill","transparent");
//     //TODO: change this to storoke "none"
//     rect.setAttribute("stroke","black");
//     rect.setAttribute("id",id);

//     var svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
//     svgimg.setAttributeNS(null,'height','20');
//     svgimg.setAttributeNS(null,'width','40');
//     svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', "g3496.png");
//     svgimg.setAttributeNS(null, 'visibility', 'visible');
//     svgimg.setAttribute("a","aaaaaaaaa");

//     group.appendChild(rect);
//     //group.appendChild(svgimg);
//     context.appendChild(group);

//     // TODO:  add explanation for each element //// value - name - position(test)

// }

// new draw component function

// Arduino D1 port
// class ArduninoD1 extends ArduinoSymbol{
//     constructor(x,y,rotation,value){
//         super(x,y,rotation);
//         this.type = "D1";
//         this.id = this.randID;

//         this.D1 = {x:this.x , y:this.y, connected:null};
//         this.port2 = {x:this.x , y:this.y , connected:null};

//     }

//     updatePorts(){
//         update all digital port positions
//         return null

//     }

//     updatePort1(){

//     }

//     updatePort2(){

//     }

// }
