import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dropzone/styles.css";
import { ColorSchemeScript, Container, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Uploader from "./Components/Uploader";

export default function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        defaultColorScheme="auto"
        theme={{
          primaryColor: "violet",
        }}
      >
        <Notifications />
        <Container
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Uploader />
        </Container>
      </MantineProvider>
    </>
  );
}
