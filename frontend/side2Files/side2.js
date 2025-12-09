function openPopup() {
    document.getElementById("popup-overlay").style.display = "block";
    const popup = document.getElementById("popup");
    popup.style.display = "block";

    setTimeout(() => popup.classList.add("show"), 10); 
}

function closePopup() {
    const popup = document.getElementById("popup");
    popup.classList.remove("show");
    
    setTimeout(() => {
        popup.style.display = "none";
        document.getElementById("popup-overlay").style.display = "none";
    }, 350);
}

window.addEventListener('DOMContentLoaded', async () => {
    const partyName = localStorage.getItem('partyName');
    const partyCode = localStorage.getItem('partyCode');
    const welcomeDiv = document.getElementById('partyWelcome');
    const codeDisplay = document.getElementById('partyCodeDisplay');
    const memberCountDisplay = document.getElementById('memberCount');

    if (welcomeDiv) {
        welcomeDiv.textContent = partyName
            ? `WELCOME TO PARTY: ${partyName}`
            : 'WELCOME TO PARTY';
    }
    
    // Display the party code
    if (codeDisplay && partyCode) {
        codeDisplay.textContent = `PARTY CODE: ${partyCode}`;
        codeDisplay.style.display = 'block';
    }

    // Generate or get unique member ID
    let memberId = localStorage.getItem('memberId');
    if (!memberId) {
        memberId = 'member_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('memberId', memberId);
    }

    // Join the party and get member count
    if (partyCode) {
        try {
            const joinRes = await fetch(`/api/party/${partyCode}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId })
            });
            const joinData = await joinRes.json();
            
            if (memberCountDisplay && joinData.memberCount !== undefined) {
                memberCountDisplay.textContent = joinData.memberCount;
            }

            // Update member count every 3 seconds
            setInterval(async () => {
                try {
                    const countRes = await fetch(`/api/party/${partyCode}/count`);
                    const countData = await countRes.json();
                    if (memberCountDisplay && countData.memberCount !== undefined) {
                        memberCountDisplay.textContent = countData.memberCount;
                    }
                } catch (err) {
                    console.error('Error fetching member count:', err);
                }
            }, 3000);

        } catch (err) {
            console.error('Error joining party:', err);
        }
    }
});



// Initialize pie chart
let genreChart = null;

async function updatePieChart() {
    const partyCode = localStorage.getItem('partyCode');
    if (!partyCode) return;

    try {
        const res = await fetch(`/api/party/${partyCode}/preferences`);
        const data = await res.json();

        if (!data.genres || data.genres.length === 0) {
            // No data yet
            return;
        }

        // Genre names mapping
        const genreNames = {
            1: 'Hip-Hop',
            2: 'Pop',
            3: 'Rock',
            4: 'RnB',
            5: 'Classics',
            6: 'Jazz',
            7: 'Indie',
            8: 'Metal'
        };

        // Prepare chart data
        const labels = data.genres.map(g => genreNames[g.genre_id] || 'Unknown');
        const counts = data.genres.map(g => parseInt(g.count));

        const ctx = document.getElementById('genreChart');
        if (!ctx) return;

        // Destroy existing chart
        if (genreChart) {
            genreChart.destroy();
        }

        // Create new chart
        genreChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error updating pie chart:', err);
    }
}

// Listen for updates from iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'selectionsUpdated') {
        updatePieChart();
    }
    if (event.data.type === 'queueUpdated') {
        fetchQueue(event.data.genres, event.data.artists);
    }
});

// Update chart on load and every 5 seconds
updatePieChart();
setInterval(updatePieChart, 5000);


let songs = [];
let currentIndex = 0;
let interval = null;

async function loadSongs() {
    const response = await fetch("http://localhost:3003/api/songs")
    songs = await response.json();
    loadSong(0);
}

function loadSong(index) {
    clearInterval(interval);
    currentIndex = index;

    const song = songs[index];

    document.getElementById("artist").textContent = song.artist;
    document.getElementById("title").textContent = song.title;

    const durationMs = Number(song.duration_ms);
    const durationSec = Math.floor(durationMs / 1000);

    let elapsedSec = 0;

    const progressFill = document.getElementById("progress-fill");
    const elapsedEl = document.getElementById("elapsed-time");
    const remainingEl = document.getElementById("remaining-time");

    elapsedEl.textContent = formatTime(0);
    remainingEl.textContent = "-" + formatTime(durationSec);
    progressFill.style.width = "0%";

    interval = setInterval(()=> {
        elapsedSec++;

        if (elapsedSec > durationSec) {
            clearInterval(interval);
            currentIndex++;
            if(currentIndex >= songs.lenth) currentIndex = 0;
            loadSong(currentIndex);
            return;
        }

        let pct = (elapsedSec/ durationSec) * 100;
        progressFill.style.width = pct + "%";

        elapsedEl.textContent = formatTime(elapsedSec);
        remainingEl.textContent = "-" + formatTime(durationSec -elapsedSec);
    }, 1000);
}

function formatTime(sec) {
    let m = Math.floor(sec / 60);
    let s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
}

window.addEventListener('DOMContentLoaded', () => {
    loadSongs(); // starter playeren automatisk når siden er loaded
});

async function fetchQueue(genres, artists) {
  const partyCode = localStorage.getItem('partyCode');
  const memberId = localStorage.getItem('memberId');
  if (!partyCode || !memberId) return;

  try {
    const res = await fetch(`/api/party/${partyCode}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, genres, artists })
    });

    const queue = await res.json();
    renderQueue(queue);
  } catch (err) {
    console.error('Error fetching queue:', err);
  }
}

function renderQueue(queue) {
  const queueBox = document.getElementById('queueBox');
  queueBox.innerHTML = '<h3>QUEUE:</h3>';

  if (queue.length === 0) {
    queueBox.innerHTML += '<p>No songs found.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'queue-list';

  queue.forEach(song => {
    const item = document.createElement('li');
    item.className = 'queue-item';
    item.innerHTML = `
      <strong>${song.title}</strong><br />
      <em>${song.artist}</em> • ${song.genre}
    `;
    list.appendChild(item);
  });

  queueBox.appendChild(list);
}