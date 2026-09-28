// Admin Web Push subscription. The subscription is saved to Firestore
// (`pushSubs`); the server reads it to send background notifications when a new
// order arrives (even with the app closed).
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// VAPID public key (safe to expose). The private key lives only on the server.
const VAPID_PUBLIC = 'BCoD3-a82PMDZPET3VlKq1L3pFiMOMzNDqM_w-gcsH0OUHKwMtmCa6VtrbM0zxpfkJXV6c285UgKoIr380vedVM';

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

// djb2 hash → stable doc id from the endpoint (so re-subscribes overwrite).
const hashId = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return 's' + h.toString(36);
};

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator &&
  'PushManager' in window && 'Notification' in window;

// Request permission + subscribe + save to Firestore. Returns true on success.
export const enableAdminPush = async () => {
  if (!pushSupported() || !db) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }
  const json = JSON.stringify(sub.toJSON());
  await setDoc(doc(db, 'pushSubs', hashId(sub.endpoint)), {
    json,
    updatedAt: Date.now(),
  });
  return true;
};
