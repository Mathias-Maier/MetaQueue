// Bruges til at åbne et pop up vindue på siden.
function openPopup() {
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "none";
//Skjuler QR-koden, hvis den findes, når pop-up åbnes

  document.getElementById("popup-overlay").style.display = "block";
  const popup = document.getElementById("popup");
  popup.style.display = "block";
//Viser overlay (baggrund) og selve pop-up vinduet

//Tilføjer CSS-klassen show kort efter, så pop-up animeres ind
  setTimeout(() => popup.classList.add("show"), 10);
}

//Bruges til at lukke pop-up vinduet
function closePopup() {
  const qr = document.getElementById("qrCode");
  if (qr) qr.style.display = "block";
  //Viser QR-koden igen, når pop-up lukkes

  const popup = document.getElementById("popup");
  popup.classList.remove("show");
  //Fjerner show-klassen → starter lukke-animation

  setTimeout(() => {
    popup.style.display = "none";
    document.getElementById("popup-overlay").style.display = "none";
  }, 350);
  //Efter animationen (350 ms) skjules popup og overlay fuldstændigt

}
//openPopup() viser et pop-up vindue med animation, og skjuler QR-koden.
//closePopup() skjuler pop-up vinduet igen og viser QR-koden.
// Pop-upvindue kode slut

// --- Party setup ---
//Når siden er færdig med at loade
window.addEventListener("DOMContentLoaded", async () =>
  //Koden starter når HTML’en er klar
  // Vi bruger async fordi vi laver fetch kald til serveren
   {
    //Hent info fra localStorage
  const partyName = localStorage.getItem("partyName");
  const partyCode = localStorage.getItem("partyCode");
  //Gemte data fra forsiden (oprettet/tilmeldt fest)
  // partyName = navn på festen
  // partyCode = kode for festen

  //Finder HTML-elementer hvor vi vil vise navn, kode og medlemstal
  const welcomeDiv = document.getElementById("partyWelcome");
  const codeDisplay = document.getElementById("partyCodeDisplay");
  const memberCountDisplay = document.getElementById("memberCount");

//Vis festens navn og kode
  if (welcomeDiv) {
    welcomeDiv.textContent = partyName
      ? `WELCOME TO PARTY: ${partyName}`
      : "WELCOME TO PARTY";
  }
  if (codeDisplay && partyCode) {
    codeDisplay.textContent = `PARTY CODE: ${partyCode}`;
    codeDisplay.style.display = "block";
    //Opdaterer HTML med festens navn og kode
  }
  

  //Opret unik memberId hvis bruger ikke har én
  let memberId = localStorage.getItem("memberId");
  if (!memberId) {
    memberId = "member_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("memberId", memberId);
    //Hver deltager får et unikt id
    //Gemmes i browseren, så vi kan kende brugeren næste gang
  }


  //Tilmeld medlemmet til festen
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
        //Sender memberId til serveren for at tilføje brugeren
        //Serveren svarer med opdateret antal medlemmer
        //Vises i HTML
      }
       //Opdater medlemstal live
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
      //Henter medlemstal hver 3. sekund
      // Holder medlemstallet opdateret live på siden

      // Hent tidligere gemte musikvalg
      try {
        const selRes = await fetch(`/api/party/${partyCode}/selections?memberId=${memberId}`);
        const selData = await selRes.json();
        const genres = selData.genres || [];
        const artists = selData.artists || [];
        await loadQueue(genres, artists);
        //Spørger serveren hvilke genrer og artister brugeren tidligere valgte
        // Bruges til at indlæse musikkøen, så det ser korrekt ud med det samme

        //Fejl-håndtering
        //inner catch
      } catch (err) {
        console.error("Error loading saved selections / queue:", err);
        //Forsøger at hente tidligere gemte musikvalg fra serveren
        // Hvis der sker en fejl (f.eks. server ikke svarer),
        //  bliver det logget i konsollen, men det stopper ikke resten af koden
      }
      // outer try catch
    } catch (err) {
      console.error("Error joining party:", err);
      //Forsøger at tilmelde brugeren til festen på serveren
      // Hvis det fejler, f.eks. server offline, bliver fejlen logget i konsollen
    }
  }
  //Når siden loader, hentes festens navn og kode fra browseren. 
  // Brugeren får et unikt memberId og tilmeldes festen på serveren. Medlemstal vises live, 
  // og tidligere musikvalg hentes, så køen kan vises korrekt.
});

// Pie chart setup 
//Variable & Function
let genreChart = null;
async function updatePieChart()
//genreChart husker diagrammet, så vi kan slette/genskabe det
// updatePieChart() henter festens musik-præferencer og opdaterer diagrammet
 {
  //Hent festkode
  const partyCode = localStorage.getItem("partyCode");
  if (!partyCode) return;
  //Finder hvilken fest vi er i
  // Hvis der ingen fest er, stopper funktionen

  //Hent data fra serveren
  try {
    const res = await fetch(`/api/party/${partyCode}/preferences`);
    const data = await res.json();
    if (!data.genres || data.genres.length === 0) return;
    //Kalder /preferences endpoint for at få hvor mange har valgt hvilke genrer
    // Stopper hvis der ingen data er


    //Lav labels og counts
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
//Omformer genre_id til menneskeligt navn (Hip-Hop, Pop osv.)
// Gemmer antal valg per genre

//Tegn diagrammet
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
        //Finder <canvas> elementet på siden
        // Sletter tidligere diagram hvis der er et
        // Tegner nyt cirkeldiagram med genre labels og antal
      },
    });
    //Error handling
  } catch (err) {
    console.error("Error updating pie chart:", err);
    //Hvis noget går galt med at hente data eller tegne diagrammet, 
    // viser vi fejlen i konsollen
    // Forhindrer, at hele siden crasher
  }
  
}
//Event listener
window.addEventListener("message", (event) => {
  if (event.data.type === "selectionsUpdated") updatePieChart();
  if (event.data.type === "queueUpdated") {
    const genres = event.data.genres || [];
    const artists = event.data.artists || [];
    loadQueue(genres, artists); 
    //Lytter på beskeder sendt fra andre sider (fx side3)
    // Hvis brugeren har ændret musikvalg → opdater diagrammet
    // Hvis køen er ændret → genindlæs sangkøen med de nye valg

  }
});
//Tegn og opdater automatisk
updatePieChart();
setInterval(updatePieChart, 50000);
////Tegner diagrammet første gang når siden loader
// Opdaterer diagrammet automatisk hvert 50. sekund, så det altid viser aktuelle valg

// Variables / Player state
let masterQueue = [];
let playQueue = [];
let currentIndex = 0;
let interval = null;
let lastQueueUpdatedAt = null;
//masterQueue = fuld liste over sange, serveren har valgt
// playQueue = blandet / shuffle version, den der faktisk spiller
// currentIndex = hvilken sang vi er nået til
// interval = bruges til at styre afspilning (timer)
// lastQueueUpdatedAt = husker hvornår køen sidst blev opdateret for 
// ikke at genloade unødigt

//loadQueue funktion
async function loadQueue(genres = [], artists = [])
//Henter sangkøen for festen
// Hvis genres eller artists er givet → sender POST til serveren, så server genererer ny kø
// Hvis ikke → GET for at hente den eksisterende kø
 {
  const partyCode = localStorage.getItem("partyCode");
  if (!partyCode) return;
  //Henter partyCode fra browserens lokal storage.
  // Hvis der ikke er nogen festkode → stopper funktionen.


  try {
    let res, data;
    //Starter en try blok for at fange fejl, fx hvis serveren ikke svarer.
    // Definerer res og data til at gemme serverens svar.

    if ((genres && genres.length > 0) || (artists && artists.length > 0)) 
      //Tjekker om brugeren har valgt nye genrer eller artister.
    //Hvis ja  skal køen genereres på ny
    {
      // regenerate and store on server (shared)
      res = await fetch(`/api/party/${partyCode}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres, artists }),
      });
      data = await res.json();
      //Sender en POST request til serveren med de valgte genrer/artister.
      // Serveren laver en ny kø baseret på valgene og sender den tilbage.
      // data gemmer den nye kø.

    } else {
      // fetch the currently stored shared queue
      res = await fetch(`/api/party/${partyCode}/queue`);
      data = await res.json();
      //Hvis ingen genrer/artister er valgt 
      // henter vi bare den eksisterende kø fra serveren (GET request).
    }

    const updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString() : null;
    //Henter tidspunktet, hvor køen sidst blev opdateret.
    // Konverterer det til en standard dato-streng.
    // Bruges til at tjekke, om køen er ændret siden sidst.

    // Hvis køen ikke er ændret → stopper funktionen
    //  (for at undgå unødvendig opdatering af UI).
    // Ellers opdaterer vi lastQueueUpdatedAt med det nye tidspunkt.
    if (updatedAt && updatedAt === lastQueueUpdatedAt) {
      return;
    }
    lastQueueUpdatedAt = updatedAt;


   //Gemmer køen fra serveren i browserens variabler.
   // masterQueue = fuld liste af sange
   // playQueue = blandet/afspilningsrækkefølge
    masterQueue = data.masterQueue || [];
    playQueue = data.playQueue || [];

    if (playQueue.length > 0) {
      loadSong(0);
      renderQueue(masterQueue);
      //Hvis der er sange → start afspilning med første sang (loadSong(0))
      // Viser hele køen i brugergrænsefladen (renderQueue)

    } else {
      const queueBox = document.getElementById("queueBox");
      if (queueBox) {
        queueBox.innerHTML =
          "<p>No songs selected yet. Pick a genre or artist!</p>";
          //Hvis der ikke er sange → vis en besked i UI om at 
          // vælge genrer eller artister.
      }
    }
  } catch (err) {
    console.error("Error fetching shared queue:", err);
    //Fanger eventuelle fejl under fetch/processing og skriver dem til konsollen.
  }
 // Funktionen henter eller opdaterer den delte sangkø fra serveren, 
 // gemmer den lokalt, starter afspilning 
  //hvis der er sange, og viser en besked hvis køen er tom.
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