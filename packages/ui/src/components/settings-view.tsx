import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsView(props: { onDone: () => void; children: ReactNode; }) {
    const { onDone, children } = props

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-1 border-b p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Back"
                    onClick={() => onDone()}
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="text-[13px] font-medium">Settings</span>
            </div>
            <div className="p-3">{children}</div>
        </div>
    )
}
