import { supabase } from "./supabase.js";

const couponsList = document.getElementById("coupons-list");
const userPointsEl = document.getElementById("user-points");

// Current logged-in user
const username = localStorage.getItem("user");
if (!username) {
  alert("Please log in first!");
  window.location.href = "index.html";
}

// Example coupons (used if DB is empty)
const exampleCoupons = [
  { id: 1, name: "10% Off Travel", cost: 120 },
  { id: 2, name: "Free Coffee", cost: 200 },
  { id: 3, name: "50% Off Ride", cost: 500 },
  { id: 4, name: "Lunch Voucher", cost: 700 },
  { id: 5, name: "Movie Ticket", cost: 800 },
  { id: 6, name: "Eco Bag", cost: 200 },
];

// Load user points
async function loadUserPoints() {
  const { data: user, error } = await supabase
    .from("users")
    .select("points")
    .eq("username", username)
    .single();

  if (error || !user) {
    console.error("Error fetching user points:", error);
    return 0;
  }

  userPointsEl.textContent = user.points;
  return user.points;
}

// Load coupons from DB or use examples
async function loadCoupons() {
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("*")
    .order("cost", { ascending: true });

  const userPoints = await loadUserPoints();

  couponsList.innerHTML = "";

  // Use DB coupons if available, otherwise use exampleCoupons
  const list = (coupons && coupons.length > 0) ? coupons : exampleCoupons;

  list.forEach(coupon => {
    const box = document.createElement("div");
    box.classList.add("dashboard-box");

    box.innerHTML = `
      <h3>${coupon.name}</h3>
      <p>Cost: ${coupon.cost} points</p>
      <button ${userPoints < coupon.cost ? "disabled" : ""} onclick="redeemCoupon(${coupon.id}, ${coupon.cost})">
        ${userPoints < coupon.cost ? "Not enough points" : "Redeem"}
      </button>
    `;

    couponsList.appendChild(box);
  });
}

// Redeem a coupon
window.redeemCoupon = async function(couponId, couponCost) {
  const currentPoints = await loadUserPoints();

  if (currentPoints < couponCost) {
    alert("You do not have enough points!");
    return;
  }

  // Deduct points from user
  const { error: updateError } = await supabase
    .from("users")
    .update({ points: currentPoints - couponCost })
    .eq("username", username);

  if (updateError) {
    console.error("Error updating points:", updateError);
    alert("Error redeeming coupon");
    return;
  }

  // Add coupon to user's profile
  const { error: insertError } = await supabase
    .from("user_coupons")
    .insert({ username, coupon_name: couponId });

  if (insertError) {
    console.error("Error saving coupon:", insertError);
    alert("Error redeeming coupon");
    return;
  }

  alert("Coupon redeemed successfully!");
  loadCoupons();
  loadUserPoints();
};

// Initial load
loadCoupons();
loadUserPoints();
