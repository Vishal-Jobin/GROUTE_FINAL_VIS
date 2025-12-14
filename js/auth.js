import { supabase } from "./supabase.js";

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

signupBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  // Insert user into Supabase
  const { data, error } = await supabase
    .from("users")
    .insert({ username, password, points: 0, distance_travelled: 0, emission_value: 0 });

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Signup successful!");
  }
});

loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("Invalid username or password");
  } else {
    // Save logged-in user
    localStorage.setItem("user", data.username);
    window.location.href = "home.html";
  }
});
