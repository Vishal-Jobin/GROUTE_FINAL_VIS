import { supabase } from "./supabase.js";

const user = localStorage.getItem("user");

const uname = document.getElementById("uname");
const points = document.getElementById("points");
const distance = document.getElementById("distance");
const emission = document.getElementById("emission");
const couponsList = document.getElementById("coupons");

const loadProfile = async () => {
  // Load user info
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("username", user)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user:", userError);
    return;
  }

  uname.innerText = "User: " + userData.username;
  points.innerText = "Points: " + userData.points;
  distance.innerText = "Distance: " + userData.distance_travelled + " km";
  emission.innerText = "Emission value: " + userData.emission_value;

  // Load redeemed coupons
  const { data: userCoupons, error: couponError } = await supabase
    .from("user_coupons")
    .select("*")
    .eq("username", user)
    .order("id", { ascending: true });

  if (couponError) {
    console.error("Error fetching coupons:", couponError);
    couponsList.innerHTML = "<li>Could not load coupons.</li>";
    return;
  }

  if (!userCoupons || userCoupons.length === 0) {
    couponsList.innerHTML = "<li>No coupons redeemed yet.</li>";
    return;
  }

  // Fetch coupon details from coupons table
  couponsList.innerHTML = "";
  for (let uc of userCoupons) {
    let couponName = uc.coupon_name;

    // If you stored coupon id, fetch name/cost from coupons table
    const { data: couponData } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponName)
      .single();

    const li = document.createElement("li");
    li.innerText = couponData
      ? `${couponData.name} - Cost: ${couponData.cost} points`
      : `${couponName} Contact Service to activate coupon`;
    couponsList.appendChild(li);
  }
};

window.saveVehicle = async () => {
  const fuel = document.getElementById("fuel").value.toLowerCase();
  if (fuel !== "petrol" && fuel !== "diesel") {
    alert("Please enter 'petrol' or 'diesel'");
    return;
  }

  const emissionValue = fuel === "diesel" ? 150 : 120;

  await supabase
    .from("users")
    .update({ vehicle_type: fuel, emission_value: emissionValue })
    .eq("username", user);

  alert("Vehicle saved!");
  loadProfile();
};

loadProfile();
