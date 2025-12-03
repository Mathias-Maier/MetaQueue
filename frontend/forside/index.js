// index.js - frontend logic only

// --- CREATE PARTY ---
async function createParty() {
  const partyName = document.getElementById('createPartyName').value;
  if (!partyName) return alert("Please enter a party name!");

  try {
    const res = await fetch('/api/party', { // <- relative path
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partyName })
    });

    const data = await res.json();

    if (data.partyCode) {
      localStorage.setItem('partyCode', data.partyCode);
      localStorage.setItem('partyName', data.partyName);
      window.location.href = 'side2Files/Side2.html'; // Redirect to Party Page
    } else {
      alert('Error creating party');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to create party. Check server.');
  }
}

// --- JOIN PARTY ---
async function joinParty() {
  const partyCode = document.getElementById('joinPartyCode').value.toUpperCase();
  if (!partyCode) return alert("Please enter a party code!");

  try {
    const res = await fetch(`/api/party/${partyCode}`); // <- relative path
    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      localStorage.setItem('partyCode', data.partyCode);
      localStorage.setItem('partyName', data.partyName);
      window.location.href = 'side2Files/Side2.html'; // Redirect to Party Page
    }
  } catch (err) {
    console.error(err);
    alert('Failed to join party. Check server.');
  }
}

// --- Attach functions to buttons ---
document.getElementById('createButton').onclick = createParty;
document.getElementById('joinButton').onclick = joinParty;
