import type { Meta, StoryObj } from "@storybook/react";
import { CrashDialog } from "@/components/crash-dialog";

const frames = Array.from(
  { length: 60 },
  (_, i) => `  ${i}: twofau_app_lib::time_sync::frame_${i}\n             at ./src/time_sync.rs:${100 + i}:9`,
).join("\n");

const meta: Meta<typeof CrashDialog> = {
  title: "App/CrashDialog",
  component: CrashDialog,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="relative h-[458px] w-[320px] overflow-hidden bg-background">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CrashDialog>;

export const LongBacktrace: Story = {
  args: {
    report: {
      id: "crash-0000000000001-0000",
      message: "called `Option::unwrap()` on a `None` value",
      text: `- Version: 0.1.1\n- OS: macos (aarch64)\n- Thread: time-sync\n\n**Panic:** called \`Option::unwrap()\` on a \`None\` value\n\n\`\`\`\n${frames}\n\`\`\``,
      issueUrl: "https://github.com/2fau/2fau-app/issues/new",
    },
    onReport: () => {},
    onDismiss: () => {},
  },
};
