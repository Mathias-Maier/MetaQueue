// index.js

// --- CREATE PARTY ---
async function createParty() {
  const partyName = document.getElementById('createPartyName').value;
  if (!partyName) return alert("Please enter a party name!");

  const res = await fetch('/api/party', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partyName })
  });

  const data = await res.json();

  if (data.partyCode) {
    alert('Party created! Your code: ' + data.partyCode);
    localStorage.setItem('partyCode', data.partyCode);
    window.location.href = '../frontend/indexSide2.html'; // Navigate to Party Page
  } else {
    alert('Error creating party');
  }
}

// --- JOIN PARTY ---
async function joinParty() {
  const partyCode = document.getElementById('joinPartyCode').value.toUpperCase();
  if (!partyCode) return alert("Please enter a party code!");

  const res = await fetch(/api/party/${partyCode});
  const data = await res.json();

  if (data.error) {
    alert(data.error);
  } else {
    alert('Joined party: ' + data.partyName);
    localStorage.setItem('partyCode', partyCode);
    window.location.href = '../frontend/indexSide2.html'; // Navigate to Party Page
  }
}

// --- Attach functions to buttons ---
document.getElementById('createButton').onclick = createParty;
document.getElementById('joinButton').onclick = joinParty;