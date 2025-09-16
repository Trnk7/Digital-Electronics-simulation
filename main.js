// Gate class definition with all gate types
class LogicGate {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.inputs = (type === 'NOT') ? [0] : [0, 0];
    this.output = 0;
    this.width = 80;
    this.height = 50;
    this.selected = false;
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
      case 'NAND':
        this.output = !(this.inputs[0] & this.inputs[1]) ? 1 : 0;
        break;
      case 'NOR':
        this.output = !(this.inputs[0] | this.inputs[1]) ? 1 : 0;
        break;
      case 'XOR':
        this.output = this.inputs[0] ^ this.inputs[1];
        break;
      case 'XNOR':
        this.output = !(this.inputs[0] ^ this.inputs[1]) ? 1 : 0;
        break;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Gate body
    ctx.fillStyle = this.selected ? "#3498db" : "#ddd";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);

    // Gate type text
    ctx.fillStyle = "#333";
    ctx.font = "16px monospace";
    ctx.fillText(this.type, 10, 30);

    // Inputs
    ctx.beginPath();
    let inputY = this.height / (this.inputs.length + 1);
    for (let i = 0; i < this.inputs.length; i++) {
      ctx.arc(0, inputY*(i+1), 8, 0, 2 * Math.PI);
      ctx.fillStyle = this.inputs[i] ? "#27ae60" : "#e74c3c";
      ctx.fill();
      ctx.stroke();
    }

    // Output
    ctx.beginPath();
    ctx.arc(this.width, this.height / 2, 10, 0, 2 * Math.PI);
    ctx.fillStyle = this.output ? "#27ae60" : "#e74c3c";
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// Canvas and gate management
const canvas = document.getElementById('workspace');
const ctx = canvas.getContext('2d');
let gates = [];
let wires = [];
let draggingGate = null;
let offsetX, offsetY;
let connectingFrom = null;

// Add gate from toolbar
window.addGate = function(type) {
  gates.push(new LogicGate(type, 50 + Math.random()*600, 100 + Math.random()*400));
  render();
};

// Drag-and-drop and input toggles support
canvas.addEventListener('mousedown', function(e) {
  const mouse = getMouse(e);
  for (let gate of gates) {
    // Check output node for starting a wire
    let outX = gate.x + gate.width;
    let outY = gate.y + gate.height / 2;
    let outDist = Math.sqrt((mouse.x - outX) ** 2 + (mouse.y - outY) ** 2);
    if (outDist < 12) {
      connectingFrom = { gate, x: outX, y: outY };
      return;
    }

    // Check input nodes for toggling
    let inputY = gate.height / (gate.inputs.length + 1);
    for (let i = 0; i < gate.inputs.length; i++) {
      let nodeX = gate.x;
      let nodeY = gate.y + inputY * (i + 1);
      let dist = Math.sqrt((mouse.x - nodeX) ** 2 + (mouse.y - nodeY) ** 2);
      if (dist < 10) {
        // Only allow toggling if not wired!
        if (!wires.some(w => w.to === gate && w.toInput === i)) {
          gate.inputs[i] = gate.inputs[i] ? 0 : 1;
          render();
        }
        return;
      }
    }

    // Check gate body for dragging
    if (mouse.x >= gate.x && mouse.x <= gate.x + gate.width &&
        mouse.y >= gate.y && mouse.y <= gate.y + gate.height) {
      gate.selected = true;
      draggingGate = gate;
      offsetX = mouse.x - gate.x;
      offsetY = mouse.y - gate.y;
      break;
    }
  }
  render();
});

canvas.addEventListener('mousemove', function(e) {
  if (draggingGate) {
    const mouse = getMouse(e);
    draggingGate.x = mouse.x - offsetX;
    draggingGate.y = mouse.y - offsetY;
    render();
  }
});

canvas.addEventListener('mouseup', function(e) {
  if (draggingGate) {
    draggingGate.selected = false;
    draggingGate = null;
    render();
    return;
  }
  if (connectingFrom) {
    const mouse = getMouse(e);
    for (let gate of gates) {
      let inputY = gate.height / (gate.inputs.length + 1);
      for (let i = 0; i < gate.inputs.length; i++) {
        let nodeX = gate.x;
        let nodeY = gate.y + inputY * (i + 1);
        let dist = Math.sqrt((mouse.x - nodeX) ** 2 + (mouse.y - nodeY) ** 2);
        if (dist < 10) {
          // Prevent multiple wires to the same input
          if (!wires.some(w => w.to === gate && w.toInput === i)) {
            wires.push({
              from: connectingFrom.gate,
              to: gate,
              toInput: i,
            });
            render();
          }
        }
      }
    }
    connectingFrom = null;
  }
});

// Utility to get mouse position relative to canvas
function getMouse(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Main render function
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Propagate wire values
  for (let wire of wires) {
    wire.to.inputs[wire.toInput] = wire.from.output;
  }
  for (let gate of gates) {
    gate.computeOutput();
    gate.draw(ctx);
  }
  // Draw wires
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  for (let wire of wires) {
    let fromX = wire.from.x + wire.from.width;
    let fromY = wire.from.y + wire.from.height / 2;
    let toX = wire.to.x;
    let toY = wire.to.y + wire.to.height / (wire.to.inputs.length + 1) * (wire.toInput + 1);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }
  // Preview wire if connecting
  if (connectingFrom) {
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(connectingFrom.x, connectingFrom.y);
    ctx.lineTo(lastMouse.x, lastMouse.y);
    ctx.stroke();
  }
}

// Support wire preview
let lastMouse = {x:0, y:0};
canvas.addEventListener('mousemove', function(e) {
  lastMouse = getMouse(e);
  if (draggingGate) {
    draggingGate.x = lastMouse.x - offsetX;
    draggingGate.y = lastMouse.y - offsetY;
    render();
  } else if (connectingFrom) {
    render();
  }
});

// Initial render
render();