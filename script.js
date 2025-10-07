const myCanvas = document.getElementById("myCanvas");
myCanvas.width = 400;
myCanvas.height = 300;

const margin = 30;
const n = 20;
const array = [];
let moves = [];
let isPlaying = false; // 🟢 sorting state (running / paused)
const cols = [];
const spacing = (myCanvas.width - margin * 2) / n;
const ctx = myCanvas.getContext("2d");

const maxColumnHeight = 200;

// initialize once
init();
animate();

let audioCtx = null;

function playNote(freq,type){
    if(audioCtx == null){
        audioCtx = new(
            AudioContext ||
            webkitAudioContext ||
            window.webkitAudioContext
        )()
    }
    const dur = 0.2;
    const osc = audioCtx.createOscillator();
    osc.frequency.value=freq;
    osc.start();
    osc.type=type;
    osc.stop(audioCtx.currentTime+dur);

    const node=audioCtx.createGain();
    node.gain.value = 0.4;
    node.gain.linearRampToValueAtTime(
        0,audioCtx.currentTime+dur
    );
    osc.connect(node);
    node.connect(audioCtx.destination);

}

function init() {
  array.length = 0;
  cols.length = 0;
  moves.length = 0;
  isPlaying = false; // stop sorting when reset

  for (let i = 0; i < n; i++) {
    array[i] = Math.random();
  }

  for (let i = 0; i < array.length; i++) {
    const x = i * spacing + spacing / 2 + margin;
    const y = myCanvas.height - margin - i * 3;
    const width = spacing - 4;
    const height = maxColumnHeight * array[i];
    cols.push(new column(x, y, width, height));
  }

  moves = bubbleSort([...array]); // prepare sorting steps (so ready to resume)
}

function play() {
  isPlaying = !isPlaying; // toggle play/pause
}

function bubbleSort(arr) {
  const moves = [];
  let swapped;
  do {
    swapped = false;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] > arr[i]) {
        swapped = true;
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        moves.push({ indices: [i - 1, i], swap: true });
      } else {
        moves.push({ indices: [i - 1, i], swap: false });
      }
    }
  } while (swapped);
  return moves;
}

function animate() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  let changed = false;
  for (let i = 0; i < cols.length; i++) {
    changed = cols[i].draw(ctx) || changed;
  }

  if (isPlaying && !changed && moves.length > 0) {
    const move = moves.shift();
    const [i, j] = move.indices;
    const waveformType = move.swap?"square":"sine";
    playNote(cols[i].height+cols[j].height,waveformType);
    if (move.swap) {
      const xi = cols[i].x, yi = cols[i].y;
      const xj = cols[j].x, yj = cols[j].y;
      cols[i].moveTo({ x: xj, y: yj });
      cols[j].moveTo({ x: xi, y: yi });
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }else{
        cols[i].jump();
        cols[j].jump();
    }
  }

  requestAnimationFrame(animate);
}
