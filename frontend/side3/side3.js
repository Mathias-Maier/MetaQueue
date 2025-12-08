const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestions");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    suggestionsList.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3003/api/suggestions?query=${encodeURIComponent(query)}`);
    const artists = await response.json();

    suggestionsList.innerHTML = "";

    if (artists.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No matches found";
      suggestionsList.appendChild(li);
    } else {
      artists.forEach(artist => {
        const li = document.createElement("li");
        li.textContent = artist;
        li.addEventListener("click", () => {
          searchInput.value = artist;
          suggestionsList.innerHTML = "";
        });
        suggestionsList.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Error fetching suggestions:", err);
  }
});
// Get party info from parent window
const partyCode = window.parent.localStorage.getItem('partyCode');
const memberId = window.parent.localStorage.getItem('memberId');

// Track selected genres and artists
let selectedGenres = [];
let selectedArtists = [];

// Genre ID mapping (matches your database)
const genreMapping = {
  'hip-hop': 1,
  'pop': 2,
  'rock': 3,
  'rnb': 4,
  'classic': 5,
  'jazz': 6,
  'indie': 7,
  'metal': 8
};

// Handle genre checkbox changes
document.querySelectorAll('input[name="genre"]').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const genreValue = e.target.value;
    const genreId = genreMapping[genreValue];
    
    if (e.target.checked) {
      if (!selectedGenres.includes(genreId)) {
        selectedGenres.push(genreId);
      }
    } else {
      selectedGenres = selectedGenres.filter(id => id !== genreId);
    }
    
    updateSelectionDisplay();
    saveSelections();
  });
});

// Handle artist search with autocomplete
const artistInput = document.querySelector('input[list="artists"]');
const artistDatalist = document.getElementById('artists');

// Fetch artist suggestions as user types
artistInput.addEventListener('input', async (e) => {
  const query = e.target.value;
  
  if (query.length < 2) return;
  
  try {
    const res = await fetch(`/api/suggestions?query=${encodeURIComponent(query)}`);
    const artists = await res.json();
    
    // Update datalist
    artistDatalist.innerHTML = '';
    artists.forEach(artist => {
      const option = document.createElement('option');
      option.value = artist;
      artistDatalist.appendChild(option);
    });
  } catch (err) {
    console.error('Error fetching suggestions:', err);
  }
});

// Add artist when user selects from list
artistInput.addEventListener('change', (e) => {
  const artist = e.target.value.trim();
  
  if (artist && !selectedArtists.includes(artist)) {
    selectedArtists.push(artist);
    updateSelectionDisplay();
    saveSelections();
  }
  
  e.target.value = ''; // Clear input
});

// Update the selection display on the right
function updateSelectionDisplay() {
  const box3 = document.querySelector('.box-3');
  
  // Clear existing content except title
  box3.innerHTML = '<h3>YOUR<br />SELECTION:</h3>';
  
  // Add genre section
  if (selectedGenres.length > 0) {
    const genreDiv = document.createElement('div');
    genreDiv.className = 'selection-section';
    genreDiv.innerHTML = '<strong>GENRES:</strong>';
    
    selectedGenres.forEach(genreId => {
      const genreName = Object.keys(genreMapping).find(key => genreMapping[key] === genreId);
      const tag = document.createElement('span');
      tag.className = 'selection-tag';
      tag.textContent = genreName.toUpperCase();
      genreDiv.appendChild(tag);
    });
    
    box3.appendChild(genreDiv);
  }
  
  // Add artist section
  if (selectedArtists.length > 0) {
    const artistDiv = document.createElement('div');
    artistDiv.className = 'selection-section';
    artistDiv.innerHTML = '<strong>ARTISTS:</strong>';
    
    selectedArtists.forEach(artist => {
      const tag = document.createElement('span');
      tag.className = 'selection-tag';
      tag.textContent = artist;
      
      // Add remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className = 'remove-tag';
      removeBtn.onclick = () => {
        selectedArtists = selectedArtists.filter(a => a !== artist);
        updateSelectionDisplay();
        saveSelections();
      };
      
      tag.appendChild(removeBtn);
      artistDiv.appendChild(tag);
    });
    
    box3.appendChild(artistDiv);
  }
}

// Save selections to database
async function saveSelections() {
  if (!partyCode || !memberId) {
    console.error('Missing party code or member ID');
    return;
  }
  
  try {
    const res = await fetch(`/api/party/${partyCode}/selections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId,
        genres: selectedGenres,
        artists: selectedArtists
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      console.log('Selections saved!');
      // Notify parent window to update pie chart
      window.parent.postMessage({ type: 'selectionsUpdated' }, '*');
    }
  } catch (err) {
    console.error('Error saving selections:', err);
  }
}
