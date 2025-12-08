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