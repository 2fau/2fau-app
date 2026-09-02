export function Window() {
  return (
    <div
            data-pencil-name="Window Section"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[96px_40px] justify-center items-start bg-[#111113]"
          >
            <div
              data-pencil-name="Window Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Window Header"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[60px] justify-between items-end"
              >
                <div
                  data-pencil-name="Window Heading"
                  className="box-border w-[640px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Eyebrow"
                    className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
                  >
                    THE WINDOW
                  </div>
                  <div
                    data-pencil-name="Title Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-row gap-0 justify-start items-start"
                  >
                    <div
                      data-pencil-name="Title"
                      className="text-[36px]/[41px] box-border [flex:1_1_0] text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.1px] text-left"
                    >
                      A panel, not an application.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Body Wrap"
                  className="box-border w-[430px] shrink-0 h-fit flex flex-row gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Body"
                    className="text-[14.5px]/[24px] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                  >
                    The window starts hidden and is anchored to the tray icon each time it opens — below
                    the menu bar on macOS, above the taskbar on Windows and Linux, and clamped so it
                    never lands off-screen on a second monitor.
                  </div>
                </div>
              </div>
              <div
                data-pencil-name="Gap A"
                className="box-border w-full h-[48px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="App Screens"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[42px] justify-start items-start"
              >
                <div
                  data-pencil-name="Screen Locked by default"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Shot"
                    className="box-border w-full h-[514px] shrink-0 bg-[url('/app-lock.png')] bg-no-repeat bg-cover bg-center"
                  ></div>
                  <div
                    data-pencil-name="Caption Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[7px] p-[18px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Caption Title"
                      className="text-[15.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left"
                    >
                      Locked by default
                    </div>
                    <div
                      data-pencil-name="Caption Body"
                      className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Every launch starts here — unless you let the OS keyring remember the passphrase,
                      in which case it opens straight to the list.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Screen Search, or just press ⌘1"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Shot"
                    className="box-border w-full h-[514px] shrink-0 bg-[url('/app-list.png')] bg-no-repeat bg-cover bg-center"
                  ></div>
                  <div
                    data-pencil-name="Caption Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[7px] p-[18px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Caption Title"
                      className="text-[15.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left"
                    >
                      Search, or just press ⌘1
                    </div>
                    <div
                      data-pencil-name="Caption Body"
                      className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Codes rotate in place with the ring underneath. The top accounts get ⌘1 to ⌘5, so
                      copying one never needs the mouse.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Screen Everything in one panel"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Shot"
                    className="box-border w-full h-[514px] shrink-0 bg-[url('/app-settings.png')] bg-no-repeat bg-cover bg-center"
                  ></div>
                  <div
                    data-pencil-name="Caption Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[7px] p-[18px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Caption Title"
                      className="text-[15.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left"
                    >
                      Everything in one panel
                    </div>
                    <div
                      data-pencil-name="Caption Body"
                      className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Export and import the vault, change the password, set auto-lock and the summon
                      hotkey, open at login, turn on sync.
                    </div>
                  </div>
                </div>
              </div>
              <div
                data-pencil-name="Gap B"
                className="box-border w-full h-[56px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Window Traits"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[24px] justify-start items-start"
              >
                <div
                  data-pencil-name="Trait Hides the moment it loses focus"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[12px] justify-start items-start"
                >
                  <svg
                    data-pencil-name="Icon"
                    data-icon-name="eye-off"
                    data-icon-set="lucide"
                    viewBox="0 0 13.99993896484375 14"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] h-[16px] shrink-0"
                  >
                    <path
                      d="M1.07666 0.60156q-0.29395 0.02734-0.42725 0.30078-0.12988 0.27344 0.01026 0.54004 0.02734 0.06836 1.12451 1.16895 1.10059 1.09717 1.07324 1.11426l-0.19824 0.16748q-0.24951 0.19482-0.58789 0.54687-0.33496 0.34863-0.56738 0.65625-0.229 0.30762-0.46827 0.71436-0.23926 0.40674-0.3623 0.7417-0.15381 0.39307-0.05811 0.7417 0.09912 0.30762 0.35547 0.77929 0.25977 0.46826 0.54004 0.84424 0.22559 0.29395 0.56739 0.65283 0.34521 0.35547 0.63916 0.58106 1.104 0.89551 2.46093 1.2749 1.36035 0.37598 2.74463 0.18115 0.98096-0.14014 1.87647-0.54687l0.29394-0.12647 1.20313 1.18946q1.19287 1.18945 1.26123 1.23388 0.18115 0.08203 0.37939 0.05469 0.29395-0.05469 0.41699-0.32129 0.12646-0.2666 0.00342-0.5332-0.04443-0.05469-5.88232-5.90625-5.83789-5.85498-5.96436-5.93701-0.18115-0.15381-0.43408-0.1128z m5.62939 1.75q-0.43408 0.01367-0.59472 0.05811-0.16064 0.04102-0.25977 0.15381-0.2085 0.2085-0.16064 0.50244 0.04785 0.29395 0.34179 0.43408 0.08545 0.02734 0.18799 0.03418 0.10596 0.00684 0.43067-0.02051 0.7417-0.05469 1.52441 0.11279 1.30225 0.2666 2.36524 1.11426 1.06641 0.84424 1.62353 2.06446l0.08545 0.19482-0.06836 0.15381q-0.23926 0.51953-0.60498 1.03564-0.12305 0.18115-0.16748 0.28028-0.04102 0.09912-0.02734 0.22558 0.02734 0.33496 0.33496 0.48877 0.08545 0.04102 0.23925 0.04102 0.19482 0 0.32129-0.08887 0.12647-0.09229 0.33496-0.38623 0.2666-0.39307 0.49561-0.84082 0.23242-0.44775 0.28027-0.67676 0.05127-0.23242 0.01026-0.43408-0.04102-0.20508-0.22559-0.58105-0.33496-0.72803-0.875-1.37745-0.53662-0.65283-1.19629-1.14502-0.60156-0.44775-1.28857-0.75537-0.68359-0.30762-1.39795-0.46142-0.54687-0.11279-0.98096-0.12647l-0.34863-0.01367q-0.11279 0-0.3794 0.01367z m-2.35156 2.83008l0.62891 0.64258-0.06836 0.15381q-0.12646 0.23926-0.17774 0.45117-0.04785 0.2085-0.06152 0.50928-0.01367 0.30078 0.04102 0.56054 0.05811 0.25635 0.19824 0.52295 0.23584 0.51953 0.69043 0.84766 0.45801 0.32813 1.03223 0.44092 0.16748 0.02734 0.44433 0.01367 0.28027-0.01367 0.48877-0.06152 0.21191-0.05127 0.45117-0.17774l0.15381-0.06836 0.51953 0.50244q0.50244 0.51953 0.50244 0.52637 0 0.00684-0.16064 0.07178-0.16064 0.06152-0.32813 0.11621-0.72803 0.23926-1.55517 0.2666-1.37061 0.04102-2.61817-0.56055-1.24414-0.60156-2.08496-1.70898-0.29395-0.38965-0.54687-0.90918l-0.15381-0.32129 0.08545-0.19482q0.60156-1.28857 1.71924-2.14307 0.14014-0.11279 0.15381-0.11279 0.01709 0 0.64599 0.63232z m2.89844 2.9668q-0.07178 0.01367-0.2666 0.01367-0.19482 0-0.28028-0.02734-0.30762-0.08545-0.54003-0.32129-0.229-0.23926-0.30079-0.53321-0.01367-0.08545-0.0205-0.25293-0.00684-0.16748 0.00683-0.25293l0.01367-0.08203 1.20313 1.2168q0.15723 0.15381 0.18457 0.19141 0.02734 0.03418 0 0.04785z"
                      fill="#0A84FF"
                    ></path>
                  </svg>
                  <div
                    data-pencil-name="Trait Text"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[5px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Trait Title"
                      className="text-[15px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                    >
                      Hides the moment it loses focus
                    </div>
                    <div
                      data-pencil-name="Trait Body"
                      className="text-[14px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Click anywhere else and it is gone. Nothing to close, nothing left open behind
                      your work.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Trait No Dock icon, no taskbar entry"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[12px] justify-start items-start"
                >
                  <svg
                    data-pencil-name="Icon"
                    data-icon-name="minimize-2"
                    data-icon-set="lucide"
                    viewBox="0 0 13.99993896484375 14"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] h-[16px] shrink-0"
                  >
                    <path
                      d="M12.09619 1.18945q-0.08545 0.02734-0.18115 0.1128-0.14014 0.09912-0.47852 0.44775l-2.68652 2.67285 0-1.93115q-0.01367-0.25293-0.02734-0.32813-0.01367-0.07861-0.07178-0.14697l0-0.01367q-0.16748-0.23926-0.48877-0.23926-0.14014 0-0.23242 0.04444-0.08887 0.04102-0.16748 0.11279-0.0752 0.06836-0.1128 0.14697-0.03418 0.0752-0.04785 0.18457-0.01367 0.14014-0.02734 0.54688l0.01367 3.17871 0.04102 0.08545q0.03076 0.08203 0.12646 0.17431 0.09912 0.08887 0.18115 0.1333l0.08545 0.04102 1.80469 0q1.41504 0.01367 1.70899 0 0.29394-0.01367 0.39306-0.05469 0.08203-0.04443 0.15039-0.11963 0.07178-0.07861 0.11621-0.16064 0.0957-0.22559 0.01026-0.44776-0.08203-0.22559-0.32129-0.33837-0.05469-0.02734-0.2085-0.02735l-2.08496-0.01367 1.56885-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.23926 0-0.15381-0.0376-0.23584-0.03418-0.08545-0.12988-0.18457-0.15381-0.15381-0.3794-0.16748-0.14014 0-0.18115 0.01367z m-9.87109 6.41211q-0.19482 0.02734-0.32813 0.18115-0.1333 0.15381-0.14697 0.35206 0 0.14014 0.06152 0.28027 0.06494 0.14014 0.19141 0.22217l0 0.01367q0.08203 0.05811 0.15723 0.07178 0.07861 0.01367 0.33154 0.02734l1.93115 0-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 0 1.93115q0.01367 0.25293 0.02734 0.33154 0.01367 0.0752 0.07178 0.15723l0.01367 0q0.15381 0.22559 0.417 0.24609 0.2666 0.02051 0.46484-0.17431 0.12646-0.12646 0.15381-0.30762 0.02734-0.11279 0.01367-1.93457l0-1.80469-0.04102-0.08545q-0.04443-0.08203-0.13671-0.17773-0.08887-0.09912-0.1709-0.12988l-0.08545-0.04102-1.83545 0q-1.81836-0.01367-1.91748 0.01367z"
                      fill="#0A84FF"
                    ></path>
                  </svg>
                  <div
                    data-pencil-name="Trait Text"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[5px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Trait Title"
                      className="text-[15px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                    >
                      No Dock icon, no taskbar entry
                    </div>
                    <div
                      data-pencil-name="Trait Body"
                      className="text-[14px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      macOS runs it as an accessory app; Windows and Linux skip the taskbar. It exists
                      in the tray and nowhere else.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Trait Always on top, never resizable"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[12px] justify-start items-start"
                >
                  <svg
                    data-pencil-name="Icon"
                    data-icon-name="pin"
                    data-icon-set="lucide"
                    viewBox="0 0 13.99993896484375 14"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] h-[16px] shrink-0"
                  >
                    <path
                      d="M4.49463 0.60156q-0.30762 0.02734-0.60156 0.16748-0.32471 0.16748-0.56397 0.44776-0.23584 0.28027-0.34863 0.64599-0.02734 0.11279-0.04102 0.18457-0.01367 0.06836-0.01367 0.27686 0 0.25293 0.02051 0.37256 0.02051 0.11621 0.10596 0.31445 0.18115 0.43408 0.58789 0.73486 0.40674 0.30078 0.86816 0.32813l0.16748 0.01367 0 1.07666q0 1.09375-0.02051 1.19287-0.02051 0.0957-0.04785 0.18115-0.05811 0.11279-0.1914 0.20508-0.1333 0.08887-0.63575 0.3418-0.64258 0.33496-0.7417 0.40332-0.23926 0.18457-0.41357 0.44434-0.17432 0.25635-0.24609 0.56396-0.02734 0.11279-0.03418 0.20508-0.00684 0.08887-0.00684 0.41357 0 0.32129 0.00684 0.39991 0.00684 0.0752 0.03418 0.17089 0.08545 0.22559 0.24609 0.40674 0.16064 0.18115 0.35547 0.28028l0.01709 0.01367q0.12305 0.0581 0.22217 0.08545 0.12646 0.01367 0.46142 0.02734l2.74463 0 0 2.29688q0 0.18115 0.03418 0.2666 0.0376 0.08203 0.11963 0.16748 0.08545 0.08203 0.18799 0.1333 0.10596 0.04785 0.23242 0.04785 0.12646 0 0.229-0.04785 0.10596-0.05127 0.18799-0.1333 0.08545-0.08545 0.11963-0.16748 0.0376-0.08545 0.0376-0.2666l0-2.29688 2.74463 0q0.33496-0.01367 0.46142-0.02734 0.09912-0.02734 0.22217-0.08545l0.01709-0.01367q0.19482-0.09912 0.35547-0.28028 0.16065-0.18115 0.24609-0.40674 0.02734-0.0957 0.03418-0.1709 0.00684-0.07861 0.00684-0.3999 0-0.32471-0.00684-0.41357-0.00683-0.09229-0.03418-0.20508-0.07178-0.30762-0.24609-0.56396-0.17432-0.25977-0.41357-0.44434-0.09912-0.06836-0.7417-0.40332-0.50244-0.25293-0.63575-0.3418-0.1333-0.09229-0.1914-0.20508-0.02734-0.08545-0.04785-0.18115-0.02051-0.09912-0.02051-1.19287l0-1.07666 0.16748-0.01367q0.46143-0.02734 0.86816-0.32813 0.40674-0.30078 0.58789-0.73486 0.08545-0.21191 0.10596-0.32129 0.02051-0.11279 0.02051-0.36572-0.01367-0.2085-0.02051-0.27686-0.00684-0.07178-0.03418-0.18457-0.11279-0.36572-0.35205-0.64599-0.23584-0.28027-0.56055-0.44776-0.29395-0.14014-0.6289-0.16748-0.18115-0.02734-2.49854-0.02734-2.31738 0-2.48486 0.02734z m5.08252 1.20313q0.33496 0.15381 0.33496 0.5332 0 0.2666-0.18457 0.42725-0.18115 0.16064-0.4751 0.16064-0.08203 0-0.22217 0.0376-0.14014 0.03418-0.25293 0.08887-0.14014 0.08545-0.27343 0.21875-0.1333 0.12988-0.20166 0.28369l-0.01368 0.03076q-0.07178 0.12305-0.08544 0.2085-0.02734 0.11279-0.02735 0.39306l0 2.40625 0.05469 0.15381q0.19824 0.63232 0.68701 0.96729 0.11279 0.06836 0.72119 0.38623 0.6084 0.31445 0.67676 0.37939 0.07178 0.06152 0.12988 0.15723 0.02734 0.07178 0.03418 0.12646 0.00684 0.05469 0.02051 0.2666l0 0.29395-7 0 0-0.29395q0.01367-0.21191 0.02051-0.2666 0.00684-0.05469 0.03418-0.12646 0.05811-0.0957 0.12646-0.16407 0.07178-0.07178 0.68018-0.37939 0.6084-0.31104 0.72119-0.37939 0.48877-0.33496 0.68701-0.96729l0.05469-0.15381 0-2.40625q0-0.28027-0.02735-0.39306-0.01367-0.08545-0.08544-0.2085l-0.01368-0.03076q-0.06836-0.15381-0.20166-0.28369-0.1333-0.1333-0.27343-0.21875-0.11279-0.05469-0.25293-0.08887-0.14014-0.0376-0.22217-0.0376-0.43408 0-0.58789-0.32129-0.12646-0.25293-0.01709-0.50928 0.11279-0.25977 0.37939-0.33154 0.06836-0.01367 2.50537-0.01367l2.45069 0.01367 0.09912 0.04102z"
                      fill="#0A84FF"
                    ></path>
                  </svg>
                  <div
                    data-pencil-name="Trait Text"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[5px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Trait Title"
                      className="text-[15px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                    >
                      Always on top, never resizable
                    </div>
                    <div
                      data-pencil-name="Trait Body"
                      className="text-[14px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      It opens at one size in one place, so the code you want is always in the same
                      spot.
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Trait Resizes itself to the content"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[12px] justify-start items-start"
                >
                  <svg
                    data-pencil-name="Icon"
                    data-icon-name="move-vertical"
                    data-icon-set="lucide"
                    viewBox="0 0 13.99993896484375 14"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] h-[16px] shrink-0"
                  >
                    <path
                      d="M6.84619 0.60156q-0.08545 0.01367-0.15723 0.06494-0.06836 0.04785-1.28515 1.26465l-0.16748 0.16748q-0.62891 0.646-0.81348 0.82715-0.23584 0.25293-0.29394 0.34863-0.04102 0.07178-0.04102 0.19825l0 0.02734q0 0.23926 0.18115 0.42041 0.11279 0.11279 0.28028 0.14697 0.16748 0.03418 0.32129-0.0205 0.07178-0.02734 0.19824-0.14014 0.12646-0.11279 0.61523-0.60156 0.71436-0.71436 0.72803-0.71436 0.01367 0 0.01367 4.40918 0 4.40918-0.01367 4.40918-0.01367 0-0.72803-0.70068-0.50244-0.50244-0.62207-0.61524-0.11963-0.11279-0.1914-0.14014-0.0957-0.02734-0.22901-0.02734-0.1333 0-0.21875 0.04102-0.22217 0.11279-0.30078 0.33838-0.0752 0.22217 0.00684 0.43408 0.04443 0.06836 0.25293 0.28711 0.2085 0.21533 1.03564 1.04248 1.22021 1.23047 1.30225 1.27148 0.12646 0.07178 0.28027 0.07178 0.15381 0 0.28027-0.07178 0.08203-0.04102 1.30225-1.27148l0.18115-0.16748q0.62891-0.646 0.81348-0.82715 0.23584-0.25293 0.29394-0.34863 0.04102-0.07178 0.04102-0.19825l0-0.02734q0-0.12646-0.04102-0.23926-0.09912-0.2085-0.31787-0.29053-0.21533-0.08545-0.42383-0.01709-0.07178 0.02734-0.1914 0.14014-0.11963 0.11279-0.62207 0.61524-0.71436 0.70068-0.72803 0.70068-0.01367 0-0.01367-4.40918 0-4.40918 0.01367-4.40918 0.01367 0 0.72803 0.70068 0.48877 0.50244 0.61523 0.61524 0.12646 0.11279 0.19824 0.14014 0.15381 0.05469 0.32129 0.0205 0.16748-0.03418 0.28028-0.14697 0.18115-0.18115 0.18115-0.42041l0-0.02734q0-0.12646-0.04102-0.19825-0.05811-0.0957-0.29394-0.34863-0.18457-0.18115-0.81348-0.82715l-0.18115-0.16748q-1.22021-1.23047-1.28857-1.26465-0.06836-0.0376-0.16065-0.06494-0.09229-0.02734-0.14014-0.02734-0.04785 0-0.14697 0.02734z"
                      fill="#0A84FF"
                    ></path>
                  </svg>
                  <div
                    data-pencil-name="Trait Text"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[5px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Trait Title"
                      className="text-[15px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                    >
                      Resizes itself to the content
                    </div>
                    <div
                      data-pencil-name="Trait Body"
                      className="text-[14px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      The frontend measures itself and the window follows, so short lists do not leave
                      empty space.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
