export function Permissions() {
  return (
    <div
            data-pencil-name="Permissions Section"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[96px_40px] justify-center items-start bg-[#111113]"
          >
            <div
              data-pencil-name="Permissions Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Permissions Header"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[60px] justify-between items-end"
              >
                <div
                  data-pencil-name="Permissions Heading"
                  className="box-border w-[640px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Eyebrow"
                    className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
                  >
                    PERMISSIONS
                  </div>
                  <div
                    data-pencil-name="Title"
                    className="text-[36px]/[41px] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.1px] text-left"
                  >
                    Seven permissions. No host access.
                  </div>
                </div>
                <div
                  data-pencil-name="Permissions Note"
                  className="text-[14.5px]/[24px] box-border w-[430px] shrink-0 text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  The install prompt is short on purpose. There is no "read your data on all websites"
                  line, because the extension never asks for one.
                </div>
              </div>
              <div
                data-pencil-name="Gap"
                className="box-border w-full h-[44px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Permissions Grid"
                className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start"
              >
                <div
                  data-pencil-name="Perm storage"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      storage
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Holds the sealed vault chunks and your settings.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm contextMenus"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      contextMenus
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Builds the right-click menu of recent accounts.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm activeTab"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      activeTab
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      A one-shot grant on the tab you act on — never standing access.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm scripting"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      scripting
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Inserts the code into the focused field when you press the shortcut.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm alarms"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      alarms
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Runs the auto-lock timer that clears the session key.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm offscreen"
                  className="[box-sizing:content-box] w-[1200px] h-[44.5px] shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      offscreen
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Chrome only: a hidden document used purely to write the clipboard.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Perm notifications"
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[24px] p-[14px_0px] justify-start items-center"
                >
                  <div
                    data-pencil-name="Perm Name Cell"
                    className="box-border w-[220px] shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Tick"
                      data-icon-name="check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[14px] shrink-0 h-[14px]"
                    >
                      <path
                        d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Perm Name"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      notifications
                    </div>
                  </div>
                  <div
                    data-pencil-name="Perm Desc Cell"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Perm Desc"
                      className="text-[14px]/[normal] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Reports a failed copy or fill instead of doing nothing.
                    </div>
                  </div>
                </div>
              </div>
              <div
                data-pencil-name="Gap 2"
                className="box-border w-full h-[28px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Optional Perm"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[12px] p-[18px_20px] justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[10px]"
              >
                <svg
                  data-pencil-name="Icon"
                  data-icon-name="toggle-left"
                  data-icon-set="lucide"
                  viewBox="0 0 13.99993896484375 14"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[17px] shrink-0 h-[17px]"
                >
                  <path
                    d="M4.9834 2.33789q-1.35693 0.08545-2.46436 0.88525-1.104 0.79639-1.60986 2.0542-0.32129 0.81348-0.32129 1.72266 0 0.28027 0.01367 0.46143 0.01367 0.18115 0.07178 0.46142 0.12305 0.60156 0.41016 1.17578 0.28711 0.57422 0.70752 1.03907 1.17578 1.27148 2.92578 1.49707 0.18457 0.02734 2.2832 0.02734l0.04102 0q1.64063 0 1.96875-0.00684 0.32813-0.00683 0.64941-0.07861 1.04932-0.2085 1.89697-0.85107 0.84766-0.646 1.33643-1.58252 0.2666-0.5332 0.39307-1.04248 0.12646-0.5127 0.12646-1.10059 0-0.51953-0.09912-0.95361-0.18115-0.89551-0.68701-1.64405-0.50244-0.74854-1.25098-1.25781-0.74854-0.5127-1.63037-0.70752l-0.01367 0q-0.33838-0.07178-0.65283-0.08545-0.31445-0.01367-1.83887-0.01367l-0.05811 0q-1.9585-0.01367-2.19775 0z m4.08789 1.17578q1.22021 0.12646 2.11572 0.98096 0.71436 0.68701 0.95703 1.66797 0.24609 0.97754-0.07519 1.92773-0.2666 0.82715-0.90918 1.44238-0.42041 0.40674-0.94678 0.646-0.52637 0.23584-1.10059 0.30762-0.16748 0.01367-2.1123 0.01367-1.94482 0-2.1123-0.01367-0.99463-0.11279-1.78077-0.71436-0.28027-0.22559-0.54345-0.54687-0.65967-0.78271-0.78614-1.81153-0.12646-1.02881 0.32129-1.93798 0.35205-0.70068 0.96729-1.20655 0.36572-0.30762 0.85449-0.50244 0.48877-0.19824 0.98096-0.25293 0.16748-0.01367 2.08496-0.01367 1.91748 0 2.08496 0.01367z m-4.18359 1.18946q-0.89893 0.15381-1.44239 0.82714-0.18457 0.22217-0.29052 0.44776-0.10254 0.22559-0.18799 0.51953-0.02734 0.10938-0.03418 0.19482-0.00684 0.08203-0.00684 0.30762 0 0.28027 0.02735 0.43408 0.02734 0.15381 0.11279 0.3794 0.16748 0.4751 0.52978 0.84082 0.36572 0.3623 0.84082 0.52978 0.22559 0.08545 0.3794 0.1128 0.15381 0.02734 0.43408 0.02734 0.28027 0 0.43408-0.02734 0.15381-0.02734 0.3794-0.1128 0.4751-0.16748 0.8374-0.52978 0.36572-0.36572 0.5332-0.84082 0.08545-0.22559 0.1128-0.3794 0.02734-0.15381 0.02734-0.43408 0-0.28027-0.02734-0.43408-0.02734-0.15381-0.1128-0.3794-0.2085-0.55713-0.6665-0.95019-0.45459-0.39307-1.04248-0.51953-0.14014-0.02734-0.42725-0.03418-0.28711-0.00684-0.41015 0.02051z m0.65625 1.1621q0.28027 0.07178 0.52294 0.31788 0.24609 0.24268 0.31788 0.52294 0.02734 0.12646 0.02734 0.29395 0 0.16748-0.02734 0.28027-0.07178 0.29395-0.3042 0.53321-0.229 0.23584-0.53662 0.32129-0.11279 0.02734-0.29395 0.02734-0.18115 0-0.29395-0.02734-0.30762-0.08545-0.54003-0.32129-0.229-0.23926-0.30079-0.53321-0.02734-0.11279-0.02734-0.28027 0-0.16748 0.02734-0.29395 0.05811-0.22559 0.22559-0.43408 0.16748-0.2085 0.40674-0.32129 0.34863-0.18115 0.79639-0.08545z"
                    fill="#7C6CFF"
                  ></path>
                </svg>
                <div
                  data-pencil-name="Optional Text"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[6px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Optional Title"
                    className="text-[14.5px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                  >
                    One optional permission: http://127.0.0.1/*
                  </div>
                  <div
                    data-pencil-name="Optional Body"
                    className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                  >
                    Requested only if you switch on the desktop bridge, and scoped to loopback so it
                    cannot reach the network. Leave it off and the extension is entirely self-contained.
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
