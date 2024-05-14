import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import Uploader from "./Uploader";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={{ fontFamily: "Open Sans" }} forceColorScheme="light">
      <Uploader />
    </MantineProvider>{" "}
  </React.StrictMode>
);
