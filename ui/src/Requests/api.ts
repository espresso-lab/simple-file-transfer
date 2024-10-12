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

export async function fetchPreSignedUrls(props: CreateLinkRequest) {
  const res = await fetch(`${hostname}/upload-url`, {
    method: "POST",
    body: JSON.stringify(props),
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Session expired
  if (res.status === 403) {
    location.reload();
  }

  if (!res.ok) {
    throw new Error(await res.json());
  }
  return res.json() as Promise<CreateLinkResponse>;
}