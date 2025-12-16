//// express → til at lave webserver og API
// path / fileURLToPath → til at finde stier på computeren
// connect → din egen funktion, der forbinder til databasen
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "../db/connect.js";

// Den fortæller serveren, hvor denne fil ligger på computeren
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database
const db = await connect(); //Serveren opretter forbindelse til databasen.
const parties = new Map(); // parties = korttids-hukommelse (RAM)
//  gemmer festernes data midlertidigt

// Port
const port = process.env.PORT || 3003; // Serveren kører på port 3003
// Webserver
const server = express(); //server er selve Express-app’en

// Middleware kører først, behandler eller
// logger requesten, og sender den så videre til det rigtige endpoint.
server.use(express.static("frontend", { index: "forside/index.html" }));
// Gør frontend tilgængelig, så browseren kan åbne filer, og / loader forside/index.html.
server.use(express.json());
//Gør det muligt at læse JSON-data fra POST/PUT requests
//Uden det ville req.body være undefined
server.use(onEachRequest);
//Logger dato, metode og URL for hver request til debugging.

// Genererer en fest-kode
//Opretter en unik 6-tegns kode til en fest, fx A7KQ2P.
function generatePartyCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  //Listen af tegn, der kan indgå i koden: store bogstaver og tal.
  let code = "";
  //Her gemmer vi den kode, vi bygger op ét tegn ad gangen.
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  //Kører 6 gange (for 6 tegn)
  //Math.random() vælger et tilfældigt tal mellem 0 og længden af characters
  //charAt() vælger det tegn, der passer til tallet
  //Tegnet tilføjes til code
  if (parties.has(code)) return generatePartyCode();
  //parties gemmer eksisterende fester, og hvis koden allerede
  //findes, laves en ny unik kode.
  return code;
  //Returnerer den færdige, unikke 6-tegns kode
}

<<<<<<< HEAD
// --- Party endpoints ---
//Opretter en ny fest med navn og unik kode, gemmer den midlertidigt,
//  og sender koden og medlemstallet tilbage til brugeren.
server.post('/api/party', (req, res) => {
  const { partyName } = req.body;
  if (!partyName) return res.status(400).json({ error: 'Party name required' });
//Gemmer festen midlertidigt med:
  const partyCode = generatePartyCode();
  parties.set(partyCode, {
    name: partyName, //navnet
    createdAt: new Date(),//tidspunktet den blev oprettet
    members: new Set() //ingen medlemmer endnu
=======
// Party endpoints
server.post("/api/party", (req, res) => {
  const { partyName } = req.body;
  if (!partyName) return res.status(400).json({ error: "Party name required" });

  const partyCode = generatePartyCode();
  parties.set(partyCode, {
    name: partyName,
    createdAt: new Date(),
    members: new Set(),
>>>>>>> 03cb386 (update)
  });

  res.json({ partyCode, partyName, memberCount: 0 });
});
//Returnerer JSON” betyder, at serveren sender festens information tilbage
//  i et standardformat, 
// som frontend kan bruge til at vise fx koden og navnet på siden.

<<<<<<< HEAD



//Hent oplysninger om en specifik fest baseret på dens kode.
server.get('/api/party/:partyCode', (req, res) =>
  ////Læser koden fra URL’en, fx /api/party/A1B2C3 → partyCode = "A1B2C3"
 {
=======
server.get("/api/party/:partyCode", (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  // Finder festen i parties-Map’en og toUpperCase() sikrer, 
  // at små/STORE bogstaver ikke laver fejl
  const party = parties.get(partyCode.toUpperCase());

<<<<<<< HEAD
  if (!party) return res.status(404).json({ error: 'Party not found' });
  //Hvis festen ikke findes → sender serveren 404 fejl tilbage
=======
  if (!party) return res.status(404).json({ error: "Party not found" });
>>>>>>> 03cb386 (update)

  res.json({
    partyCode,
    partyName: party.name,
<<<<<<< HEAD
    memberCount: party.members ? party.members.size : 0
    //Returnerer info om festen i JSON-format:

//partyCode → festens kode

//partyName → navnet på festen

//memberCount → antal medlemmer (0 hvis ingen endnu)
=======
    memberCount: party.members ? party.members.size : 0,
>>>>>>> 03cb386 (update)
  });
});
//Finder festen ud fra koden og returnerer 
// festens navn og antal medlemmer i JSON-format.
//jekker at festen findes, og giver frontend opdateret info.

<<<<<<< HEAD

//Tilføjer en bruger til festen og opdaterer medlemstallet.
//
server.post('/api/party/:partyCode/join', (req, res) => {
=======
server.post("/api/party/:partyCode/join", (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  //Læser partyCode fra URL’en
  const { memberId } = req.body;
  //Læser memberId fra request body (unik bruger-id)
  const party = parties.get(partyCode.toUpperCase());
<<<<<<< HEAD
  //Finder festen i parties
  //toUpperCase() sikrer, at koden ikke er case-sensitiv
  if (!party) return res.status(404).json({ error: 'Party not found' });
//Hvis festen ikke findes → sender 404 fejl
=======

  if (!party) return res.status(404).json({ error: "Party not found" });

>>>>>>> 03cb386 (update)
  if (!party.members) party.members = new Set();
  party.members.add(memberId);
  //Hvis members ikke findes, oprettes et nyt tomt sæt
  //Tilføjer brugerens memberId til members (Set = kun unikke medlemmer )
  //Sørger for ingen medlemmer optræder to gange.

  res.json({ memberCount: party.members.size });
});

<<<<<<< HEAD
//Returnerer det opdaterede antal medlemmer som JSON
//Returnerer hvor mange medlemmer der er i festen, og tjekker at festen findes.
server.get('/api/party/:partyCode/count', (req, res) => {
=======
server.get("/api/party/:partyCode/count", (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  //Henter koden fra URL’en, fx /api/party/A1B2C3/count
  const party = parties.get(partyCode.toUpperCase());
  //Ser efter festen i parties Map’en
  // toUpperCase() sikrer, at små/STORE bogstaver ikke laver fejl

<<<<<<< HEAD
  if (!party) return res.status(404).json({ error: 'Party not found' });
  //Hvis festen ikke findes → returnerer serveren 404 fejl
=======
  if (!party) return res.status(404).json({ error: "Party not found" });
>>>>>>> 03cb386 (update)

  res.json({ memberCount: party.members ? party.members.size : 0 });
  //Sender JSON med antal medlemmer tilbage 
  // Hvis ingen medlemmer endnu → 0

});

<<<<<<< HEAD
// --- Artist suggestions ---
// Hente artist-navne fra databasen baseret
//  på brugerens søgning (autocomplete/suggestions).
server.get('/api/suggestions', async (req, res) =>
 {
=======
// Artist suggestions
server.get("/api/suggestions", async (req, res) => {
>>>>>>> 03cb386 (update)
  const query = req.query.query;
  if (!query || query.length < 2) return res.json([]);
  //Læser søgetekst fra URL’en, fx /api/suggestions?query=dr
//Hvis søgetekst er tom eller mindre end 2 tegn → returnerer en tom liste

  try {
    const result = await db.query(
      "SELECT DISTINCT artist FROM songs WHERE artist ILIKE $1 LIMIT 10",
      [`%${query}%`]
    );
<<<<<<< HEAD
    //Søger i songs-tabellen i databasen
    //ILIKE = case-insensitiv søgning
    //%${query}% = matcher søgeteksten hvor som helst i artist-navnet
    //DISTINCT = kun unikke artist-navne
    //LIMIT 10 = maks 10 forslag
    res.json(result.rows.map(row => row.artist));
    //Sender JSON tilbage med en liste af artist-navne, fx:
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ error: 'Database error' });
    //Hvis der opstår fejl i databasen → logges og sender 500 fejl
=======
    res.json(result.rows.map((row) => row.artist));
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ error: "Database error" });
>>>>>>> 03cb386 (update)
  }
  //Henter op til 10 unikke artist-navne fra databasen, 
  // der matcher brugerens søgning, og sender dem tilbage som JSON.
});

<<<<<<< HEAD
// --- Save user selections ---
server.post('/api/party/:partyCode/selections', async (req, res) => 
  {

=======
// Save user selections
server.post("/api/party/:partyCode/selections", async (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  //Læser festens kode fra URL’en
  const { memberId, genres, artists } = req.body;
  //Læser brugerens id (memberId), og de valgte genres og artists fra request body

  try {
    await db.query(
      "DELETE FROM user_selections WHERE party_code = $1 AND member_id = $2",
      [partyCode.toUpperCase(), memberId]
      //Sletter tidligere valg for denne bruger og fest, så vi kun gemmer de nyeste valg
    );

    for (const genreId of genres) {
      await db.query(
        "INSERT INTO user_selections (party_code, member_id, genre_id) VALUES ($1, $2, $3)",
        [partyCode.toUpperCase(), memberId, genreId]
      );
    }
    //For hver genre valgt af brugeren → indsæt i databasen

    for (const artist of artists) {
      await db.query(
        "INSERT INTO user_selections (party_code, member_id, artist) VALUES ($1, $2, $3)",
        [partyCode.toUpperCase(), memberId, artist]
      );
    }
<<<<<<< HEAD
//For hver artist valgt → indsæt i databasen
    res.json({ success: true, message: 'Selections saved' });
    //Sender JSON tilbage til frontend, så den ved, at valgene blev gemt
  } catch (err) {
    console.error('Error saving selections:', err);
    res.status(500).json({ error: 'Failed to save selections' });
    ////Hvis der sker en fejl med databasen → logges og sender 500 fejl tilbage
=======

    res.json({ success: true, message: "Selections saved" });
  } catch (err) {
    console.error("Error saving selections:", err);
    res.status(500).json({ error: "Failed to save selections" });
>>>>>>> 03cb386 (update)
  }
  //Gemmer brugerens valgte genres og artists for en fest i databasen, 
  // overskriver tidligere valg, og sender succes-besked tilbage.
});

<<<<<<< HEAD

// Hente en brugers tidligere gemte musikvalg (genres og artists) for en bestemt fest.
server.get('/api/party/:partyCode/selections', async (req, res) => {
=======
// ✅ --- NEW ENDPOINT: Load previous selections ---
server.get("/api/party/:partyCode/selections", async (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  const { memberId } = req.query;
  //Læser festens kode fra URL’en
//Læser brugerens id (memberId) fra query string, 
// fx /api/party/A1B2C3/selections?memberId=user123

  try {
    const result = await db.query(
      `
      SELECT genre_id, artist 
      FROM user_selections 
      WHERE party_code = $1 AND member_id = $2
      `,
      [partyCode.toUpperCase(), memberId]
      //Henter alle rækker i databasen hvor brugeren har valgt genres og/eller artists
    );

    const genres = [];
    const artists = [];

    result.rows.forEach((row) => {
      if (row.genre_id) genres.push(row.genre_id);
      if (row.artist) artists.push(row.artist);
      //Sorterer dataen i to lister: en med genre-id’er og en med artist-navne
    });

    res.json({ genres, artists });
    //Sender JSON tilbage til frontend fx
    // { "genres": [1,3,5], "artists": ["Drake", "Adele"] }

  } catch (err) {
    console.error("Error fetching previous selections:", err);
    res.status(500).json({ error: "Failed to load selections" });
    //Hvis databasen fejler → logges og sender 500 fejl tilbage
  }
  ////Henter brugerens tidligere valgte genres og 
// artists for en fest og returnerer dem som JSON.
});

<<<<<<< HEAD


// Hente statistikker over hvor mange brugere der
//  har valgt hver genre, fx til at lave et pie chart.
server.get('/api/party/:partyCode/preferences', async (req, res) => {
=======
// --- Get preferences (pie chart) ---
server.get("/api/party/:partyCode/preferences", async (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  //Læser festens kode fra URL’en

  try {
    const result = await db.query(
      `SELECT genre_id, COUNT(*) as count 
       FROM user_selections 
       WHERE party_code = $1 AND genre_id IS NOT NULL 
       GROUP BY genre_id`,
      [partyCode.toUpperCase()]
      //Tæller hvor mange gange hver genre er valgt for festen
     //GROUP BY genre_id → grupperer efter genre
    //COUNT(*) → hvor mange brugere har valgt hver genre
    );
    res.json({ genres: result.rows });
    //Sender resultatet tilbage som JSON, fx:
    //{ "genres": [ { "genre_id": 1, "count": 3 }, { "genre_id": 2, "count": 5 } ] }
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// --- Get all songs ---
server.get("/api/songs", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT artist, title, duration_ms FROM songs ORDER BY track_id`
    );

    res.json(result.rows);
  } catch (err) {
<<<<<<< HEAD
    console.error('Error fetching songs:', err);
    res.status(500).json({ error: 'Database error' });
    //Hvis databasen fejler → logges og sender 500 fejl tilbage
=======
    console.error("Error fetching songs:", err);
    res.status(500).json({ error: "Database error" });
>>>>>>> 03cb386 (update)
  }
  //Henter hvor mange brugere der har valgt hver genre 
  // i festen og sender det som JSON til fx et pie chart.
});

<<<<<<< HEAD
//Generere en spillekø for festen baseret på brugerens valgte genres og artists, 
// og gemme den server-side, så alle kan se samme shuffle.
server.post('/api/party/:partyCode/queue', async (req, res) => {
=======
// --- Generate queue ---
// POST: generate a new queue (store it server-side so it's shared)
// GET: return stored queue for the party (shared shuffle)
server.post("/api/party/:partyCode/queue", async (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  const { genres = [], artists = [] } = req.body;
  //partyCode fra URL 
  // genres og artists fra request body (valgfri arrays fordi brugeren kan 
  // vælge noget, men behøver ikke.)

  if (genres.length === 0 && artists.length === 0) {
    // reset stored queue for this party to empty
    const party = parties.get(partyCode.toUpperCase());
    //Reset kø hvis ingen valg
    if (party) {
      party.masterQueue = [];
      party.playQueue = [];
      party.queueUpdatedAt = new Date();
    }
    return res.json({ masterQueue: [], playQueue: [] });
    //Hvis ingen valg ,nulstil køen for festen og returner tomme lister
  }

  //Hent sange og genres fra databasen
  try {
    const result = await db.query(
      `SELECT track_id, title, artist, genre_id, duration_ms FROM songs`
    );

    const songs = result.rows.map((s) => ({
      ...s,
      genre_id: Number(s.genre_id),
    }));

    const genreResult = await db.query(`SELECT genre_id, name FROM genres`);
    const genreMap = {};
    genreResult.rows.forEach((row) => {
      genreMap[row.genre_id] = row.name.toUpperCase();
    });

<<<<<<< HEAD
    songs.forEach(song => {
      song.genre = genreMap[song.genre_id] || 'UNKNOWN';
      //Henter alle sange og finder ud af, hvilken genre hver sang hører til.
    });

    //Filtrer sange efter valg
    const filtered = songs.filter(song => {
=======
    songs.forEach((song) => {
      song.genre = genreMap[song.genre_id] || "UNKNOWN";
    });

    const filtered = songs.filter((song) => {
>>>>>>> 03cb386 (update)
      const genreMatch = genres.length === 0 || genres.includes(song.genre_id);
      const artistMatch =
        artists.length === 0 ||
        artists.some((a) =>
          song.artist.toLowerCase().includes(a.toLowerCase())
        );
      return genreMatch || artistMatch;
      //Kun sange der matcher valgte genres eller artists går videre
    });

    //Tilføj sange efter artists
    let queue = [];

    if (artists.length > 0) {
      artists.forEach((artist) => {
        const artistSongs = filtered.filter((song) =>
          song.artist.toLowerCase().includes(artist.toLowerCase())
        );
        if (artistSongs.length > 0) {
          queue.push(
            artistSongs[Math.floor(Math.random() * artistSongs.length)]
          );
          //For hver valgt artist, vælg en tilfældig sang fra filtered
        }
      });
    }
    //Tilføj sange efter genres
    if (genres.length > 0) {
      const buckets = {};
      genres.forEach((id) => {
        buckets[id] = filtered.filter((song) => song.genre_id === id);
      });

      const remainingSlots = 20 - queue.length;
      const perGenre = Math.max(1, Math.floor(remainingSlots / genres.length));

      genres.forEach((id) => {
        queue = queue.concat(getRandomSubset(buckets[id] || [], perGenre));
      });
      //For hver genre, tag et antal tilfældige sange fra den genre
      // Sikrer, at køen får max 20 sange
    }
    //Fjern dubletter
    queue = queue.filter(
      (song, index, self) =>
<<<<<<< HEAD
        index === self.findIndex(s => s.track_id === song.track_id)
      //Sørger for, at samme sang ikke er med to gange
    );
   //Opret masterQueue og playQueue
    const masterQueue = queue.map(song => ({
=======
        index === self.findIndex((s) => s.track_id === song.track_id)
    );

    const masterQueue = queue.map((song) => ({
>>>>>>> 03cb386 (update)
      id: song.track_id,
      title: song.title,
      artist: song.artist,
      duration: Math.floor(song.duration_ms / 1000),
      genre: song.genre,
      genre_id: song.genre_id,
    }));

    const playQueue = shuffleArray([...masterQueue]);
    //masterQueue = rækkefølge med alle sange
    // playQueue = shuffled kopi til afspilning

    //Gem på festen
    const party = parties.get(partyCode.toUpperCase());
    if (party) {
      party.masterQueue = masterQueue;
      party.playQueue = playQueue;
      party.queueUpdatedAt = new Date();
      //Gem køerne server side, så alle brugere ser samme shuffle
    }
<<<<<<< HEAD
    //Returner resultat
    res.json({ masterQueue, playQueue, updatedAt: party ? party.queueUpdatedAt : new Date() });
// Sender køerne og tidspunkt for sidste opdatering tilbage
  } catch (err) {
    console.error('Queue generation error:', err);
    res.status(500).json({ error: 'Failed to generate queue' });
    //Hvis databasen fejler  logges og sender 500 fejl tilbage
=======

    res.json({
      masterQueue,
      playQueue,
      updatedAt: party ? party.queueUpdatedAt : new Date(),
    });
  } catch (err) {
    console.error("Queue generation error:", err);
    res.status(500).json({ error: "Failed to generate queue" });
>>>>>>> 03cb386 (update)
  }
  //Genererer en spillekø baseret på brugervalgt genre og artist, gemmer den på serveren
  //og returnerer master- og shuffle-kø til frontend.
});

<<<<<<< HEAD
// Hent gemt kø (shared shuffle)
server.get('/api/party/:partyCode/queue', (req, res) =>
  //Endpoint som frontend kalder for at få den fælles musik kø
   {
=======
// GET stored queue (shared shuffle)
server.get("/api/party/:partyCode/queue", (req, res) => {
>>>>>>> 03cb386 (update)
  const { partyCode } = req.params;
  //Læser festens kode fra URL’en
  const party = parties.get(partyCode.toUpperCase());
<<<<<<< HEAD
  //Finder festen i serverens hukommelse
  if (!party) return res.status(404).json({ error: 'Party not found' });
  //Hvis festen ikke findes, sendes en fejl
=======
  if (!party) return res.status(404).json({ error: "Party not found" });
>>>>>>> 03cb386 (update)

  //Henter den gemte kø
  const masterQueue = party.masterQueue || [];
  const playQueue = party.playQueue || [];
  const updatedAt = party.queueUpdatedAt || null;
  //masterQueue = original rækkefølge
  // playQueue = blandet rækkefølge
  // updatedAt = hvornår køen sidst blev lavet

  res.json({ masterQueue, playQueue, updatedAt });
  //Sender køen tilbage til frontend som JSON
});

// små hjælpefunktioner, der gør koden nemmere at læse og genbruge.
//Funktion der vælger et antal tilfældige elementer fra et array
function getRandomSubset(arr, count)
//En funktion der får en liste (arr) og et antal (count)
 {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
  //Den blander listen tilfældigt og tager kun det antal, vi har bedt om
  //En hjælpefunktion der bruges til at udvælge et bestemt antal 
  // tilfældige sange fra en liste.
}
//Den blander rækkefølgen i en liste, så elementerne kommer i tilfældig orden (shuffle).
function shuffleArray(arr) 
//Funktion der tager en liste (fx sange)
{
  for (let i = arr.length - 1; i > 0; i--)
    //Starter fra slutningen af listen og går baglæns
   {
    const j = Math.floor(Math.random() * (i + 1));
    //Vælger et tilfældigt index i listen
    [arr[i], arr[j]] = [arr[j], arr[i]];
    //Bytter plads på to elementer i listen

  }
  //Returnerer listen i tilfældig rækkefølge
  return arr;
  //En hjælpefunktion der bruges til at lave shuffle-play 
  // ved at blande rækkefølgen af elementer i et array.
}

// --- Start server ---
server.listen(port, onServerReady);
//Starter webserveren og får den til at lytte på den valgte port
//  Når serveren er klar, kaldes onServerReady()

// Logging af requests
function onEachRequest(req, res, next) 
//Denne funktion kører ved hver request til serveren
{
  console.log(new Date(), req.method, req.url);
  //Logger dato, request-type (GET/POST) og URL i konsollen
  next();

<<<<<<< HEAD
  //Sender requesten videre til næste middleware eller endpoint
  //bruges til at se hvad der sker på serveren (debugging)
=======
function onServerReady() {
  console.log("Webserver running on port", port);
>>>>>>> 03cb386 (update)
}
//Når serveren er klar
function onServerReady()
//Funktion der køres, når serveren er startet
 {
  console.log('Webserver running on port', port);
  //Skriver i konsollen hvilken port serveren kører på
}
//Serveren startes på en port, alle requests logges i konsollen, 
// og der vises en besked når serveren er klar.

// -- endpoint ---
//Alt med server.get(...) eller server.post(...) er et endpoint
// Et endpoint er en URL + en handling
//server.get henter data.
//server.post sender eller gemmer data.
//Begge er endpoints på serveren.