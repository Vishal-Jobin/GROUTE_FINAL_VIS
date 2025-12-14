import { supabase } from "./supabase.js"; // use your working supabase.js

// ----------------------
// DOM Elements
// ----------------------
const listEl = document.getElementById("list");
const createBtn = document.getElementById("createBtn");

// ----------------------
// Load Carpools
// ----------------------
async function loadCarpools() {
  const { data: carpools, error } = await supabase
    .from("carpools")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching carpools:", error);
    alert("Failed to fetch carpools");
    return;
  }

  listEl.innerHTML = ""; // Clear previous list

  carpools.forEach((carpool) => {
    const li = document.createElement("li");
    li.dataset.id = carpool.id;
    li.innerHTML = `
      <strong>From:</strong> ${carpool.from_location} |
      <strong>To:</strong> ${carpool.to_location} |
      <strong>Time:</strong> ${carpool.time} |
      <strong>Seats:</strong> ${carpool.seats} 
      <button class="join-btn">Join</button>
    `;
    listEl.appendChild(li);
  });
}

// ----------------------
// Create Carpool
// ----------------------
async function createCarpool() {
  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  const time = document.getElementById("time").value.trim();
  const seats = parseInt(document.getElementById("seats").value, 10);

  if (!from || !to || !time || !seats || seats <= 0) {
    alert("Please fill in all fields with valid values");
    return;
  }

  // Use logged-in user from localStorage
  const creator = localStorage.getItem("user") || "Guest";

  const { data, error } = await supabase
    .from("carpools")
    .insert([{ creator, from_location: from, to_location: to, time, seats }]);

  if (error) {
    console.error("Error creating carpool:", error);
    alert("Failed to create carpool");
    return;
  }

  alert("Carpool created successfully!");
  clearInputs();
  loadCarpools();
}

// ----------------------
// Clear input fields
// ----------------------
function clearInputs() {
  document.getElementById("from").value = "";
  document.getElementById("to").value = "";
  document.getElementById("time").value = "";
  document.getElementById("seats").value = "";
}

// ----------------------
// Join Carpool
// ----------------------
async function joinCarpool(carpoolId) {
  const username = localStorage.getItem("user") || "Guest";

  // Fetch carpool
  const { data: carpool, error } = await supabase
    .from("carpools")
    .select("*")
    .eq("id", carpoolId)
    .single();

  if (error || !carpool) {
    console.error("Error fetching carpool:", error);
    alert("Failed to join carpool");
    return;
  }

  if (carpool.seats <= 0) {
    alert("No seats available in this carpool!");
    return;
  }

  // Update seats
  const { error: updateError } = await supabase
    .from("carpools")
    .update({ seats: carpool.seats - 1 })
    .eq("id", carpoolId);

  if (updateError) {
    console.error("Error updating seats:", updateError);
    alert("Failed to join carpool");
    return;
  }

  alert(`You joined the carpool from ${carpool.from_location} to ${carpool.to_location}`);
  loadCarpools();
}

// ----------------------
// Event Listeners
// ----------------------
createBtn.addEventListener("click", createCarpool);

// Event delegation for join buttons
listEl.addEventListener("click", (e) => {
  if (e.target.classList.contains("join-btn")) {
    const li = e.target.closest("li");
    const carpoolId = li.dataset.id;
    if (carpoolId) joinCarpool(Number(carpoolId));
  }
});

// ----------------------
// Load carpools on page load
// ----------------------
loadCarpools();
