export function hostedPreviewConfig(env = process.env, now = Date.now()) {
  if (
    env.APP_MODE !== "hosted-preview" ||
    env.DEMO_DATA_ACK !== "synthetic-only"
  )
    throw new Error(
      "Le service hébergé doit être explicitement réservé aux données fictives.",
    );
  if (env.DATABASE_URL)
    throw new Error(
      "Base institutionnelle interdite dans la démonstration Cloudflare.",
    );
  const origin = env.APP_ORIGIN;
  if (!origin?.startsWith("https://") || new URL(origin).origin !== origin)
    throw new Error("Origine HTTPS exacte obligatoire.");
  for (const value of [env.APP_KEY, env.PREVIEW_CONTROL_KEY])
    if (!/^[a-f\d]{64}$/i.test(value ?? ""))
      throw new Error("Clés dédiées de 256 bits obligatoires.");
  if (env.APP_KEY.toLowerCase() === env.PREVIEW_CONTROL_KEY.toLowerCase())
    throw new Error("Les deux clés doivent être distinctes.");
  const expiry = Date.parse(env.PREVIEW_EXPIRES_AT ?? "");
  if (!Number.isFinite(expiry) || expiry > now + 30 * 86400000)
    throw new Error("Expiration fixe requise, au maximum dans 30 jours.");
  return {
    preview: true,
    hostedPreview: true,
    mapOnline: true,
    demo: false,
    production: false,
    realOperationsEnabled: false,
    origin,
    key: env.APP_KEY,
    previewControlKey: env.PREVIEW_CONTROL_KEY,
    previewExpiresAt: env.PREVIEW_EXPIRES_AT,
  };
}
