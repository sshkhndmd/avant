import React from "react";
import ReactDOM from "react-dom/client";
import vkBridge from "@vkontakte/vk-bridge";
import App from "./App";
import "./index.css";
import "./vk.css";

vkBridge.send("VKWebAppInit").catch(() => {
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);