// Henter festkode og medlems-id fra browserens localStorage.
// Bruges til at identificere deltageren og festen på serveren.
const partyCode = window.parent.localStorage.getItem("partyCode");
const memberId = window.parent.localStorage.getItem("memberId");

// Tomme arrays til at holde valgte genrer og artister.
let selectedGenres = [];
let selectedArtists = [];

// Oversætter genre-navn til genre-id (samme som i databasen
const genreMapping = {
  "Hip-Hop": 1,
  Pop: 2,
  Rock: 3,
  RnB: 4,
  Classics: 5,
  Jazz: 6,
  indie: 7,
  Metal: 8,

};

// Genre checkbox håndtering
document.querySelectorAll('input[name="genre"]').forEach((checkbox) => {
  checkbox.addEventListener("change", (e) => {
    const genreValue = e.target.value;
    const genreId = genreMapping[genreValue];

    if (e.target.checked) {
      if (!selectedGenres.includes(genreId)) {
        selectedGenres.push(genreId);
      }
    } else {
      selectedGenres = selectedGenres.filter((id) => id !== genreId);
    }

    updateSelectionDisplay();
    saveSelections();
  });
  //Lytter på ændringer af genre-checkboxes.
//Tilføjer/fjerner genre-id til/fra selectedGenres.
//Opdaterer visning og gemmer valget på serveren (saveSelections).
});

// Artist søgning med live resultater
const artistSearch = document.getElementById("artistSearch");
const artistResults = document.getElementById("artistResults");
//Henter HTML-elementer:
// artistSearch → tekstfelt, hvor brugeren skriver artistnavn
// artistResults → container, hvor søgeresultater vise

let searchTimeout;
//Variabel til debounce timer
// Bruges for at vente 300ms før vi sender et serverkald, 
// så vi ikke spammer serveren med forespørgsler for hvert tastetryk

//lytter efter ændringer i søgefeltet (input)
// Henter det skrevne input og fjerner leading/trailing spaces med .trim()
artistSearch.addEventListener("input", async (e) => {
  const query = e.target.value.trim();

//Stopper tidligere ventende debounce-timer, hvis brugeren stadig skriver
// Det sikrer, at vi kun sender en request efter brugeren holder op med at skrive i 300ms
  clearTimeout(searchTimeout);


  //Hvis input er mindre end 2 tegn:
  // Ryd søgeresultater
  // Skjul resultatboksen
  // Stop funktionen (return)
  if (query.length < 2) {
    artistResults.innerHTML = "";
    artistResults.style.display = "none";
    return;
  }

  //Starter debounce timer på 300ms
  // Efter 300ms uden ændringer → kører serverkald
  searchTimeout = setTimeout(async () => {
    try {
      //Sender en GET-request til serveren med brugerens input (query)
      // encodeURIComponent sørger for, at specielle tegn i query ikke bryder URL’en
      // Henter liste af forslag fra serveren som JSON
      const res = await fetch(
        `/api/suggestions?query=${encodeURIComponent(query)}`
      );
      const artists = await res.json();


      //Hvis ingen forslag returneres:
      // Vis “No artists found” i resultatboksen
      // Stop videre behandling
      if (artists.length === 0) {
        artistResults.innerHTML =
          '<div class="no-results">No artists found</div>';
        artistResults.style.display = "block";
        return;
      }
      //Ryd tidligere resultater, så vi kan vise de nye forslag
      artistResults.innerHTML = "";
      //For hver forslag:
      //Opret et klikbart div-element
      // Tilføj CSS-klasse for styling
      // Sæt tekstindhold til artistens navn
      artists.forEach((artist) => {
        const artistDiv = document.createElement("div");
        artistDiv.className = "artist-result-item";
        artistDiv.textContent = artist;

        //Når brugeren klikker på et forslag:
        // Hvis ikke allerede valgt → tilføj til selectedArtists
        // Opdater visning (updateSelectionDisplay)
        // Gem på serveren (saveSelections)
        // Ryd søgefeltet og skjul resultatboksen
        artistDiv.addEventListener("click", () => {
          if (!selectedArtists.includes(artist)) {
            selectedArtists.push(artist);
            updateSelectionDisplay();
            saveSelections();
          }
          artistSearch.value = "";
          artistResults.innerHTML = "";
          artistResults.style.display = "none";
        });


        //Tilføj det oprettede div-element til resultatboksen
        artistResults.appendChild(artistDiv);
      });
// Sørg for, at resultatboksen vises
      artistResults.style.display = "block";

      //Fejl-håndtering: hvis serverkald fejler → log til konsol
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }, 300); // Timeren er sat til 300ms → debounce
});

// Skjul resultater, når man klikker udenfor søgefeltet
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) {
    artistResults.style.display = "none";
  }
  //Lytter efter klik overalt i dokumentet
  // e.target.closest(".search-box") tjekker, om det klikkede element er inde i
  //  et element med klassen .search-box
  // Hvis ikke → skjul artist-resultaterne (artistResults.style.display = "none")
  // Formål: forslagene forsvinder, hvis brugeren klikker udenfor søgefeltet
});



// Opdater visning af valgte genrer og artister i højre side
function updateSelectionDisplay() {
  const box3 = document.querySelector(".box-3");
  box3.innerHTML = "<h3>YOUR<br />SELECTION:</h3>";
  //Finder HTML-elementet .box-3 → container, hvor brugerens valgte genrer/artister vises
  // Rydder tidligere indhold og viser titlen “YOUR SELECTION”

  //Hvis brugeren har valgt genrer:
  // Opret en <div> til at holde genrerne
  // Tilføj CSS-klasse selection-section
  // Tilføj en overskrift “GENRES”
  if (selectedGenres.length > 0) {
    const genreDiv = document.createElement("div");
    genreDiv.className = "selection-section";
    genreDiv.innerHTML = "<strong>GENRES:</strong>";

   //For hver valgt genre:
   // Find genrenavnet ud fra genreMapping (ID → navn)
   // Opret et <span> element til visning af genren
   // Tilføj CSS-klasse selection-tag
   // Vis navnet med store bogstaver
   // Tilføj <span> til genreDiv
    selectedGenres.forEach((genreId) => {
      const genreName = Object.keys(genreMapping).find(
        (key) => genreMapping[key] === genreId
      );
      const tag = document.createElement("span");
      tag.className = "selection-tag";
      tag.textContent = genreName.toUpperCase();
      genreDiv.appendChild(tag);
    });

    //Tilføj hele genrasektionen til .box-3 containeren
    box3.appendChild(genreDiv);
  }

  //Hvis brugeren har valgt artister:
  // Opret en <div> til artist-sektionen
  // Tilføj klasse selection-section
  // Tilføj en overskrift “ARTISTS”
  if (selectedArtists.length > 0) {
    const artistDiv = document.createElement("div");
    artistDiv.className = "selection-section";
    artistDiv.innerHTML = "<strong>ARTISTS:</strong>";

    //For hver valgt artist:
    // Opret et <span> element
    // Tilføj CSS-klasse selection-tag
    // Sæt teksten til artistens navn
    selectedArtists.forEach((artist) => {
      const tag = document.createElement("span");
      tag.className = "selection-tag";
      tag.textContent = artist;

      //Opret en fjern-knap (×) ved siden af artist-navnet:
      // CSS-klasse remove-tag
      // Ved klik:
      // Fjern denne artist fra selectedArtists
      // Opdater visningen (updateSelectionDisplay())
      // Gem de opdaterede valg til serveren (saveSelections())
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.className = "remove-tag";
      removeBtn.onclick = () => {
        selectedArtists = selectedArtists.filter((a) => a !== artist);
        updateSelectionDisplay();
        saveSelections();
      };
      //Tilføj fjern-knappen til <span> elementet
      // Tilføj <span> til artist-containeren (artistDiv)
      tag.appendChild(removeBtn);
      artistDiv.appendChild(tag);
    });
    //Tilføj hele artist-sektionen til .box-3
    box3.appendChild(artistDiv);
  }
}



// saveSelections(), Gem valg til databasen
async function saveSelections() {
  if (!partyCode || !memberId) {
    console.error("Missing party code or member ID");
    return;
    //Først tjekker vi, om vi har partyCode og memberId.
    // Hvis ikke → log fejl og stop funktionen.
    // Hvorfor? Vi skal vide, hvilken fest og hvilken bruger vi gemmer data for.
  }


//Sender en POST-request til serveren for at gemme brugerens valg.
//URL: /api/party/:partyCode/selections → specifik fest.
//Body indeholder:
//memberId → identificerer brugeren
//genres → brugerens valgte genrer
//artists → brugerens valgte artister
//Formålet: gemme disse valg i databasen.
  try {
    const res = await fetch(`/api/party/${partyCode}/selections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        genres: selectedGenres,
        artists: selectedArtists,
      }),
    });

    //Læser serverens svar som JSON.
    // Serveren sender typisk { success: true } hvis alt gik godt.
    const data = await res.json();



    //Hvis gemningen lykkes:
    // 1.Log til konsollen: "Selections saved!"
    // 2.Sender postMessage til parent-vinduet (side2.js) → fortæller at
    //  valgene er opdateret:
    //{ type: "selectionsUpdated" } → pie chart og UI skal opdateres
    // { type: "queueUpdated", genres, artists } → serveren skal generere ny 
    // spillekø baseret på disse valg
    if (data.success) {
      console.log("Selections saved!");
      window.parent.postMessage({ type: "selectionsUpdated" }, "*");
      window.parent.postMessage(
        { type: "queueUpdated", genres: selectedGenres, artists: selectedArtists },
        "*"
      );
    }
    //Hvis noget går galt med fetch log fejl.
  } catch (err) {
    console.error("Error saving selections:", err);
  }
}

// Load tidligere valg ved sideindlæsning
window.addEventListener("DOMContentLoaded", async () => {
  if (!partyCode || !memberId) return;
  //Når siden er færdig med at loade:
  // Tjek at partyCode og memberId eksisterer
  // Ellers stop → vi kan ikke hente valg uden dem


  //GET-request til serveren for at hente gemte valg for denne bruger og fest.
  // Serveren returnerer tidligere valgte genrer og artister.
  try {
    const res = await fetch(`/api/party/${partyCode}/selections?memberId=${memberId}`);
    const data = await res.json();

   //Hvis serveren sender genres → gemmer i selectedGenres.
   // Hvis serveren sender artists → gemmer i selectedArtists.
   // Formål: huske brugerens tidligere valg.
    if (data.genres) selectedGenres = data.genres;
    if (data.artists) selectedArtists = data.artists;

     //Opdaterer UI (box-3) med de hentede valg → genrer og artister vises.
    updateSelectionDisplay();

    // Sender besked til parent (side2.js) → genrer og artister skal bruges til at
    //  generere/loade spillekøen.
    // Sikrer at queue er synkroniseret med de gemte valg.
    window.parent.postMessage(
      { type: "queueUpdated", genres: selectedGenres, artists: selectedArtists },
      "*"
    );
    //Hvis noget går galt under hentning → log fejl til konsollen.
  } catch (err) {
    console.error("Error fetching saved selections:", err);
  }
});
