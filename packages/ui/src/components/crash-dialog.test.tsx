import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CrashReport } from "@/core/settings";
import { CrashDialog } from "./crash-dialog";

const report: CrashReport = {
  id: "crash-0000000000001-0000",
  message: "index out of bounds",
  text: "**Panic:** index out of bounds\n```\n  0: twofau::time_sync::sample\n  1: std::rt::lang_start\n```",
  issueUrl: "https://github.com/2fau/2fau-app/issues/new?title=x&body=truncated",
};

describe("CrashDialog", () => {
  it("shows the panic message and the full report", () => {
    render(<CrashDialog report={report} onReport={() => {}} onDismiss={() => {}} />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("index out of bounds")).toBeInTheDocument();
    expect(screen.getByText(/twofau::time_sync::sample/)).toBeInTheDocument();
  });

  it("copies the full, untruncated report text", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<CrashDialog report={report} onReport={() => {}} onDismiss={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(report.text);
    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
  });

  it("fires onReport and onDismiss from their buttons", async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();
    const onDismiss = vi.fn();
    render(<CrashDialog report={report} onReport={onReport} onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: "Report on GitHub" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
