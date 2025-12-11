import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '../db/connect.js';

// Finder mappe-stien hvor denne fil er placeret
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database
const db = await connect();
const parties = new Map(); // maps partyCode to { name: partyName, createdAt: Date }

// Port
const port = process.env.PORT || 3003;

// Webserver
const server = express();

// --- Middleware ---
server.use(express.static('frontend', { index: 'forside/index.html' }));
server.use(express.json());
server.use(onEachRequest);

// --- Generate unique party code ---
function generatePartyCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  if (parties.has(code)) return generatePartyCode();
  return code;
}

// --- Party endpoints ---
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

server.post('/api/party/:partyCode/join', (req, res) => {
  const { partyCode } = req.params;
  const { memberId } = req.body;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  if (!party.members) party.members = new Set();
  party.members.add(memberId);

  res.json({ memberCount: party.members.size });
});

server.get('/api/party/:partyCode/count', (req, res) => {
  const { partyCode } = req.params;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  res.json({ memberCount: party.members ? party.members.size : 0 });
});

// --- Artist suggestions ---
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

// --- Save user selections ---
server.post('/api/party/:partyCode/selections', async (req, res) => {
  const { partyCode } = req.params;
  const { memberId, genres, artists } = req.body;

  try {
    await db.query(
      'DELETE FROM user_selections WHERE party_code = $1 AND member_id = $2',
      [partyCode.toUpperCase(), memberId]
    );

    for (const genreId of genres) {
      await db.query(
        'INSERT INTO user_selections (party_code, member_id, genre_id) VALUES ($1, $2, $3)',
        [partyCode.toUpperCase(), memberId, genreId]
      );
    }

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


// ✅ --- NEW ENDPOINT: Load previous selections ---
server.get('/api/party/:partyCode/selections', async (req, res) => {
  const { partyCode } = req.params;
  const { memberId } = req.query;

  try {
    const result = await db.query(
      `
      SELECT genre_id, artist 
      FROM user_selections 
      WHERE party_code = $1 AND member_id = $2
      `,
      [partyCode.toUpperCase(), memberId]
    );

    const genres = [];
    const artists = [];

    result.rows.forEach(row => {
      if (row.genre_id) genres.push(row.genre_id);
      if (row.artist) artists.push(row.artist);
    });

    res.json({ genres, artists });
  } catch (err) {
    console.error("Error fetching previous selections:", err);
    res.status(500).json({ error: "Failed to load selections" });
  }
});


// --- Get preferences (pie chart) ---
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

// --- Get all songs ---
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

// --- Generate queue ---
server.post('/api/party/:partyCode/queue', async (req, res) => {
  const { partyCode } = req.params;
  const { genres = [], artists = [] } = req.body;

  if (genres.length === 0 && artists.length === 0) {
    return res.json({ masterQueue: [], playQueue: [] });
  }

  try {
    const result = await db.query(
      `SELECT track_id, title, artist, genre_id, duration_ms FROM songs`
    );

    const songs = result.rows.map(s => ({
      ...s,
      genre_id: Number(s.genre_id)
    }));

    const genreResult = await db.query(`SELECT genre_id, name FROM genres`);
    const genreMap = {};
    genreResult.rows.forEach(row => {
      genreMap[row.genre_id] = row.name.toUpperCase();
    });

    songs.forEach(song => {
      song.genre = genreMap[song.genre_id] || 'UNKNOWN';
    });

    const filtered = songs.filter(song => {
      const genreMatch = genres.length === 0 || genres.includes(song.genre_id);
      const artistMatch =
        artists.length === 0 ||
        artists.some(a => song.artist.toLowerCase().includes(a.toLowerCase()));
      return genreMatch || artistMatch;
    });

    let queue = [];

    if (artists.length > 0) {
      artists.forEach(artist => {
        const artistSongs = filtered.filter(song =>
          song.artist.toLowerCase().includes(artist.toLowerCase())
        );
        if (artistSongs.length > 0) {
          queue.push(
            artistSongs[Math.floor(Math.random() * artistSongs.length)]
          );
        }
      });
    }

    if (genres.length > 0) {
      const buckets = {};
      genres.forEach(id => {
        buckets[id] = filtered.filter(song => song.genre_id === id);
      });

      const remainingSlots = 20 - queue.length;
      const perGenre = Math.max(1, Math.floor(remainingSlots / genres.length));

      genres.forEach(id => {
        queue = queue.concat(getRandomSubset(buckets[id] || [], perGenre));
      });
    }

    queue = queue.filter(
      (song, index, self) =>
        index === self.findIndex(s => s.track_id === song.track_id)
    );

    const masterQueue = queue.map(song => ({
      id: song.track_id,
      title: song.title,
      artist: song.artist,
      duration: Math.floor(song.duration_ms / 1000),
      genre: song.genre,
      genre_id: song.genre_id
    }));

    const playQueue = shuffleArray([...masterQueue]);

    res.json({ masterQueue, playQueue });

  } catch (err) {
    console.error('Queue generation error:', err);
    res.status(500).json({ error: 'Failed to generate queue' });
  }
});

// --- Helpers ---
function getRandomSubset(arr, count) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Start server ---
server.listen(port, onServerReady);

// --- Logging ---
function onEachRequest(req, res, next) {
  console.log(new Date(), req.method, req.url);
  next();
}

function onServerReady() {
  console.log('Webserver running on port', port);
}
