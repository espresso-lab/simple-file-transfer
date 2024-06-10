const hostname =
  location.hostname === "localhost" ? "http://localhost:3000" : "";

export interface CreateLinkRequest {
  file_name: string;
  expires_in_secs: number;
}

export interface CreateLinkResponse {
  upload_url: string;
  download_url: string;
}

export async function fetchPresignedUrls(props: CreateLinkRequest) {
  const res = await fetch(`${hostname}/upload-url`, {
    method: "POST",
    body: JSON.stringify(props),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(await res.json());
  }
  return res.json() as Promise<CreateLinkResponse>;
}
