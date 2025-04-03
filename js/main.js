const canvas = document.getElementById("warehouse");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 20;
let maxRow = 0;
let maxCol = 0;

async function getRoute() {
  const input = document.getElementById("waypoints").value.trim();
  const status = document.getElementById("status");
  if (!input) {
    alert("경유지를 입력해주세요.");
    return;
  }

  const res = await fetch("https://wavi-api.onrender.com/route?via=" + encodeURIComponent(input));
  const data = await res.json();

  if (data.error) {
    status.innerText = "❌ " + data.error;
    return;
  }

  status.innerText = "✅ 총 경로 길이: " + data.total_steps;
  drawGrid(data.grid, data.route, data.start, data.via);
}

function drawGrid(grid, route, start, via) {
  // 먼저 최대 행/열 계산
  maxRow = 0;
  maxCol = 0;
  for (const key in grid) {
    const [r, c] = key.split(",").map(Number);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }

  canvas.width = (maxCol + 2) * CELL_SIZE;
  canvas.height = (maxRow + 2) * CELL_SIZE;

  // 배경 채우기
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 격자 그리기
  for (const key in grid) {
    const [r, c] = key.split(",").map(Number);
    const type = grid[key];
    const x = c * CELL_SIZE;
    const y = r * CELL_SIZE;
    if (type === "warehouse") {
      ctx.fillStyle = "gray";
    } else if (type === "START") {
      ctx.fillStyle = "yellow";
    } else {
      ctx.fillStyle = "white";
    }
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = "#ccc";
    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  // 경로 그리기
  if (route.length >= 2) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < route.length; i++) {
      const [r, c] = route[i];
      const x = c * CELL_SIZE + CELL_SIZE / 2;
      const y = r * CELL_SIZE + CELL_SIZE / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 경유지 점 찍기
  for (const [i, rc] of route.entries()) {
    const [r, c] = rc;
    const x = c * CELL_SIZE + CELL_SIZE / 2;
    const y = r * CELL_SIZE + CELL_SIZE / 2;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
  }
}