import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles.css";

// iOS Safari ignores user-scalable=no, so block its pinch gesture here to keep the app from zooming like a web page.
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(type, event => event.preventDefault(), { passive: false });
}

// Offline support and faster start for the installed app. Production only, so development always shows fresh code.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
