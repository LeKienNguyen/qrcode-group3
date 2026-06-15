import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  increment,
  updateDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const QR_COLLECTION = 'qrCodes'
const BLOCKED_ATTEMPTS_COLLECTION = 'blockedAttempts'
const QR_SCANS_COLLECTION = 'qr_scans'

const NOT_CONFIGURED_MESSAGE =
  'Firebase is not configured. Set the VITE_FIREBASE_* environment variables (see .env.example) to enable saving QR history.'

function assertConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(NOT_CONFIGURED_MESSAGE)
  }
}

/**
 * Saves a generated QR record to Firestore.
 * @param {{ type: string, content: string, status?: string, scans?: number }} record
 * @returns {Promise<string>} the new document's id
 */
export async function saveQR({ type, content, status = 'active', scans = 0 }) {
  assertConfigured()

  const docRef = await addDoc(collection(db, QR_COLLECTION), {
    type,
    content,
    status,
    scans,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

/**
 * Fetches all saved QR records, most recently created first.
 * @returns {Promise<Array<{ id: string, type: string, content: string, createdAt: any, status: string, scans: number }>>}
 */
export async function getQRs() {
  assertConfigured()

  const q = query(collection(db, QR_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

/**
 * Deletes a saved QR record by id.
 * @param {string} id
 */
export async function deleteQR(id) {
  assertConfigured()

  await deleteDoc(doc(db, QR_COLLECTION, id))
}

/**
 * Fetches a single saved QR record by id.
 * @param {string} id
 * @returns {Promise<{ id: string, type: string, content: string, createdAt: any, status: string, scans: number } | null>}
 */
export async function getQR(id) {
  assertConfigured()

  const snapshot = await getDoc(doc(db, QR_COLLECTION, id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

/**
 * Records a scan of a saved QR code: logs a qr_scans entry and bumps the
 * QR's scan counter.
 * @param {string} qrId
 * @param {string} device
 */
export async function recordScan(qrId, device) {
  assertConfigured()

  await Promise.all([
    addDoc(collection(db, QR_SCANS_COLLECTION), {
      qrId,
      scannedAt: serverTimestamp(),
      device,
    }),
    updateDoc(doc(db, QR_COLLECTION, qrId), { scans: increment(1) }),
  ])
}

/**
 * Fetches all recorded QR scans, most recent first.
 * @returns {Promise<Array<{ id: string, qrId: string, scannedAt: any, device: string }>>}
 */
export async function getScans() {
  assertConfigured()

  const q = query(collection(db, QR_SCANS_COLLECTION), orderBy('scannedAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

/**
 * Records a QR generation attempt that was blocked by local moderation or
 * the AI safety check, for the admin dashboard.
 * @param {{ type: string, content: string, reason: string, source: string }} attempt
 */
export async function logBlockedAttempt({ type, content, reason, source }) {
  assertConfigured()

  await addDoc(collection(db, BLOCKED_ATTEMPTS_COLLECTION), {
    type,
    content,
    reason,
    source,
    createdAt: serverTimestamp(),
  })
}

/**
 * Fetches all blocked QR attempts, most recently created first.
 * @returns {Promise<Array<{ id: string, type: string, content: string, reason: string, source: string, createdAt: any }>>}
 */
export async function getBlockedAttempts() {
  assertConfigured()

  const q = query(collection(db, BLOCKED_ATTEMPTS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}
