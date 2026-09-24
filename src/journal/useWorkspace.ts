import { useCallback, useEffect, useRef, useState } from "react";
import {
  decrypt,
  deriveKey,
  encrypt,
  type Encrypted,
  type VaultKey,
} from "../../shared/crypto";
import { workspaceSchema, type Workspace } from "../../shared/journal";
import { stampWorkspace } from "../../shared/sync";
import { deleteVault, readVault, writeVault } from "./storage";
async function acquireWriter(): Promise<() => void> {
  if (!navigator.locks)
    throw new Error(
      "Ce navigateur ne permet pas de sécuriser les écritures entre onglets. Utilisez le mode temporaire.",
    );
  return new Promise((resolve, reject) => {
    navigator.locks
      .request("orion-journal-writer", { ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(
            new Error(
              "L’espace local est déjà ouvert dans un autre onglet. Verrouillez cet onglet avant de reprendre ici.",
            ),
          );
          return;
        }
        await new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
type Update =
  | Workspace
  | null
  | ((previous: Workspace | null) => Workspace | null);
export function useWorkspace() {
  const [workspace, setRaw] = useState<Workspace | null>(null);
  // Journals changed on this post since the last synchronisation message.
  const dirty = useRef(new Set<string>());
  const [localTick, setLocalTick] = useState(0);
  /** Local change: stamped for the synchronisation. */
  const setWorkspace = useCallback((update: Update) => {
    setRaw((previous) => {
      const next = typeof update === "function" ? update(previous) : update;
      if (!next || !previous || next === previous) return next;
      const stamped = stampWorkspace(previous, next);
      const before = new Map(previous.journals.map((j) => [j.id, j]));
      for (const j of stamped.journals)
        if (before.get(j.id) !== j) dirty.current.add(j.id);
      if (stamped.gone !== previous.gone) dirty.current.add("*");
      return stamped;
    });
    setLocalTick((t) => t + 1);
  }, []);
  /** Change received from another post: applied as is. */
  const applyRemote = useCallback(
    (update: (previous: Workspace) => Workspace) =>
      setRaw((previous) => (previous ? update(previous) : previous)),
    [],
  );
  const takeDirty = useCallback(() => {
    const ids = [...dirty.current];
    dirty.current.clear();
    return ids;
  }, []);
  const [vaultKey, setVaultKey] = useState<VaultKey | null>(null);
  const [stored, setStored] = useState<Encrypted | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<
    "temporary" | "saving" | "saved" | "error"
  >("temporary");
  const [error, setError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writer = useRef<(() => void) | null>(null);
  const queue = useRef(Promise.resolve());
  const latest = useRef(workspace);
  latest.current = workspace;
  const saved = useRef<Workspace | null>(null);
  useEffect(() => {
    readVault()
      .then((value) => setStored(value ?? null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => writer.current?.();
  }, []);
  useEffect(() => {
    if (!workspace || !vaultKey) return;
    let live = true;
    setSaveState("saving");
    const timer = setTimeout(() => {
      saveTimer.current = null;
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          const ciphertext = await encrypt(workspace, vaultKey);
          await writeVault(ciphertext);
          saved.current = workspace;
          setStored(ciphertext);
          if (live) {
            setSaveState("saved");
            setError("");
          }
        })
        .catch((err) => {
          if (live) {
            setSaveState("error");
            setError(err.message);
          }
        });
    }, 250);
    saveTimer.current = timer;
    return () => {
      live = false;
      clearTimeout(timer);
      if (saveTimer.current === timer) saveTimer.current = null;
    };
  }, [workspace, vaultKey]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (latest.current && (!vaultKey || saved.current !== latest.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [vaultKey]);
  const start = useCallback((value: Workspace) => {
    setRaw(workspaceSchema.parse(value));
    setSaveState("temporary");
    setError("");
  }, []);
  async function startProtected(value: Workspace, password: string) {
    const parsed = workspaceSchema.parse(value);
    const release = await acquireWriter();
    try {
      if (await readVault())
        throw new Error(
          "Une session de reprise existe déjà. Reprenez-la ou exportez-la avant de créer une autre session protégée.",
        );
      const key = await deriveKey(password);
      const ciphertext = await encrypt(parsed, key);
      await writeVault(ciphertext);
      writer.current = release;
      saved.current = parsed;
      setStored(ciphertext);
      setVaultKey(key);
      setRaw(parsed);
      setSaveState("saved");
      setError("");
      void navigator.storage?.persist?.().catch(() => {});
    } catch (err) {
      release();
      throw err;
    }
  }
  async function protect(password: string) {
    const release = await acquireWriter();
    try {
      if (await readVault())
        throw new Error(
          "Un espace chiffré existe déjà sur ce poste. Exportez cette session puis déverrouillez l’espace existant pour y importer le journal.",
        );
      const key = await deriveKey(password);
      const value = latest.current;
      if (!value) throw new Error("Aucun espace à sauvegarder.");
      const ciphertext = await encrypt(value, key);
      await writeVault(ciphertext);
      writer.current = release;
      saved.current = value;
      setStored(ciphertext);
      setVaultKey(key);
      setSaveState("saved");
      void navigator.storage?.persist?.().catch(() => {});
    } catch (err) {
      release();
      throw err;
    }
  }
  async function unlock(password: string) {
    const release = await acquireWriter();
    try {
      const data = await readVault();
      if (!data) throw new Error("Aucun espace local enregistré.");
      const { value, vault } = await decrypt(data, password);
      const parsed = workspaceSchema.parse(value);
      writer.current = release;
      saved.current = parsed;
      setVaultKey(vault);
      setRaw(parsed);
      setSaveState("saved");
      setError("");
    } catch (err) {
      release();
      throw err;
    }
  }
  async function close() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await queue.current;
    if (vaultKey && latest.current && latest.current !== saved.current) {
      const snapshot = latest.current;
      const ciphertext = await encrypt(snapshot, vaultKey);
      await writeVault(ciphertext);
      saved.current = snapshot;
      setStored(ciphertext);
    }
    setRaw(null);
    latest.current = null;
    saved.current = null;
    setVaultKey(null);
    writer.current?.();
    writer.current = null;
    setSaveState("temporary");
  }
  async function finish() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await queue.current;
    if (vaultKey) await deleteVault();
    setRaw(null);
    latest.current = null;
    saved.current = null;
    setVaultKey(null);
    if (vaultKey) setStored(null);
    writer.current?.();
    writer.current = null;
    setSaveState("temporary");
  }
  async function forget() {
    if (workspace) throw new Error("Verrouillez l’espace avant de l’effacer.");
    const release = await acquireWriter();
    try {
      await deleteVault();
      setStored(null);
    } finally {
      release();
    }
  }
  return {
    workspace,
    setWorkspace,
    applyRemote,
    takeDirty,
    localTick,
    stored,
    loading,
    error,
    saveState,
    persistent: !!vaultKey,
    start,
    startProtected,
    protect,
    unlock,
    close,
    finish,
    forget,
  };
}
