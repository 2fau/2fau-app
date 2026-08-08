import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { DEFAULT_SUMMON, type Chord } from "@/lib/hotkeys";

describe("HotkeyRecorder", () => {
  it("captures a valid summon chord on keydown", () => {
    const onChange = vi.fn();
    render(<HotkeyRecorder value={DEFAULT_SUMMON} onChange={onChange} captureKey />);
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "KeyJ", metaKey: true, shiftKey: true });
    expect(onChange).toHaveBeenCalledWith<[Chord]>({
      mod: true,
      shift: true,
      alt: false,
      key: "KeyJ",
    });
  });

  it("ignores a lone modifier in summon mode", () => {
    const onChange = vi.fn();
    render(<HotkeyRecorder value={DEFAULT_SUMMON} onChange={onChange} captureKey />);
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "MetaLeft", metaKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("captures modifiers-only on keyup in quick-copy mode", () => {
    const onChange = vi.fn();
    render(
      <HotkeyRecorder
        value={{ mod: true, shift: false, alt: false, key: "" }}
        onChange={onChange}
        captureKey={false}
      />,
    );
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "ShiftLeft", metaKey: true, shiftKey: true });
    fireEvent.keyUp(field, { code: "ShiftLeft" });
    expect(onChange).toHaveBeenCalledWith({ mod: true, shift: true, alt: false, key: "" });
  });

  it("shows an error message", () => {
    render(
      <HotkeyRecorder value={DEFAULT_SUMMON} onChange={() => {}} captureKey error="Taken by the OS" />,
    );
    expect(screen.getByText("Taken by the OS")).toBeInTheDocument();
  });
});
