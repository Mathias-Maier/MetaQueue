import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '../db/connect.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = await connect();
const parties = new Map(); // maps partyCode to { name: partyName, createdAt: Date }

const port = process.env.PORT || 3003;
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
  parties.set(partyCode, { name: partyName, createdAt: new Date() });

  res.json({ partyCode, partyName });
});

// Join party
server.get('/api/party/:partyCode', (req, res) => {
  const { partyCode } = req.params;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  res.json({ partyCode, partyName: party.name });
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