// Pop-upvindue kode start
function openPopup() {
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "none";

  document.getElementById("popup-overlay").style.display = "block";
  const popup = document.getElementById("popup");
  popup.style.display = "block";

  setTimeout(() => popup.classList.add("show"), 10);
}

function closePopup() {
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "block";

  const popup = document.getElementById("popup");
  popup.classList.remove("show");

  setTimeout(() => {
    popup.style.display = "none";
    document.getElementById("popup-overlay").style.display = "none";
  }, 350);
}
// Pop-upvindue kode slut

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

      // Try to load previous selections (so queue visible without opening popup)
      try {
        const selRes = await fetch(`/api/party/${partyCode}/selections?memberId=${memberId}`);
        const selData = await selRes.json();
        const genres = selData.genres || [];
        const artists = selData.artists || [];
        // load queue with saved selections (this will POST and store on server)
        await loadQueue(genres, artists);
      } catch (err) {
        console.error("Error loading saved selections / queue:", err);
      }

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
      data: {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              "#ff00aaff",
              "#0478c5ff",
              "#f6ff00ff",
              "#08fbfbff",
              "#ae86ffff",
              "#f97d00ff",
              "#cb032eff",
              "#01ff80ff",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  } catch (err) {
    console.error("Error updating pie chart:", err);
  }
}

window.addEventListener("message", (event) => {
  if (event.data.type === "selectionsUpdated") updatePieChart();
  // When side3 sends genres/artists, forward them to loadQueue (server expects POST to regenerate)
  if (event.data.type === "queueUpdated") {
    const genres = event.data.genres || [];
    const artists = event.data.artists || [];
    loadQueue(genres, artists); // POST generate & store shared queue
  }
});

updatePieChart();
setInterval(updatePieChart, 50000);

// --- Player setup ---
let masterQueue = [];
let playQueue = [];
let currentIndex = 0;
let interval = null;
// track last known queue version to avoid unnecessary re-renders
let lastQueueUpdatedAt = null;

// loadQueue: if genres/artists provided -> POST to regenerate & store on server
// otherwise -> GET to retrieve stored shared queue
async function loadQueue(genres = [], artists = []) {
  const partyCode = localStorage.getItem("partyCode");
  if (!partyCode) return;

  try {
    let res, data;
    if ((genres && genres.length > 0) || (artists && artists.length > 0)) {
      // regenerate and store on server (shared)
      res = await fetch(`/api/party/${partyCode}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres, artists }),
      });
      data = await res.json();
    } else {
      // fetch the currently stored shared queue
      res = await fetch(`/api/party/${partyCode}/queue`);
      data = await res.json();
    }

    // If no data or no playQueue, show message
    const updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString() : null;

    // Only update UI if queue changed
    if (updatedAt && updatedAt === lastQueueUpdatedAt) {
      return;
    }

    lastQueueUpdatedAt = updatedAt;

    masterQueue = data.masterQueue || [];
    playQueue = data.playQueue || [];

    if (playQueue.length > 0) {
      loadSong(0);
      renderQueue(masterQueue);
    } else {
      const queueBox = document.getElementById("queueBox");
      if (queueBox) {
        queueBox.innerHTML =
          "<p>No songs selected yet. Pick a genre or artist!</p>";
      }
    }
  } catch (err) {
    console.error("Error fetching shared queue:", err);
  }
}

// Start polling for updates from server every 4 seconds (so all clients stay in sync)
setInterval(() => {
  loadQueue(); // GET stored queue and update UI when changed
}, 4000);

// Play a song from playQueue
function loadSong(index) {
  clearInterval(interval);
  currentIndex = index;
  if (!playQueue[currentIndex]) return;

  const song = playQueue[currentIndex];
  const artistEl = document.getElementById("artist");
  const titleEl = document.getElementById("title");
  if (artistEl) artistEl.textContent = song.artist;
  if (titleEl) titleEl.textContent = song.title;

  const durationSec = song.duration;
  let elapsedSec = 0;

  const progressFill = document.getElementById("progress-fill");
  const elapsedEl = document.getElementById("elapsed-time");
  const remainingEl = document.getElementById("remaining-time");

  if (elapsedEl) elapsedEl.textContent = formatTime(0);
  if (remainingEl) remainingEl.textContent = "-" + formatTime(durationSec);
  if (progressFill) progressFill.style.width = "0%";

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
    if (progressFill) progressFill.style.width = pct + "%";
    if (elapsedEl) elapsedEl.textContent = formatTime(elapsedSec);
    if (remainingEl) remainingEl.textContent = "-" + formatTime(durationSec - elapsedSec);
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
  if (!queueBox) return;
  queueBox.innerHTML = "<h3>QUEUE:</h3>";

  if (!queue.length) {
    queueBox.innerHTML += "<p>No songs found.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.className = "queue-list";

  queue.forEach((song) => {
    const item = document.createElement("li");
    item.className = "queue-item";
    item.innerHTML = `<strong>${song.title}</strong><br /><em>${song.artist}</em> • ${song.genre}`;
    list.appendChild(item);
  });

  queueBox.appendChild(list);
}

// (removed auto-loadQueue on DOM load)

// Mobile version open/close queue
function toggleQueue() {
  const queue = document.getElementById('queueBox');
  queue.classList.toggle('open');
}