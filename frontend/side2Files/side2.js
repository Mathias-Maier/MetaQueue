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

