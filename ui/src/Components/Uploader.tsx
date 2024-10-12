import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  CopyButton,
  Group,
  Loader,
  Progress,
  rem,
  Text,
  Tooltip,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {IconArrowDown, IconCheck, IconCopy, IconFilePlus, IconShare} from "@tabler/icons-react";
import axios, { AxiosProgressEvent, AxiosRequestConfig } from "axios";
import { downloadZip } from "client-zip";
import { useRef, useState } from "react";
import {fetchPresignedUrls} from "../Requests/api";

export function Uploader() {
  const dropzoneOpenRef = useRef<() => void>(null);
  const [fileName, setFileName] = useState<string | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDropzoneOpen = () => {
    setDownloadUrl(undefined);
    dropzoneOpenRef.current?.();
  };

  const handleDragEnter = () => {
    setIsDragging(true);
    setDownloadUrl(undefined);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropFiles = async (files: File[]) => {
    setIsDragging(false);
    setDownloadUrl(undefined);
    setIsUploading(true);
    setUploadProgress(0);

    let fileToUpload: File | Blob | null;
    let fileNameToUpload: string | undefined;

    if (files.length >= 2) {
      fileToUpload = await downloadZip(files, { buffersAreUTF8: true }).blob();
      fileNameToUpload = `${files[0].name}-archive.zip`;
    } else {
      fileToUpload = files[0];
      fileNameToUpload = files[0].name;
    }

    const { uploadUrl, downloadUrl } = await fetchPresignedUrls({
      fileName: fileNameToUpload,
      expiresInSecs: 7 * 24 * 60 * 60, // 7 days max for presigned urls
    });

    const config: AxiosRequestConfig<File> = {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const progress = Math.round(
          (100 * progressEvent.loaded) / progressEvent.total!,
        );
        setUploadProgress(progress);
      },
    };

    try {
      await axios.put(uploadUrl, fileToUpload, config);
      setDownloadUrl(downloadUrl);
      setIsUploading(false);
      setFileName(fileNameToUpload);
      navigator.clipboard.writeText(downloadUrl);
    } catch (error) {
      console.error("Failed to upload file:", error);
      setIsUploading(false);
    }
  };

  const handleShareLink = () => {
    if (navigator.share && fileName && downloadUrl) {
      navigator
        .share({
          title: `Share link ${fileName}`,
          text: "File Link:",
          url: downloadUrl,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing:", error));
    }
  };

  return (
    <>
      <Box
        display="block"
        pos="absolute"
        top="50%"
        left="50%"
        w="100%"
        maw="rem(500)"
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
            onClick={handleDropzoneOpen}
            style={{ pointerEvents: "all" }}
          >
            {isUploading ? (
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
          {isUploading
            ? `Uploading... ${uploadProgress}%`
            : isDragging
              ? "Drop it like it's hot!"
              : "Upload files"}
        </Text>

        {isUploading && (
          <Container>
            <Progress value={uploadProgress} />
          </Container>
        )}

        <Center>
          <Text size="sm" c="dimmed">
            {!isUploading && !isDragging
              ? "Drag & drop files here to upload."
              : "\u00A0"}
          </Text>
        </Center>
      </Box>

      {downloadUrl && (
        <Box
          display="block"
          m={0}
          pos="absolute"
          bottom="5%"
          left="50%"
          style={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Group gap="xs">
            <CopyButton value={downloadUrl}>
              {({ copied, copy }) => (
                <Tooltip label={fileName}>
                  <Button color={copied ? "teal" : "green"} onClick={copy} rightSection={copied ? (
                      <IconCheck style={{width: rem(16)}}/>
                  ) : (
                      <IconCopy style={{width: rem(16)}}/>
                  )}>
                    {copied ? "Done" : "Copy"}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
            <Button onClick={handleShareLink} rightSection={<IconShare style={{ width: rem(16) }} />}>Share</Button>
          </Group>
        </Box>
      )}

      <Dropzone.FullScreen
        openRef={dropzoneOpenRef}
        active={true}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDropFiles}
      />
    </>
  );
}
