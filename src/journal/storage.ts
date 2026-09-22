import type { Encrypted } from "../../shared/crypto";
const DATABASE = "orion-journal-v1";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("vault");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Le navigateur refuse le stockage local. Exportez une copie avant de quitter.",
        ),
      );
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vault", mode);
    const request = action(tx.objectStore("vault"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "Sauvegarde locale impossible. Exportez une copie avant de quitter.",
        ),
      );
    };
  });
}
export const readVault = () =>
  transaction<Encrypted | undefined>("readonly", (store) =>
    store.get("workspace"),
  );
export const writeVault = (value: Encrypted) =>
  transaction("readwrite", (store) => store.put(value, "workspace"));
export const deleteVault = () =>
  transaction("readwrite", (store) => store.delete("workspace"));
