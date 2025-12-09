import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '../db/connect.js';

// Finder mappe-stien hvor denne fil er placeret
const __dirname = path.dirname(fileURLToPath(import.meta.url));

//Database = Connection to the permanent database (keeps data even after restart)
//Map = Temporary storage in computer's memory (data disappears when server restarts)
const db = await connect();
const parties = new Map(); // maps partyCode to { name: partyName, createdAt: Date }

// This line determines which port number the server will run on
const port = process.env.PORT || 3003;
//This creates our web server
const server = express();

// --- Middleware ---
server.use(express.static('frontend', {index:'forside/index.html'}));
server.use(express.json());
server.use(onEachRequest);

// --- Generate unique party code ---
function generatePartyCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // Check if code already exists, regenerate if needed
  if (parties.has(code)) return generatePartyCode();
  return code;
}

// --- Party endpoints ---
// Create party
server.post('/api/party', (req, res) => {
  const { partyName } = req.body;
  if (!partyName) return res.status(400).json({ error: 'Party name required' });

  const partyCode = generatePartyCode();
  parties.set(partyCode, { 
    name: partyName, 
    createdAt: new Date(),
    members: new Set()
  });

  res.json({ partyCode, partyName, memberCount: 0 });
});

// Join party
server.get('/api/party/:partyCode', (req, res) => {
  const { partyCode } = req.params;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  res.json({ 
    partyCode, 
    partyName: party.name,
    memberCount: party.members ? party.members.size : 0
  });
});

// Add member to party
server.post('/api/party/:partyCode/join', (req, res) => {
  const { partyCode } = req.params;
  const { memberId } = req.body;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  if (!party.members) party.members = new Set();
  party.members.add(memberId);
  
  res.json({ memberCount: party.members.size });
});

// Get party member count
server.get('/api/party/:partyCode/count', (req, res) => {
  const { partyCode } = req.params;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  res.json({ memberCount: party.members ? party.members.size : 0 });
});


// --- Artist suggestion endpoint ---
server.get('/api/suggestions', async (req, res) => {
  const query = req.query.query;
  if (!query || query.length < 2) return res.json([]);

  try {
    const result = await db.query(
      'SELECT DISTINCT artist FROM songs WHERE artist ILIKE $1 LIMIT 10',
      [`%${query}%`]
    );
    res.json(result.rows.map(row => row.artist));
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
// Save user selections (genres and artists)
server.post('/api/party/:partyCode/selections', async (req, res) => {
  const { partyCode } = req.params;
  const { memberId, genres, artists } = req.body;

  try {
    // Delete old selections for this user
    await db.query(
      'DELETE FROM user_selections WHERE party_code = $1 AND member_id = $2',
      [partyCode.toUpperCase(), memberId]
    );

    // Insert new genre selections
    for (const genreId of genres) {
      await db.query(
        'INSERT INTO user_selections (party_code, member_id, genre_id) VALUES ($1, $2, $3)',
        [partyCode.toUpperCase(), memberId, genreId]
      );
    }

    // Insert new artist selections
    for (const artist of artists) {
      await db.query(
        'INSERT INTO user_selections (party_code, member_id, artist) VALUES ($1, $2, $3)',
        [partyCode.toUpperCase(), memberId, artist]
      );
    }

    res.json({ success: true, message: 'Selections saved' });
  } catch (err) {
    console.error('Error saving selections:', err);
    res.status(500).json({ error: 'Failed to save selections' });
  }
});

// Get party preferences (for pie chart)
server.get('/api/party/:partyCode/preferences', async (req, res) => {
  const { partyCode } = req.params;

  try {
    const result = await db.query(
      `SELECT genre_id, COUNT(*) as count 
       FROM user_selections 
       WHERE party_code = $1 AND genre_id IS NOT NULL 
       GROUP BY genre_id`,
      [partyCode.toUpperCase()]
    );

    res.json({ genres: result.rows });
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});


// Get all songs for player
server.get('/api/songs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT artist, title, duration_ms FROM songs ORDER BY track_id`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Generate queue based on user selections
server.post('/api/party/:partyCode/queue', async (req, res) => {
  const { partyCode } = req.params;
  const { memberId, genres = [], artists = [] } = req.body;

  try {
    const result = await db.query(`SELECT track_id, title, artist, genre_id, duration_ms FROM songs`);
    const songs = result.rows.map(song => ({
      ...song,
      genre_id: Number(song.genre_id) // sikrer tal
    }));

    console.log("Selected genres:", genres);
    console.log("Selected artists:", artists);
    console.log("First song sample:", songs[0]);

    const genreResult = await db.query(`SELECT genre_id, name FROM genres`);
    const genreMap = {};
    genreResult.rows.forEach(row => {
      genreMap[Number(row.genre_id)] = row.name.toUpperCase();
    });

    songs.forEach(song => {
      song.genre = genreMap[song.genre_id] || 'Unknown';
    });

    // Filtrer sange
    const filtered = songs.filter(song => {
      const genreMatch = genres.length === 0 || genres.includes(song.genre_id);
      const artistMatch = artists.length === 0 || artists.some(a =>
        song.artist.toLowerCase().includes(a.toLowerCase())
      );
      return genreMatch || artistMatch; // OBS: OR i stedet for AND
    });

    let queue = [];

    // Hvis der er valgt kunstnere → tilføj én sang pr. kunstner
    if (artists.length > 0) {
      artists.forEach(artist => {
        const artistSongs = filtered.filter(song =>
          song.artist.toLowerCase().includes(artist.toLowerCase())
        );
        if (artistSongs.length > 0) {
          queue.push(artistSongs[Math.floor(Math.random() * artistSongs.length)]);
        }
      });
    }

    // Hvis der er valgt genrer → fordel resten af køen på genrer
    if (genres.length > 0) {
      const buckets = {};
      genres.forEach(id => {
        buckets[id] = filtered.filter(song => song.genre_id === id);
      });

      const remainingSlots = 20 - queue.length;
      const perGenre = Math.max(1, Math.floor(remainingSlots / genres.length));

      genres.forEach(id => {
        const genreSongs = buckets[id] || [];
        queue = queue.concat(getRandomSubset(genreSongs, perGenre));
      });
    }

    // Hvis stadig tom → bare giv 5 tilfældige sange
    if (queue.length === 0) {
      queue = getRandomSubset(songs, 5);
    }

    res.json(queue);
  } catch (err) {
    console.error('Error generating queue:', err);
    res.status(500).json({ error: 'Failed to generate queue' });
  }
});

function getRandomSubset(arr, count) {
  return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}

// --- Start server ---
server.listen(port, onServerReady);

// --- Functions ---
function onEachRequest(req, res, next) {
  console.log(new Date(), req.method, req.url);
  next();
}

function onServerReady() {
  console.log('Webserver running on port', port);
}

async function loadTracks() {
  const dbResult = await db.query(`SELECT * FROM songs`);
  return dbResult.rows;
}