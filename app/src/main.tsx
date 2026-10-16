import React from "react";
import { createRoot } from "react-dom/client";
import { StudioApp } from "./studio/StudioApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><StudioApp /></React.StrictMode>);
