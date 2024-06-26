import {
  ActionIcon,
  Box,
  Button,
  Center,
  CopyButton,
  Loader,
  rem,
  Text,
  Tooltip,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconArrowDown, IconFilePlus } from "@tabler/icons-react";
import { downloadZip } from "client-zip";
import { useRef, useState } from "react";
import { fetchPresignedUrls } from "../Requests/api";

export function Uploader() {
  const openRef = useRef<() => void>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [downloadLink, setDownloadLink] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  return (
    <>
      <Box
        display={"block"}
        pos={"absolute"}
        top={"50%"}
        left={"50%"}
        w={"100%"}
        maw={"rem(500)"}
        style={{
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      >
        <Center mb={15}>
          <ActionIcon
            radius="lg"
            variant="gradient"
            size={100}
            gradient={
              isDragging
                ? { from: "red", to: "orange", deg: 109 }
                : { from: "grape", to: "indigo", deg: 113 }
            }
            onClick={() => {
              setDownloadLink(undefined);
              openRef.current?.();
            }}
            style={{ pointerEvents: "all" }}
          >
            {isPending ? (
              <Loader color="white" />
            ) : isDragging ? (
              <IconArrowDown
                style={{ width: rem(80), height: rem(80) }}
                stroke={1.5}
              />
            ) : (
              <IconFilePlus
                style={{ width: rem(80), height: rem(80) }}
                stroke={1.5}
              />
            )}
          </ActionIcon>
        </Center>

        <Text ta="center" size="xl" fw={600}>
          {isPending
            ? "Uploading..."
            : isDragging
              ? "Drop it like it's hot!"
              : "Upload files"}
        </Text>

        <Center>
          <Text size="sm" c="dimmed">
            {!isPending && !isDragging
              ? "Drag & drop files here to upload."
              : "\u00A0"}
          </Text>
        </Center>
      </Box>

      {downloadLink && (
        <Box
          display={"block"}
          m={0}
          pos={"absolute"}
          bottom={"5%"}
          left={"50%"}
          style={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <CopyButton value={downloadLink}>
            {({ copied, copy }) => (
              <Tooltip label={filename}>
                <Button color={copied ? "teal" : "green"} onClick={copy}>
                  {copied ? "Copied url" : "Copy url"}
                </Button>
              </Tooltip>
            )}
          </CopyButton>
        </Box>
      )}

      <Dropzone.FullScreen
        openRef={openRef}
        active={true}
        onDragEnter={() => {
          setIsDragging(true);
          setDownloadLink(undefined);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={async (files) => {
          setIsDragging(false);
          setDownloadLink(undefined);
          setIsPending(true);
          let file = null;
          let fileName: string | undefined = undefined;

          if (files.length >= 2) {
            file = await downloadZip(files, { buffersAreUTF8: true }).blob();
            fileName = files[0].name + "-archive.zip";
          } else {
            file = files[0];
            fileName = file.name;
          }

          const { upload_url, download_url } = await fetchPresignedUrls({
            file_name: fileName,
            expires_in_secs: 7 * 24 * 60 * 60, // 7 days
          });

          const res = await fetch(upload_url, {
            method: "PUT",
            body: file,
          });

          setIsPending(false);

          if (!res.ok) {
            console.error("Failed to upload file");
          } else {
            setFilename(fileName);
            setDownloadLink(download_url);
            navigator.clipboard.writeText(download_url);

            if (navigator.share) {
              navigator
                .share({
                  title: "Share link " + fileName,
                  text: "File Link:",
                  url: window.location.href,
                })
                .then(() => console.log("Successful share"))
                .catch((error) => console.log("Error sharing:", error));
            }
          }
        }}
      ></Dropzone.FullScreen>
    </>
  );
}
