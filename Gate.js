class LogicGate {
  constructor(type, x, y) {
    this.type = type; // 'AND', 'OR', etc.
    this.x = x;
    this.y = y;
    this.inputs = [0, 0]; // for NOT, only one input
    this.output = 0;
    this.inputConnections = [];
    this.outputConnections = [];
  }

  computeOutput() {
    switch (this.type) {
      case 'AND':
        this.output = this.inputs[0] & this.inputs[1];
        break;
      case 'OR':
        this.output = this.inputs[0] | this.inputs[1];
        break;
      case 'NOT':
        this.output = this.inputs[0] ? 0 : 1;
        break;
      // Add other gate types...
    }
  }
}