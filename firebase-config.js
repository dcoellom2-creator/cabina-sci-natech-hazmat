// Firebase Spark, creado el 2026-10-02. Sin facturacion ni servicios de pago.
// Configuracion publica de cliente: no es una credencial de administrador.
// RTDB permanece bloqueado hasta confirmar la activacion de los proveedores y reglas probadas.
// Uso: import { app, database } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyAQpiI4MkhcaDacujro2qw-3BpLx0TPGy0",
  authDomain: "cabina-sci-natech-matpel.firebaseapp.com",
  databaseURL: "https://cabina-sci-natech-matpel-default-rtdb.firebaseio.com",
  projectId: "cabina-sci-natech-matpel",
  messagingSenderId: "1068350353943",
  appId: "1:1068350353943:web:5168e9531b51bdc3f32252"
});
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

