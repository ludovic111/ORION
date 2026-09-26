import type { Encrypted, VaultRecord } from "../../shared/crypto";
// The name stays: sessions saved by earlier versions open from the same
// database. The vault holds one record, "workspace": a VaultRecord (2.1,
// compressed, raw bytes) or an Encrypted envelope written before 2.1.
const DATABASE = "orion-journal-v1";
export type StoredVault = Encrypted | VaultRecord;
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
      const quota = (tx.error ?? request.error)?.name === "QuotaExceededError";
      reject(
        new Error(
          quota
            ? "Espace de stockage du navigateur plein : la sauvegarde locale a échoué. Exportez une copie, puis libérez de l’espace (anciens journaux, images)."
            : "Sauvegarde locale impossible. Exportez une copie avant de quitter.",
        ),
      );
    };
  });
}
export const readVault = () =>
  transaction<StoredVault | undefined>("readonly", (store) =>
    store.get("workspace"),
  );
export const writeVault = (value: StoredVault) =>
  transaction("readwrite", (store) => store.put(value, "workspace"));
export const deleteVault = () =>
  transaction("readwrite", (store) => store.delete("workspace"));
