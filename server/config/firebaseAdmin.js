import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin";

let appInstance = null;

function ensureApp() {
  if (!getApps().length) {
    try {
      appInstance = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "store-e3fe6"
      });
    } catch (err) {
      console.error("Firebase Admin initialization error:", err);
    }
  } else {
    appInstance = getApp();
  }
  return appInstance;
}

export function getDbAdmin() {
  ensureApp();
  try {
    return getFirestore();
  } catch (err) {
    if (typeof admin?.firestore === "function") {
      try { return admin.firestore(); } catch (_) {}
    }
    console.error("Firestore Admin Client error:", err);
    return null;
  }
}

export function getAuthAdmin() {
  ensureApp();
  try {
    return getAuth();
  } catch (err) {
    if (typeof admin?.auth === "function") {
      try { return admin.auth(); } catch (_) {}
    }
    console.error("Firebase Auth Admin Client error:", err);
    return null;
  }
}

export default admin;
