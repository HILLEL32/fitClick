import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function uniqCleanSimple(arr) {
  let result = [];
  for (let i = 0; i < (arr ? arr.length : 0); i++) {
    let value = arr[i];
    if (!value) continue;
    value = String(value).trim().toLowerCase();
    if (value && !result.includes(value)) result.push(value);
  }
  return result;
}

function normalizeItemFields(item) {
  return {
    ...item,
    type: uniqCleanSimple(item?.type || []),
    colors: uniqCleanSimple(item?.colors || []),
    style: uniqCleanSimple(item?.style || []),
  };
}

export async function getWardrobe(uid) {
  const q = query(collection(db, "clothingItems"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  const items = [];
  querySnapshot.forEach((doc) => {
    items.push(normalizeItemFields({ id: doc.id, ...doc.data() }));
  });
  return items;
}