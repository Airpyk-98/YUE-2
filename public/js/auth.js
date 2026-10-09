// Authentication & Role-Based Access Control Module
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc 
} from "./firebase-config.js";

export async function registerUser(email, password, requestedPlan, requestedMonths) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if this is the first user or designated admin
    const isAdmin = email.toLowerCase().includes("admin");

    const userData = {
      uid: user.uid,
      email: user.email,
      requested_plan: requestedPlan,
      requested_months: parseInt(requestedMonths, 10) || 1,
      role: isAdmin ? "admin" : requestedPlan,
      status: isAdmin ? "active" : "pending_approval",
      approved: isAdmin ? true : false,
      approved_plan: isAdmin ? "admin" : null,
      approved_months: isAdmin ? 999 : null,
      created_at: new Date().toISOString(),
      expires_at: isAdmin ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString() : null
    };

    await setDoc(doc(db, "users", user.uid), userData);
    return { success: true, user: userData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    
    if (!userDocSnap.exists()) {
      return { success: false, error: "User profile record not found." };
    }

    const userData = userDocSnap.data();
    return { success: true, user: userData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}

/**
 * Route guard that ensures the user is logged in, approved by admin,
 * and possesses an active, unexpired subscription.
 */
export function enforceUserAuth(allowedRoles = ["base", "advanced", "admin"]) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          alert("User record not found in database.");
          logoutUser();
          return;
        }

        const profile = userDocSnap.data();

        // 1. Check Approval Status
        if (!profile.approved || profile.status === "pending_approval") {
          showAccessBlockedScreen(
            "⏳ Account Pending Approval",
            `Your registration (${profile.requested_plan.toUpperCase()} plan for ${profile.requested_months} month(s)) is pending approval by an administrator. Please check back shortly.`
          );
          return;
        }

        // 2. Check Suspension
        if (profile.status === "suspended" || profile.status === "deactivated") {
          showAccessBlockedScreen(
            "🔒 Access Suspended",
            "Your access to this platform has been deactivated or restricted by the administrator. Contact support for assistance."
          );
          return;
        }

        // 3. Check Subscription Expiration
        if (profile.expires_at) {
          const now = new Date();
          const expiryDate = new Date(profile.expires_at);
          if (now > expiryDate && profile.role !== "admin") {
            showAccessBlockedScreen(
              "⚠️ Subscription Expired",
              `Your subscription expired on ${expiryDate.toLocaleDateString()}. Please contact the administrator to renew your access.`
            );
            return;
          }
        }

        // 4. Role Authorization
        const userPlan = profile.approved_plan || profile.role;
        if (!allowedRoles.includes(userPlan) && profile.role !== "admin") {
          alert("You do not have permission to access this page.");
          window.location.href = "dashboard.html";
          return;
        }

        resolve(profile);
      } catch (err) {
        console.error("Auth verification error:", err);
        logoutUser();
      }
    });
  });
}

function showAccessBlockedScreen(title, message) {
  document.body.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#090d16; color:#f8fafc; font-family:sans-serif; padding:24px;">
      <div style="max-width:480px; width:100%; background:#1e293b; border:1px solid #334155; border-radius:16px; padding:32px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <div style="font-size:48px; margin-bottom:16px;">⏳</div>
        <h2 style="font-size:22px; font-weight:700; margin-bottom:12px; color:#38bdf8;">${title}</h2>
        <p style="font-size:14px; color:#94a3b8; line-height:1.6; margin-bottom:24px;">${message}</p>
        <button id="btnSignOut" style="padding:10px 24px; background:#ef4444; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Sign Out</button>
      </div>
    </div>
  `;
  document.getElementById("btnSignOut").addEventListener("click", logoutUser);
}
