let csrf = "";
export const setCsrf = (value: string) => {
  csrf = value;
};
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 || response.status === 410)
      window.dispatchEvent(new Event("orion:expired"));
    throw new Error(data.error ?? "La requête a échoué.");
  }
  return data;
}
export async function downloadExport(
  operationId: string,
  purpose: string,
  recipient: string,
) {
  const data = await api<unknown>(`/operations/${operationId}/export`, "POST", {
    purpose,
    recipient,
  });
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `orion-${operationId}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
