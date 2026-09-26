import { useEffect } from "react";
import type { Workspace } from "../../shared/journal";
import { generateSigningKey } from "../../shared/signature";

/**
 * Every session gets its own key pair to sign its exports, generated once
 * and kept in the session (encrypted with it when it is protected). It is
 * never synchronised: each post signs with its own key.
 */
export function useSigningKey(
  workspace: Workspace | null,
  setWorkspace: (
    update: (previous: Workspace | null) => Workspace | null,
  ) => void,
) {
  const missing = !!workspace && !workspace.signing;
  useEffect(() => {
    if (!missing) return;
    let alive = true;
    generateSigningKey()
      .then((signing) => {
        if (alive)
          setWorkspace((previous) =>
            previous && !previous.signing ? { ...previous, signing } : previous,
          );
      })
      .catch(() => {
        // No Web Crypto signature here: exports stay unsigned.
      });
    return () => {
      alive = false;
    };
  }, [missing, setWorkspace]);
}
