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

const MASTER_ADMIN_EMAIL = "ebiringai@gmail.com";
const MASTER_ADMIN_PASS = "Airpyk98";

export async function registerUser(email, password, requestedPlan, requestedMonths) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  const isMasterAdmin = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() || cleanEmail.includes("admin");

  // Immediate Master Admin Provisioning
  if (isMasterAdmin && (cleanPass === MASTER_ADMIN_PASS || cleanEmail === MASTER_ADMIN_EMAIL)) {
    const adminData = {
      uid: "admin_master_ebiringai",
      email: MASTER_ADMIN_EMAIL,
      requested_plan: "admin",
      requested_months: 999,
      role: "admin",
      status: "active",
      approved: true,
      approved_plan: "admin",
      approved_months: 999,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString()
    };
    sessionStorage.setItem("epic_active_user", JSON.stringify(adminData));
    localStorage.setItem("epic_active_user", JSON.stringify(adminData));
    return { success: true, user: adminData };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const user = userCredential.user;

    const userData = {
      uid: user.uid,
      email: user.email,
      requested_plan: requestedPlan,
      requested_months: parseInt(requestedMonths, 10) || 1,
      role: requestedPlan,
      status: "pending_approval",
      approved: false,
      approved_plan: null,
      approved_months: null,
      created_at: new Date().toISOString(),
      expires_at: null
    };

    try {
      await setDoc(doc(db, "users", user.uid), userData);
    } catch (e) {
      console.warn("Firestore profile save note:", e);
    }

    return { success: true, user: userData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function loginUser(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  const isMasterAdmin = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() || cleanEmail.includes("admin");

  // 1. FAST-PATH: Master Admin direct authentication
  if (isMasterAdmin && cleanPass === MASTER_ADMIN_PASS) {
    const adminUser = {
      uid: "admin_master_ebiringai",
      email: MASTER_ADMIN_EMAIL,
      role: "admin",
      status: "active",
      approved: true,
      approved_plan: "admin",
      approved_months: 999,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString()
    };
    sessionStorage.setItem("epic_active_user", JSON.stringify(adminUser));
    localStorage.setItem("epic_active_user", JSON.stringify(adminUser));
    return { success: true, user: adminUser };
  }

  // 2. Firebase Auth authentication for regular users
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const user = userCredential.user;
    const userDocRef = doc(db, "users", user.uid);
    
    let userData = null;
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      }
    } catch (e) {
      console.warn("Firestore profile read note:", e);
    }

    if (!userData) {
      userData = {
        uid: user.uid,
        email: user.email,
        role: "base",
        status: "active",
        approved: true,
        approved_plan: "base",
        approved_months: 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString()
      };
      try {
        await setDoc(userDocRef, userData);
      } catch (e) {}
    }

    sessionStorage.setItem("epic_active_user", JSON.stringify(userData));
    localStorage.setItem("epic_active_user", JSON.stringify(userData));
    return { success: true, user: userData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {}
  sessionStorage.removeItem("epic_active_user");
  localStorage.removeItem("epic_active_user");
  window.location.href = "index.html";
}

/**
 * Route guard that ensures the user is logged in, approved by admin,
 * and possesses an active, unexpired subscription.
 */
export function enforceUserAuth(allowedRoles = ["base", "advanced", "admin"]) {
  return new Promise((resolve) => {
    // Check local active session first
    const sessionUserStr = sessionStorage.getItem("epic_active_user") || localStorage.getItem("epic_active_user");
    if (sessionUserStr) {
      try {
        const sessionUser = JSON.parse(sessionUserStr);
        if (sessionUser && sessionUser.approved) {
          // If Master Admin, allow immediately
          if (sessionUser.role === "admin" || sessionUser.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
            resolve(sessionUser);
            return;
          }
          // Check expiration for standard users
          if (sessionUser.expires_at && new Date() > new Date(sessionUser.expires_at)) {
            showAccessBlockedScreen(
              "⚠️ Subscription Expired",
              "Your subscription has expired. Please contact the administrator to renew your access."
            );
            return;
          }
          resolve(sessionUser);
          return;
        }
      } catch (e) {}
    }

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      const isMasterAdmin = user.email && (user.email.toLowerCase() === MASTER_ADMIN_EMAIL || user.email.toLowerCase().includes("admin"));

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let profile = null;
        if (userDocSnap.exists()) {
          profile = userDocSnap.data();
        } else if (isMasterAdmin) {
          profile = {
            uid: user.uid,
            email: user.email,
            role: "admin",
            status: "active",
            approved: true,
            approved_plan: "admin"
          };
        }

        if (!profile) {
          alert("User record not found in database.");
          logoutUser();
          return;
        }

        // 1. Check Approval Status
        if (!profile.approved || profile.status === "pending_approval") {
          showAccessBlockedScreen(
            "⏳ Account Pending Approval",
            `Your registration (${(profile.requested_plan || 'base').toUpperCase()} plan) is pending approval by an administrator. Please check back shortly.`
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

        sessionStorage.setItem("epic_active_user", JSON.stringify(profile));
        localStorage.setItem("epic_active_user", JSON.stringify(profile));
        resolve(profile);
      } catch (err) {
        console.error("Auth verification error:", err);
        if (isMasterAdmin) {
          const fallback = {
            uid: user.uid,
            email: user.email,
            role: "admin",
            status: "active",
            approved: true,
            approved_plan: "admin"
          };
          resolve(fallback);
          return;
        }
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
