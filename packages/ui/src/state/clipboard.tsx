import { createContext, useContext, useMemo, type ReactNode } from "react";

/** How the UI reads/writes the clipboard. The desktop injects the Tauri plugin
 * (the webview's `navigator.clipboard` is unreliable and ACL-gated); everything
 * else falls back to `navigator.clipboard`. */
export interface ClipboardApi {
  readText: () => Promise<string>;
  writeText: (text: string) => Promise<void>;
}

const defaultApi: ClipboardApi = {
  readText: () => navigator.clipboard.readText(),
  writeText: (text) => navigator.clipboard.writeText(text),
};

const ClipboardContext = createContext<ClipboardApi>(defaultApi);

export function ClipboardProvider({
  readText,
  writeText,
  children,
}: {
  readText?: () => Promise<string>;
  writeText?: (text: string) => Promise<void>;
  children: ReactNode;
}) {
  const value = useMemo<ClipboardApi>(
    () => ({
      readText: readText ?? defaultApi.readText,
      writeText: writeText ?? defaultApi.writeText,
    }),
    [readText, writeText],
  );
  return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>;
}

export function useClipboard(): ClipboardApi {
  return useContext(ClipboardContext);
}
