import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import Uploader from "./Uploader";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider forceColorScheme="light">
      <Uploader />
    </MantineProvider>
  </React.StrictMode>
);
