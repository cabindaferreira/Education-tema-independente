import { randomUUID } from "node:crypto";
import { Storage, type File } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export function createObjectPath(): string {
  const privateDir = process.env.PRIVATE_OBJECT_DIR?.trim();
  if (!privateDir) throw new Error("Object Storage is not configured.");
  return `/objects/uploads/${randomUUID()}`;
}

function privateObjectLocation(objectPath: string): { bucketName: string; objectName: string } {
  if (!/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(objectPath)) {
    throw new Error("Invalid Academy media object path.");
  }
  const privateDir = process.env.PRIVATE_OBJECT_DIR?.trim();
  if (!privateDir) throw new Error("Object Storage is not configured.");
  const [bucketName, ...directoryParts] = privateDir.replace(/^\/+/, "").split("/");
  if (!bucketName || directoryParts.length === 0) throw new Error("Object Storage path is invalid.");
  return {
    bucketName,
    objectName: `${directoryParts.join("/")}/uploads/${objectPath.split("/").at(-1)}`,
  };
}

export async function getAcademyObjectFile(objectPath: string): Promise<File | null> {
  const location = privateObjectLocation(objectPath);
  const file = objectStorageClient.bucket(location.bucketName).file(location.objectName);
  const [exists] = await file.exists();
  return exists ? file : null;
}

export async function createUploadUrl(objectPath: string): Promise<string> {
  const { bucketName, objectName } = privateObjectLocation(objectPath);
  const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Could not create the upload URL (${response.status}).`);
  const result = await response.json() as { signed_url?: unknown };
  if (typeof result.signed_url !== "string") throw new Error("Object Storage returned an invalid upload URL.");
  return result.signed_url;
}

export async function setAcademyObjectVisibility(
  file: File,
  visibility: "public" | "private",
  owner: string,
): Promise<void> {
  await file.setMetadata({
    metadata: { academyAcl: JSON.stringify({ visibility, owner }) },
  });
}

export async function isAcademyObjectPublic(file: File): Promise<boolean> {
  const [metadata] = await file.getMetadata();
  const policy = metadata.metadata?.academyAcl;
  if (typeof policy !== "string") return false;
  try {
    const parsed = JSON.parse(policy) as { visibility?: unknown };
    return parsed.visibility === "public";
  } catch {
    return false;
  }
}
