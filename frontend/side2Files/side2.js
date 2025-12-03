function openPopup() {
    document.getElementById("popup-overlay").style.display = "block";
    const popup = document.getElementById("popup");
    popup.style.display = "block";

    setTimeout(() => popup.classList.add("show"), 10); 
}

function closePopup() {
    const popup = document.getElementById("popup");
    popup.classList.remove("show");
    
    setTimeout(() => {
        popup.style.display = "none";
        document.getElementById("popup-overlay").style.display = "none";
    },350);
}

window.addEventListener('DOMContentLoaded', () => {
  const partyName = localStorage.getItem('partyName');
  const welcomeDiv = document.getElementById('partyWelcome');

  if (welcomeDiv) {
    welcomeDiv.textContent = partyName
      ? `WELCOME TO PARTY: ${partyName}`
      : 'WELCOME TO PARTY';
  }
});