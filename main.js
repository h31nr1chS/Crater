import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
import { firebaseConfig } from './keys.js';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCwTm4Sy0Wl-UkTWWfA5Hjzv8DgS-kBWiQ",
//   authDomain: "crater-1badf.firebaseapp.com",
//   databaseURL: "https://crater-1badf-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "crater-1badf",
//   storageBucket: "crater-1badf.appspot.com",
//   messagingSenderId: "444195032820",
//   appId: "1:444195032820:web:1139e8849e77e29b2ed8a1",
//   measurementId: "G-GBY8VZ5X69"
// };

// Initialize Firebase
const firebaseApp  = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const app = express();
const port = 3001;

// Middleware to handle the reverse proxy based on Firebase mappings
app.use((req, res, next) => {
  const host = req.headers.host.replace(/\./g, ',').replace(':3001','');
  console.log(host);
  const dataRef = dbRef(db, `/`);

  onValue(dataRef, (snapshot) => {
    const mappings = snapshot.val();
    if (mappings && mappings[host]) {
      const target = mappings[host];
      const proxy = createProxyMiddleware({
        target: `https://${target}`, // Modify this if your target requires HTTPS
        changeOrigin: true,
        pathRewrite: (path, req) => path, // Keep this if you don't need to modify the path
      });
      proxy(req, res, next);
    } else {
      res.status(404).send('Mapping not found');
    }
  }, {
    onlyOnce: true // Ensure we only listen once per request to avoid memory leaks
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
