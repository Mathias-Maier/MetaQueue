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
    }, 350);
}

window.addEventListener('DOMContentLoaded', async () => {
    const partyName = localStorage.getItem('partyName');
    const partyCode = localStorage.getItem('partyCode');
    const welcomeDiv = document.getElementById('partyWelcome');
    const codeDisplay = document.getElementById('partyCodeDisplay');
    const memberCountDisplay = document.getElementById('memberCount');

    if (welcomeDiv) {
        welcomeDiv.textContent = partyName
            ? `WELCOME TO PARTY: ${partyName}`
            : 'WELCOME TO PARTY';
    }
    
    // Display the party code
    if (codeDisplay && partyCode) {
        codeDisplay.textContent = `PARTY CODE: ${partyCode}`;
        codeDisplay.style.display = 'block';
    }

    // Generate or get unique member ID
    let memberId = localStorage.getItem('memberId');
    if (!memberId) {
        memberId = 'member_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('memberId', memberId);
    }

    // Join the party and get member count
    if (partyCode) {
        try {
            const joinRes = await fetch(`/api/party/${partyCode}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId })
            });
            const joinData = await joinRes.json();
            
            if (memberCountDisplay && joinData.memberCount !== undefined) {
                memberCountDisplay.textContent = joinData.memberCount;
            }

            // Update member count every 3 seconds
            setInterval(async () => {
                try {
                    const countRes = await fetch(`/api/party/${partyCode}/count`);
                    const countData = await countRes.json();
                    if (memberCountDisplay && countData.memberCount !== undefined) {
                        memberCountDisplay.textContent = countData.memberCount;
                    }
                } catch (err) {
                    console.error('Error fetching member count:', err);
                }
            }, 3000);

        } catch (err) {
            console.error('Error joining party:', err);
        }
    }
});