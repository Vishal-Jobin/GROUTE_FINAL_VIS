
import { supabase } from "./supabase.js";

/* ================= CONFIG ================= */

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijg1M2U2NDM1OTgxNTQyMjk4YjlkM2ZlNDQyNjI4MGE1IiwiaCI6Im11cm11cjY0In0="; // replace with your key

const EMISSION_FACTORS = { petrol: 192, diesel: 171, hybrid: 90, electric: 0 };

let map = L.map("map").setView([10.8505, 76.2711], 7); // Kerala
let routeLayer, startMarker, endMarker, carMarker;
let routeCoords = [];
let distance = 0;
let co2Saved = 0;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ----------------- Geocode -----------------
async function geocode(place) {
  const res = await fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(place)}&boundary.country=IND`
  );
  const data = await res.json();
  if (!data.features?.length) return null;
  return data.features[0].geometry.coordinates; // [lng, lat]
}

// ----------------- Vehicle Emission -----------------
async function getUserVehicleEmission() {
  const username = localStorage.user;
  if (!username) return EMISSION_FACTORS.petrol;

  const { data, error } = await supabase
    .from("users")
    .select("vehicle_type")
    .eq("username", username)
    .single();

  if (error || !data) return EMISSION_FACTORS.petrol;
  return EMISSION_FACTORS[data.vehicle_type] ?? EMISSION_FACTORS.petrol;
}

// ----------------- Find Route -----------------
window.findRoute = async () => {
  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  if (!from || !to) return alert("Enter start and end locations");

  const start = await geocode(from);
  const end = await geocode(to);

  if (!start || !end) {
    alert("Location not found. Use city/town, e.g., 'Kochi, Kerala'");
    return;
  }

  try {
    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: [start, end] }),
      }
    );

    const data = await res.json();
    if (!data.features?.length) return alert("Route not found");

    distance = data.features[0].properties.segments[0].distance / 1000;
    routeCoords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const userEmission = await getUserVehicleEmission();
    const petrolEmission = EMISSION_FACTORS.petrol;
    co2Saved = Math.max(0, petrolEmission * distance - userEmission * distance);

    // Clear old layers
    [routeLayer, startMarker, endMarker, carMarker].forEach(l => l && map.removeLayer(l));

    routeLayer = L.polyline(routeCoords, { color: "green", weight: 5 }).addTo(map);
    startMarker = L.marker(routeCoords[0]).addTo(map).bindPopup("Start");
    endMarker = L.marker(routeCoords.at(-1)).addTo(map).bindPopup("Destination");

    map.fitBounds(routeLayer.getBounds());

    document.getElementById("result").innerText =
      `Distance: ${distance.toFixed(2)} km | CO₂ saved: ${co2Saved.toFixed(0)} g`;
  } catch (err) {
    console.error(err);
    alert("Failed to calculate route. Try specifying city/town, e.g., 'Kochi, Kerala'");
  }
};

// ----------------- Animate -----------------
function animateRoute() {
  if (!routeCoords.length) return;
  let i = 0;

  carMarker = L.marker(routeCoords[0], {
    icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61168.png", iconSize: [32, 32] }),
  }).addTo(map);

  const interval = setInterval(() => {
    i++;
    if (i >= routeCoords.length) return clearInterval(interval);
    carMarker.setLatLng(routeCoords[i]);
  }, 50);
}

// ----------------- Start Trip -----------------
window.startTrip = async () => {
  if (!distance) return alert("Find a route first");

  animateRoute();

  const pointsEarned = Math.floor(distance * 5 + co2Saved / 100);
  const username = localStorage.user;

  if (!username) {
    alert("User not logged in!");
    return;
  }

  try {
    // Get current user values
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("points, distance_travelled, emission_value")
      .eq("username", username)
      .single();

    if (fetchError) throw fetchError;

    // Add new trip values
    const updatedPoints = (user.points || 0) + pointsEarned;
    const updatedDistance = (user.distance_travelled || 0) + distance;
    const updatedCO2 = (user.emission_value || 0) + co2Saved;

    // Update table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        points: updatedPoints,
        distance_travelled: updatedDistance,
        emission_value: updatedCO2
      })
      .eq("username", username);

    if (updateError) throw updateError;

    alert(
      `Trip completed!\nPoints earned: ${pointsEarned}\nCO₂ saved: ${co2Saved.toFixed(0)} g`
    );
  } catch (err) {
    console.error(err);
    alert("Failed to save trip: " + err.message);
  }
};
