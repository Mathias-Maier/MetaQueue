import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '../db/connect.js';
import { play } from './player.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = await connect();
const tracks = await loadTracks();
const currentTracks = new Map(); // maps partyCode to index in tracks
const parties = new Map(); // maps partyCode to { name: partyName, createdAt: Date }

const port = process.env.PORT || 3003;
const server = express();

// --- Middleware ---
server.use(express.static('frontend'));
server.use(express.json());
server.use(onEachRequest);

// --- Party endpoints ---
server.post('/api/party', (req, res) => {
  const { partyName } = req.body;
  if (!partyName) return res.status(400).json({ error: 'Party name required' });

  const partyCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  parties.set(partyCode, { name: partyName, createdAt: new Date() });

  res.json({ partyCode, partyName });
});

server.get('/api/party/:partyCode', (req, res) => {
  const { partyCode } = req.params;
  const party = parties.get(partyCode.toUpperCase());

  if (!party) return res.status(404).json({ error: 'Party not found' });

  res.json({ partyCode, partyName: party.name });
});

// Get current track
server.get('/api/party/:partyCode/currentTrack', onGetCurrentTrackAtParty);

// Fallback for frontend routing
server.get(/\/[a-zA-Z0-9-_/]+/, onFallback);

// Start server
server.listen(port, onServerReady);

// --- Functions ---
function onEachRequest(req, res, next) {
  console.log(new Date(), req.method, req.url);
  next();
}

async function onFallback(req, res) {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
}

function onServerReady() {
  console.log('Webserver running on port', port);
}

async function loadTracks() {
  const dbResult = await db.query(`SELECT * FROM songs`);
  return dbResult.rows;
}

async function onGetCurrentTrackAtParty(req, res) {
  const partyCode = req.params.partyCode;
  let trackIndex = currentTracks.get(partyCode);

  if (trackIndex === undefined) {
    trackIndex = pickNextTrackFor(partyCode);
  }

  const track = tracks[trackIndex];
  res.json(track);
}

function pickNextTrackFor(partyCode) {
  const trackIndex = Math.floor(Math.random() * tracks.length);
  currentTracks.set(partyCode, trackIndex);

  const track = tracks[trackIndex];
  play(partyCode, track.track_id, track.duration_ms, Date.now(), () => currentTracks.delete(partyCode));

  return trackIndex;
}
