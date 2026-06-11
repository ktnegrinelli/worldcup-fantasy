import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    if (r) {
      setInterval(() => {
        r.update();
      }, 1000 * 60 * 10);
    }
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);