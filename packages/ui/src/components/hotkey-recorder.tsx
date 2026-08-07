import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  chordFromEvent,
  formatChord,
  isValidQuickCopyMods,
  isValidSummon,
  type Chord,
} from "@/lib/hotkeys";

/** A "Press keys…" capture field. `captureKey` true records a full chord
 * (summon, needs a main key); false records modifiers only (quick-copy),
 * committing on key release so multi-modifier combos are captured. */
export function HotkeyRecorder({
  value,
  onChange,
  captureKey,
  error,
}: {
  value: Chord;
  onChange: (c: Chord) => void;
  captureKey: boolean;
  error?: string | null;
}) {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<Chord | null>(null);

  function commit(c: Chord, el: HTMLElement) {
    onChange(c);
    setDraft(null);
    setRecording(false);
    el.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const c = chordFromEvent(e.nativeEvent);
    setDraft(c);
    if (captureKey && isValidSummon(c)) commit(c, e.currentTarget);
  }

  function onKeyUp(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!captureKey && draft && isValidQuickCopyMods(draft)) commit(draft, e.currentTarget);
  }

  const label = recording ? (draft ? formatChord(draft) : "Press keys…") : formatChord(value);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onFocus={() => setRecording(true)}
        onBlur={() => {
          setRecording(false);
          setDraft(null);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={cn(
          "rounded-md border px-3 py-1.5 text-center font-mono text-[13px]",
          recording && "ring-2 ring-primary",
        )}
      >
        {label}
      </button>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
