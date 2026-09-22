import { z } from "zod";
const ITERATIONS = 600_000;
export const encryptedSchema = z
  .object({
    format: z.literal("orion-encrypted"),
    version: z.literal(1),
    algorithm: z.literal("AES-GCM"),
    kdf: z.literal("PBKDF2-SHA256"),
    iterations: z.literal(ITERATIONS),
    salt: z.string().length(24),
    iv: z.string().length(16),
    ciphertext: z.string().min(24).max(48_000_000),
  })
  .strict();
export type Encrypted = z.infer<typeof encryptedSchema>;
export type VaultKey = { key: CryptoKey; salt: string };
const encode = (bytes: Uint8Array) => {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
};
const decode = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
export async function deriveKey(
  password: string,
  salt = encode(crypto.getRandomValues(new Uint8Array(16))),
): Promise<VaultKey> {
  if (password.length < 12 || password.length > 256)
    throw new Error("Utilisez une phrase secrète de 12 à 256 caractères.");
  const bytes = decode(salt);
  if (bytes.length !== 16) throw new Error("Sel de chiffrement invalide.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bytes, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { key, salt };
}
export async function encrypt(
  value: unknown,
  vault: VaultKey,
): Promise<Encrypted> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("orion-encrypted:1"),
    },
    vault.key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return {
    format: "orion-encrypted",
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: vault.salt,
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
  };
}
export async function decrypt(
  input: unknown,
  password: string,
): Promise<{ value: unknown; vault: VaultKey }> {
  const envelope = encryptedSchema.safeParse(input);
  if (!envelope.success)
    throw new Error("Fichier chiffré invalide ou version inconnue.");
  try {
    const vault = await deriveKey(password, envelope.data.salt);
    const data = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(envelope.data.iv),
        additionalData: new TextEncoder().encode("orion-encrypted:1"),
      },
      vault.key,
      decode(envelope.data.ciphertext),
    );
    return { value: JSON.parse(new TextDecoder().decode(data)), vault };
  } catch {
    throw new Error("Phrase secrète incorrecte ou fichier endommagé.");
  }
}
