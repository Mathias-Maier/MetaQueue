// --- CREATE PARTY ---
async function createParty()
//Bruges når en bruger vil oprette en ny fest fra forsiden.
 {
  //Hent festens navn fra input
  const partyName = document.getElementById("createPartyName").value;
  //Læser det navn brugeren har skrevet i inputfeltet.

  //Tjek om der er skrevet et navn
  if (!partyName) return alert("Please enter a party name!");
  //Hvis input er tomt, vis en besked og stop funktionen.

  try {
    //Send data til serveren (POST request)
    const res = await fetch("/api/party", {
      // <- relative path
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyName }),
      //Sender festens navn til backend
      // Kalder endpointet POST /api/party
      // Data sendes som JSON
    });

    //Læs svaret fra serveren
    const data = await res.json();
    //Konverterer serverens svar til et JavaScript objekt.(json)

    //Hvis festen blev oprettet korrekt
    if (data.partyCode)
      //Tjekker om serveren har sendt en partyCode.
     {
      //Gem data i browseren
      localStorage.setItem("partyCode", data.partyCode);
      localStorage.setItem("partyName", data.partyName);
      //Gemmer festens kode og navn lokalt
      // Bruges på næste side
      
      //Send brugeren videre til næste side
      window.location.href = "side2Files/Side2.html"; // Skifter side til fest-siden.

      //Fejlhåndtering
    } else {
      alert("Error creating party");
      //Kører hvis serveren ikke returnerer en partyCode
      //altså hvis festen ikke blev oprettet korrekt.
    }
  } catch (err) {
    console.error(err);
    alert("Failed to create party. Check server.");
    //Hvis noget går galt, vis fejlbesked.
  }
  //Funktionen opretter en ny fest ved at sende festens navn til serveren, 
  // gemmer svaret i localStorage og sender brugeren videre til næste side.
}

// --- JOIN PARTY ---
async function joinParty() 
//Bruges når en bruger vil deltage i en eksisterende fest.
{
  //Hent festkoden fra input
  const partyCode = document
    .getElementById("joinPartyCode")
    .value.toUpperCase();
    //Læser koden som brugeren har skrevet
    // Gør den til store bogstaver, så koden altid passer

    //Tjek om koden er tom
  if (!partyCode) return alert("Please enter a party code!");
  //Hvis der ikke er skrevet en kode, vis besked og stop

  try {
    //Spørg serveren om festen findes (GET request)
    const res = await fetch(`/api/party/${partyCode}`); 
    // Kalder endpointet GET /api/party/:partyCode
    // Beder serveren om info om festen


    //Læs serverens svar
    const data = await res.json();
    //Gør svaret klar til brug i JavaScript

    //Hvis festen ikke findes
    if (data.error) {
      alert(data.error);
      //Serveren har sendt en fejl (fx “Party not found”)

      //Hvis festen findes
    } else {
      localStorage.setItem("partyCode", data.partyCode);
      localStorage.setItem("partyName", data.partyName);
      window.location.href = "side2Files/Side2.html"; 
      //Gemmer festens kode og navn
      // Sender brugeren videre til fest siden
    }
    //Fejlhåndtering
  } catch (err) {
    console.error(err);
    alert("Failed to join party. Check server.");
    //Hvis serveren ikke svarer eller der sker en fejl
  }
  //Funktionen tjekker om en fest findes ud fra en kode, 
  // gemmer festens info og sender brugeren videre, hvis den findes.
}

// --- Attach functions to buttons ---
//Koden kobler knapperne på forsiden til deres funktioner, 
// så klik udfører oprettelse eller deltagelse i fest.
document.getElementById("createButton").onclick = createParty;
document.getElementById("joinButton").onclick = joinParty;
//Finder knapperne i HTML (createButton og joinButton)
//Når en bruger klikker på en knap, kaldes den tilknyttede funktion:
//createButton → createParty()
//joinButton → joinParty()