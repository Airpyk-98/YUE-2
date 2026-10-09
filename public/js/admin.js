// Admin Dashboard Logic: User Approvals, Role Management, and Subscriptions
import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "./firebase-config.js";

export async function fetchAllUsers() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);
  const users = [];
  snapshot.forEach(docSnap => {
    users.push({ id: docSnap.id, ...docSnap.data() });
  });
  return users;
}

export async function approveUserRegistration(uid, approvedPlan, approvedMonths) {
  const months = parseInt(approvedMonths, 10) || 1;
  const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    approved: true,
    status: "active",
    approved_plan: approvedPlan,
    role: approvedPlan,
    approved_months: months,
    expires_at: expiresAt,
    approved_at: new Date().toISOString()
  });
  return true;
}

export async function deleteUserRecord(uid) {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
  return true;
}

export async function setUserSuspension(uid, suspend = true) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status: suspend ? "suspended" : "active",
    suspended_at: suspend ? new Date().toISOString() : null
  });
  return true;
}

export async function changeUserPlan(uid, newPlan) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    approved_plan: newPlan,
    role: newPlan
  });
  return true;
}

export async function extendUserSubscription(uid, additionalMonths) {
  const months = parseInt(additionalMonths, 10) || 1;
  const userRef = doc(db, "users", uid);
  
  // Calculate new expiration date
  const extraMs = months * 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + extraMs).toISOString();

  await updateDoc(userRef, {
    expires_at: expiresAt,
    status: "active"
  });
  return true;
}
