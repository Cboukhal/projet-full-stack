/** Point d'entrée React : installe les styles globaux et les fournisseurs partagés. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import "./index.css";
import './styles/design_token.css';

createRoot(document.getElementById("root")).render(
  // StrictMode signale en développement les effets non idempotents et les API React obsolètes.
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
