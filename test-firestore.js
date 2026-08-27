import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const docRef = doc(db, 'department_cms', 'master');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log("Document size (approx):", JSON.stringify(snap.data()).length);
    } else {
      console.log("Document does not exist in cloud.");
    }
  } catch (e) {
    console.error("Firestore Error:", e);
  }
  process.exit(0);
}
run();
