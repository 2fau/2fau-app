export function PageHeader() {
  return (
    <div
            data-pencil-name="Page Header"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[92px_40px_76px_40px] justify-center items-start bg-[#0B0B0D]"
          >
            <div
              data-pencil-name="Header Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Eyebrow"
                className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
              >
                SECURITY
              </div>
              <div
                data-pencil-name="Title Wrap"
                className="box-border w-[760px] h-fit shrink-0 flex flex-row gap-0 p-[20px_0px_0px_0px] justify-start items-start"
              >
                <div
                  data-pencil-name="Title"
                  className="text-[52px]/[56px] box-border [flex:1_1_0] text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.8px] text-left"
                >
                  What protects your secrets, and what doesn't.
                </div>
              </div>
              <div
                data-pencil-name="Subhead Wrap"
                className="box-border w-[680px] h-fit shrink-0 flex flex-row gap-0 p-[24px_0px_0px_0px] justify-start items-start"
              >
                <div
                  data-pencil-name="Subhead"
                  className="text-[17px]/[28px] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  2FAu is a local-first authenticator: there is no account, no server and no sync target
                  you don't run yourself. This page describes the vault format, the key handling, and
                  the attacks it deliberately does not defend against.
                </div>
              </div>
              <div
                data-pencil-name="Meta Wrap"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] p-[34px_0px_0px_0px] justify-start items-center"
              >
                <div
                  data-pencil-name="Meta VAULT VERSION"
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-[8px] p-[7px_12px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[6px]"
                >
                  <div
                    data-pencil-name="Meta Key"
                    className="text-[10.5px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.6px] text-left [white-space:nowrap]"
                  >
                    VAULT VERSION
                  </div>
                  <div
                    data-pencil-name="Meta Value"
                    className="text-[11.5px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    1
                  </div>
                </div>
                <div
                  data-pencil-name="Meta KDF ID"
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-[8px] p-[7px_12px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[6px]"
                >
                  <div
                    data-pencil-name="Meta Key"
                    className="text-[10.5px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.6px] text-left [white-space:nowrap]"
                  >
                    KDF ID
                  </div>
                  <div
                    data-pencil-name="Meta Value"
                    className="text-[11.5px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    1
                  </div>
                </div>
                <div
                  data-pencil-name="Meta LICENCE"
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-[8px] p-[7px_12px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[6px]"
                >
                  <div
                    data-pencil-name="Meta Key"
                    className="text-[10.5px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.6px] text-left [white-space:nowrap]"
                  >
                    LICENCE
                  </div>
                  <div
                    data-pencil-name="Meta Value"
                    className="text-[11.5px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    MIT
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
