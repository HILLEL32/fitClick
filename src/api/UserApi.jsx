// src/api/userApi.js
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export const DEFAULT_STYLE = {
  bio: "",
  keywords: [],
  disliked: [],
  dressCode: null,
  colorsFav: [],
  colorsAvoid: []
};

export async function getUserProfile() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No authenticated user");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function initUserProfileIfNeeded(extra = {}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No authenticated user");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      style: DEFAULT_STYLE,
      ...extra
    });
  }
}

// ---- NEW: style helpers ----
export async function getUserStyle() {
  const profile = await getUserProfile();
  return profile?.style ?? DEFAULT_STYLE;
}

export async function updateUserStyle(stylePatchOrFull) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No authenticated user");
  const ref = doc(db, "users", uid);

  // ניתן לשלוח אובייקט מלא של style או רק patch – שניהם יעבדו
  await setDoc(
    ref,
    {
      style: stylePatchOrFull,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  const snap = await getDoc(ref);
  return snap.data()?.style ?? DEFAULT_STYLE;
}
