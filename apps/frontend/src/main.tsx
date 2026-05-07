import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#102033",
            color: "#f6f9fc",
            borderRadius: "18px",
            padding: "14px 16px"
          }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
