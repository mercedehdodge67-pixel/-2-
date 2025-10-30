/* script.js — precise grid rendering: pixels per unit maps to integer grid intersections */
let x = 3, y = 4, k = 2;
let sketchInstance;

// helpers
function roundTo(n, d){ const p = Math.pow(10, d||2); return Math.round(n*p)/p; }

function updateResultText(name){
  const nx = roundTo(k*x,3), ny = roundTo(k*y,3);
  const dirText = (k < 0) ? 'و در جهت مخالف قرار دارد.' : 'و در همان جهت قرار دارد.';
  const zeroText = (k === 0) ? ' (ضریب صفر است؛ بردار صفر شده).' : '';
  // show as: بردار 2A = (6, 8)
  const kText = (k === 1) ? '' : (k === -1 ? '-' : k.toString());
  const left = (k === 1) ? `${name}` : `${kText}${name}`;
  document.getElementById('resultText').innerText = `بردار ${left} = (${nx}, ${ny}) ${dirText}${zeroText}`;
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const calcBtn = document.getElementById('calcBtn');
  const resetBtn = document.getElementById('resetBtn');
  const nameInput = document.getElementById('name');

  calcBtn.addEventListener('click', () => {
    const xv = parseFloat(document.getElementById('x').value);
    const yv = parseFloat(document.getElementById('y').value);
    const kv = parseFloat(document.getElementById('k').value);

    x = isNaN(xv) ? 0 : xv;
    y = isNaN(yv) ? 0 : yv;
    k = isNaN(kv) ? 1 : kv;
    const name = (nameInput.value || 'A').toString().trim().slice(0,2);
    updateResultText(name);
    if(sketchInstance && typeof sketchInstance.redrawCanvas === 'function') sketchInstance.redrawCanvas();
  });

  resetBtn.addEventListener('click', () => {
    document.getElementById('x').value = 3;
    document.getElementById('y').value = 4;
    document.getElementById('k').value = 2;
    document.getElementById('name').value = 'A';
    x=3; y=4; k=2;
    updateResultText('A');
    if(sketchInstance && typeof sketchInstance.redrawCanvas === 'function') sketchInstance.redrawCanvas();
  });

  updateResultText(document.getElementById('name').value || 'A');
});

// p5 sketch with precise integer-grid mapping
(function(){
  const s = (p) => {
    let unit = 30; // pixels per unit; choose to ensure integer-grid alignment
    p.setup = function(){
      const holder = document.getElementById('sketch-holder');
      const w = Math.max(260, holder.clientWidth - 12);
      p.createCanvas(w, w).parent('sketch-holder');
      p.pixelDensity(1);
      p.noLoop();
      p.redraw();
    };

    p.windowResized = function(){
      const holder = document.getElementById('sketch-holder');
      const w = Math.max(220, holder.clientWidth - 12);
      p.resizeCanvas(w, w);
      // recalc unit to best fit: choose unit so that axes grid centers land on integer pixels
      unit = Math.max(12, Math.round(Math.min(p.width,p.height)/28));
      if(typeof p.redraw === 'function') p.redraw();
    };

    p.redrawCanvas = function(){ p.redraw(); };

    p.draw = function(){
      p.clear();
      // center origin
      p.push();
      p.translate(p.width/2, p.height/2);

      // recompute unit to be integer pixels and to show given vector inside canvas
      // ensure at least 1 unit = 12 px, but try to increase so that vector components map to integer pixels
      const maxComp = Math.max(Math.abs(x), Math.abs(y), Math.abs(k*x), Math.abs(k*y), 1);
      // choose unit so that maxComp * unit fits within half canvas minus margin
      const margin = 40;
      unit = Math.max(12, Math.floor((Math.min(p.width,p.height)/2 - margin) / maxComp));
      // fallback minimal
      unit = Math.max(12, unit);

      // draw grid lines so that grid points correspond to integer units
      p.push();
      p.stroke(220,230,240);
      p.strokeWeight(1);
      const w = p.width, h = p.height;
      const step = unit;
      // vertical lines
      for(let gx = -Math.floor(p.width/2); gx <= Math.floor(p.width/2); gx += step){
        p.line(gx, -p.height/2, gx, p.height/2);
      }
      // horizontal lines
      for(let gy = -Math.floor(p.height/2); gy <= Math.floor(p.height/2); gy += step){
        p.line(-p.width/2, gy, p.width/2, gy);
      }
      p.pop();

      // axes
      p.stroke(140);
      p.strokeWeight(1.6);
      p.line(-p.width/2 + 6, 0, p.width/2 - 6, 0);
      p.line(0, -p.height/2 + 6, 0, p.height/2 - 6);

      // draw tick labels along axes (integers)
      p.noStroke();
      p.fill(70);
      p.textSize(Math.max(12, Math.round(p.width/26)));
      p.textAlign(p.CENTER, p.CENTER);
      // x ticks (positive to right)
      const maxTicks = Math.floor((p.width/2 - 20)/unit);
      for(let i = -maxTicks; i <= maxTicks; i++){
        p.text(i, i*unit, 12);
      }
      // y ticks (positive up)
      for(let j = -maxTicks; j <= maxTicks; j++){
        if(j===0) continue;
        p.text(j, -12, -j*unit);
      }

      // original vector (green) - draw to exact integer grid: x * unit, y * unit
      p.stroke(46,160,113);
      p.strokeWeight(3);
      p.push();
      const gx = Math.round(x) === x ? x : x; // allow decimals but mapping uses unit*value
      const gy = Math.round(y) === y ? y : y;
      const px = x * unit;
      const py = -y * unit; // canvas y flips
      p.line(0,0,px,py);
      drawArrow(p, px, py, 8);
      p.pop();

      // multiplied vector (blue or red)
      const isNeg = (k < 0);
      p.stroke(isNeg ? [224,75,75] : [43,143,214]);
      p.strokeWeight(3.6);
      p.push();
      const mx = k * x;
      const my = k * y;
      const mpx = mx * unit;
      const mpy = -my * unit;
      p.line(0,0,mpx,mpy);
      drawArrow(p, mpx, mpy, 10);
      p.pop();

      // labels top-left
      p.noStroke();
      p.fill(30);
      p.textSize(Math.max(12, Math.round(p.width/28)));
      p.textAlign(p.LEFT, p.TOP);
      p.text(`A(${x}, ${y})`, -p.width/2 + 8, -p.height/2 + 8);
      p.text(`kA(${roundTo(k*x,2)}, ${roundTo(k*y,2)})`, -p.width/2 + 8, -p.height/2 + 28);

      p.pop();
    };

    function drawArrow(p, tx, ty, size){
      p.push();
      p.translate(tx, ty);
      const angle = Math.atan2(ty, tx);
      p.rotate(angle);
      p.fill(30);
      p.noStroke();
      p.triangle(-size, -size/2, -size, size/2, 0, 0);
      p.pop();
    }
  };

  sketchInstance = new p5(s);
  window.addEventListener('resize', () => { if(sketchInstance && typeof sketchInstance.redrawCanvas === 'function') sketchInstance.redrawCanvas(); });
})();
