const hostname =
  location.hostname === "localhost" ? "http://localhost:3000" : "";

export interface CreateLinkRequest {
  fileName: string;
  expiresInSecs: number;
}

export interface CreateLinkResponse {
  uploadUrl: string;
  downloadUrl: string;
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