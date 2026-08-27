import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

// Read config
const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function exportData() {
  try {
    const snap = await getDoc(doc(db, "department_cms", "master"));
    if (snap.exists()) {
      fs.writeFileSync("db_dump.json", JSON.stringify(snap.data(), null, 2));
      console.log("Dumped to db_dump.json");
    } else {
      console.log("No data found");
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
exportData();
