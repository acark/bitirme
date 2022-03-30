// ***** Temel Koşullar
// ağacın başlangıç düğümü dijital pinlerden biri olmalı
// Ağacın bitiş düğümü toprak olmalı
// Eğer ağaçta bir Led varsa, en az bir direnç de olmalı
// Ağaçta herhangi bir çevrim olmamalı
// Toprak düğümü dijital pinin yanında ya da ağacın ortasında olamalı

// TODO: remove unecessary comments

class Analyse {
  constructor(componentList, WireList) {
    this.components = componentList;
    this.wires = WireList;
    // if there is no root( d1 or d2) we initilize result array to an empty array with result is false
    this.results = [];
    this.init();
    this.createGraph();
  }

  createGraph() {
    let trees = null;
    // roots are arduino pins
    const roots = this.findRoots();

    // if there is any root
    if (roots.length > 0) {
      trees = this.createTreeForEachRoot(roots);
    }

    if (trees !== null) {
      // then check the conditions for these trees
      if (trees.length > 0) {
        this.results = this.analyseGraph(trees);
      } else {
        console.log("smthing went wrong");
      }
    }
  }

  findRoots() {
    let roots = [];
    this.components.forEach((component) => {
      if (component.type === "A") {
        if (component.D1.connected.length > 0) {
          roots.push(component.D1);
        }
        if (component.D2.connected.length > 0) {
          roots.push(component.D2);
        }
      }
    });

    return roots;
  }

  createTreeForEachRoot(roots) {
    let trees = [];
    roots.forEach((root) => {
      trees.push(this.walk(root));
    });
    return trees;
  }

  /// BFS
  walk(root) {
    let connection = { node: null, connections: [] };
    let flag = true;
    let tree = [];
    let visitedNodes = [root.id];
    let currentElement = root;
    let que = [];

    while (que.length > 0 || flag) {
      que.shift();

      flag = false;
      connection = { node: null, connections: [] };

      connection.node = { type: currentElement.type, id: currentElement.id };

      if (currentElement.type === "D1" || currentElement.type === "D2") {
        currentElement.connected.forEach((connectedElement) => {
          if (!visitedNodes.includes(connectedElement.id)) {
            connection.connections.push({
              type: connectedElement.type,
              id: connectedElement.id,
            });
            que.push(connectedElement);
            visitedNodes.push(connectedElement.id);
          }
        });
      } else {
        if (currentElement.port1.connected !== []) {
          currentElement.port1.connected.forEach((connectedElement) => {
            if (
              !visitedNodes.includes(connectedElement.id) &&
              connectedElement.type !== "A"
            ) {
              connection.connections.push({
                type: connectedElement.type,
                id: connectedElement.id,
              });
              que.push(connectedElement);
              visitedNodes.push(connectedElement.id);
            }
          });
        }

        if (currentElement.port2.connected !== []) {
          currentElement.port2.connected.forEach((connectedElement) => {
            if (
              !visitedNodes.includes(connectedElement.id) &&
              connectedElement.type !== "A"
            ) {
              connection.connections.push({
                type: connectedElement.type,
                id: connectedElement.id,
              });
              que.push(connectedElement);
              visitedNodes.push(connectedElement.id);
            }
          });
        }
      }

      if (connection.node !== null && connection.connections !== []) {
        tree.push(connection);
      }
      currentElement = que[0];
    }

    //console.log(tree,"tree");
    return tree;
  }

  // analyse the tree and return true or false

  analyseGraph(trees) {
    let nodeList = [];
    let result = true;
    let resultArray = [];
    let connectedLEDsArray = [];

    console.log(trees, "this is my tree !!!!!");

    // iterate each different tree
    trees.forEach((tree) => {
      // iterate nodes inside the tree
      tree.forEach((node) => {
        nodeList.push(node.node.type);
        // leds id
        if (node.node.type === "L") {
          connectedLEDsArray.push(node.node.id);
        }
      });

      if (!this.checkNodeList(nodeList)) {
        result = false;
      }

      if (result) {
        resultArray.push({
          node: nodeList[0],
          result: true,
          connectedLEDs: connectedLEDsArray,
        });
      } else {
        resultArray.push({
          node: nodeList[0],
          result: false,
          connectedLEDs: connectedLEDsArray,
        });
      }

      // reset result and result array !!!!!!!!!!!!!!
      result = true;
      nodeList = [];
      connectedLEDsArray = [];
    });

    console.log(resultArray, "this is result array");
    return resultArray;
  }

  checkNodeList(list) {
    let nodeArray = [];
    let result = true;

    if (list.length > 0) {
      // create nodeArray without wires
      list.forEach((node) => {
        if (node !== "W") {
          nodeArray.push(node);
        }
      });

      console.log(nodeArray);

      // check for conditions

      if (nodeArray[0] !== "D1" && nodeArray[0] !== "D2") {
        result = false;
      }

      if (nodeArray[nodeArray.length - 1] !== "G") {
        result = false;
      }

      if (nodeArray.indexOf("G") !== nodeArray.length - 1) {
        result = false;
      }

      if (nodeArray.indexOf("L") === -1) {
        result = false;
      }

      if (nodeArray.indexOf("R") === -1) {
        result = false;
      }

      console.log(result);
      return result;
    }
  }

  init() {
    this.results.push({ node: "D1", result: false, connectedLEDs: [] });
    this.results.push({ node: "D2", result: false, connectedLEDs: [] });
  }
}
