import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a2e",
            color: "#f0f0f5",
            border: "1px solid rgba(108,99,255,0.3)",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: { iconTheme: { primary: "#C8FF00", secondary: "#0A0A0F" } },
          error:   { iconTheme: { primary: "#ff6b6b", secondary: "#0A0A0F" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
