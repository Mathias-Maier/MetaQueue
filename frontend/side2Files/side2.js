// Pop-upvindue kode start
function openPopup() {
  // Hide QR while popup is open
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "none";

  document.getElementById("popup-overlay").style.display = "block";
  const popup = document.getElementById("popup");
  popup.style.display = "block";

  setTimeout(() => popup.classList.add("show"), 10);
}

function closePopup() {
  // Show QR again when popup closes
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "block";

  const popup = document.getElementById("popup");
  popup.classList.remove("show");

  setTimeout(() => {
    popup.style.display = "none";
    document.getElementById("popup-overlay").style.display = "none";
  }, 350);
}
//Pop-upvindue kode slut

// --- Party setup ---
window.addEventListener("DOMContentLoaded", async () => {
  const partyName = localStorage.getItem("partyName");
  const partyCode = localStorage.getItem("partyCode");
  const welcomeDiv = document.getElementById("partyWelcome");
  const codeDisplay = document.getElementById("partyCodeDisplay");
  const memberCountDisplay = document.getElementById("memberCount");

  if (welcomeDiv) {
    welcomeDiv.textContent = partyName
      ? `WELCOME TO PARTY: ${partyName}`
      : "WELCOME TO PARTY";
  }

  if (codeDisplay && partyCode) {
    codeDisplay.textContent = `PARTY CODE: ${partyCode}`;
    codeDisplay.style.display = "block";
  }

  let memberId = localStorage.getItem("memberId");
  if (!memberId) {
    memberId = "member_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("memberId", memberId);
  }

  if (partyCode) {
    try {
      const joinRes = await fetch(`/api/party/${partyCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const joinData = await joinRes.json();
      if (memberCountDisplay && joinData.memberCount !== undefined) {
        memberCountDisplay.textContent = joinData.memberCount;
      }

      setInterval(async () => {
        try {
          const countRes = await fetch(`/api/party/${partyCode}/count`);
          const countData = await countRes.json();
          if (memberCountDisplay && countData.memberCount !== undefined) {
            memberCountDisplay.textContent = countData.memberCount;
          }
        } catch (err) {
          console.error("Error fetching member count:", err);
        }
      }, 3000);
    } catch (err) {
      console.error("Error joining party:", err);
    }
  }
});

// --- Pie chart setup ---
let genreChart = null;
async function updatePieChart() {
  const partyCode = localStorage.getItem("partyCode");
  if (!partyCode) return;

  try {
    const res = await fetch(`/api/party/${partyCode}/preferences`);
    const data = await res.json();
    if (!data.genres || data.genres.length === 0) return;

    const genreNames = {
      1: "Hip-Hop",
      2: "Pop",
      3: "Rock",
      4: "RnB",
      5: "Classics",
      6: "Jazz",
      7: "Indie",
      8: "Metal",
    };

    const labels = data.genres.map((g) => genreNames[g.genre_id] || "Unknown");
    const counts = data.genres.map((g) => parseInt(g.count));

    const ctx = document.getElementById("genreChart");
    if (!ctx) return;

    if (genreChart) genreChart.destroy();

    genreChart = new Chart(ctx, {
      type: "pie",
      data: { labels, datasets: [{ data: counts, backgroundColor: ["#ff00aaff","#0478c5ff","#f6ff00ff","#08fbfbff","#ae86ffff","#f97d00ff","#cb032eff","#01ff80ff"] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "bottom" } } },
    });
  } catch (err) {
    console.error("Error updating pie chart:", err);
  }
}

window.addEventListener("message", (event) => {
  if (event.data.type === "selectionsUpdated") updatePieChart();
  if (event.data.type === "queueUpdated") loadQueue(event.data.genres, event.data.artists);
});

updatePieChart();
setInterval(updatePieChart, 50000);

// --- Player setup ---
let masterQueue = [];
let playQueue = [];
let currentIndex = 0;
let interval = null;

// Load queue from backend
async function loadQueue(genres = [], artists = []) {
  const partyCode = localStorage.getItem("partyCode");
  const memberId = localStorage.getItem("memberId");
  if (!partyCode || !memberId) return;

  try {
    const res = await fetch(`/api/party/${partyCode}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, genres, artists }),
    });

    const data = await res.json();
    masterQueue = data.masterQueue || [];
    playQueue = data.playQueue || [];

    if (playQueue.length > 0) {
      loadSong(0);
      renderQueue(masterQueue);
    } else {
      const queueBox = document.getElementById("queueBox");
      queueBox.innerHTML = "<p>No songs selected yet. Pick a genre or artist!</p>";
    }
  } catch (err) {
    console.error("Error fetching queue:", err);
  }
}

// Play a song from playQueue
function loadSong(index) {
  clearInterval(interval);
  currentIndex = index;
  if (!playQueue[currentIndex]) return;

  const song = playQueue[currentIndex];
  document.getElementById("artist").textContent = song.artist;
  document.getElementById("title").textContent = song.title;

  const durationSec = song.duration;
  let elapsedSec = 0;

  const progressFill = document.getElementById("progress-fill");
  const elapsedEl = document.getElementById("elapsed-time");
  const remainingEl = document.getElementById("remaining-time");

  elapsedEl.textContent = formatTime(0);
  remainingEl.textContent = "-" + formatTime(durationSec);
  progressFill.style.width = "0%";

  interval = setInterval(() => {
    elapsedSec++;
    if (elapsedSec > durationSec) {
      clearInterval(interval);
      currentIndex++;
      if (currentIndex >= playQueue.length) currentIndex = 0;
      loadSong(currentIndex);
      return;
    }

    const pct = (elapsedSec / durationSec) * 100;
    progressFill.style.width = pct + "%";
    elapsedEl.textContent = formatTime(elapsedSec);
    remainingEl.textContent = "-" + formatTime(durationSec - elapsedSec);
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" + s : s}`;
}

// Render the master queue for search/display
function renderQueue(queue) {
  const queueBox = document.getElementById("queueBox");
  queueBox.innerHTML = "<h3>QUEUE:</h3>";
  if (!queue.length) { 
    queueBox.innerHTML += "<p>No songs found.</p>"; 
    return; 
  }

  const list = document.createElement("ul");
  list.className = "queue-list";

  queue.forEach(song => {
    const item = document.createElement("li");
    item.className = "queue-item";
    item.innerHTML = `<strong>${song.title}</strong><br /><em>${song.artist}</em> • ${song.genre}`;
    list.appendChild(item);
  });

  queueBox.appendChild(list);
}

// ✅ Removed automatic loadQueue() on DOMContentLoaded
// Queue now only loads when side3.js sends the queueUpdated message
