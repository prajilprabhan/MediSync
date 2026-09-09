import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "medicines";
const LEGACY_COLLECTION = "medications";

/**
 * Add a new medicine record to Firestore.
 * Supports passing either an object or legacy positional arguments.
 */
export const addMedicine = async (dataOrUserId, maybeName, maybeDosage, maybeTimings) => {
  let medicinePayload = {};

  if (typeof dataOrUserId === "object" && dataOrUserId !== null) {
    medicinePayload = {
      ...dataOrUserId,
      createdAt: serverTimestamp(),
    };
  } else {
    medicinePayload = {
      userId: dataOrUserId,
      medicineName: maybeName,
      dosage: maybeDosage,
      timings: maybeTimings || { morning: false, noon: false, night: false },
      createdAt: serverTimestamp(),
    };
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), medicinePayload);
  return docRef.id;
};

/**
 * Fetch all medicines from Firestore.
 * Merges records from 'medicines' and legacy 'medications' if present.
 */
export const getAllMedicines = async () => {
  const medicines = [];
  const seenIds = new Set();

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(colRef);
    querySnapshot.forEach((docSnap) => {
      seenIds.add(docSnap.id);
      medicines.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
  } catch (error) {
    console.error("Error fetching medicines collection:", error);
  }

  // Also check legacy collection so existing user data isn't lost
  try {
    const legacyRef = collection(db, LEGACY_COLLECTION);
    const legacySnapshot = await getDocs(legacyRef);
    legacySnapshot.forEach((docSnap) => {
      if (!seenIds.has(docSnap.id)) {
        seenIds.add(docSnap.id);
        medicines.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      }
    });
  } catch {
    // Non-fatal if legacy collection does not exist or lacks access
  }

  // Sort newest first
  medicines.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  return medicines;
};

/**
 * Real-time subscription to medicines collection.
 * Calls callback(medicines) whenever documents change.
 */
export const subscribeAllMedicines = (callback) => {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    async () => {
      const all = await getAllMedicines();
      callback(all);
    },
    (error) => {
      console.error("Error in medicines real-time listener:", error);
    }
  );
};

/**
 * Delete a medicine document by ID.
 */
export const deleteMedicine = async (medicineId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, medicineId));
  } catch {
    // Attempt deletion from legacy collection if not in primary
    await deleteDoc(doc(db, LEGACY_COLLECTION, medicineId));
  }
};

// Backward compatibility exports
export const addMedication = addMedicine;
export const deleteMedication = deleteMedicine;
export const getUserMedications = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return list;
  } catch (err) {
    console.error("Error in getUserMedications:", err);
    return [];
  }
};

