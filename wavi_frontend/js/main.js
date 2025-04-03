const map = L.map('map').setView([10, 10], 3);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let polyline;

async function getRoute() {
  const input = document.getElementById("waypoints").value.trim();
  if (!input) {
    alert("경유지를 입력해주세요.");
    return;
  }

  const response = await fetch("https://wavi-api.onrender.com/route?via=" + encodeURIComponent(input));
  const data = await response.json();
  const resultBox = document.getElementById("result");

  if (data.error) {
    resultBox.innerText = "❌ " + data.error;
    if (polyline) map.removeLayer(polyline);
    return;
  }

  resultBox.innerText = "✅ 경로 계산 완료! 총 이동 수: " + data.total_steps;

  const route = data.route.map(p => [p[0], p[1]]);  // [row, col]
  const latlngs = route.map(p => [p[0], p[1]]);     // Y축 기준 반영

  if (polyline) map.removeLayer(polyline);
  polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);
  map.fitBounds(polyline.getBounds());
}