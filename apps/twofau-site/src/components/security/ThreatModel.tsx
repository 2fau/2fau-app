export function ThreatModel() {
  return (
    <div
            data-pencil-name="Threat Model"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[96px_40px] justify-center items-start bg-[#0B0B0D]"
          >
            <div
              data-pencil-name="Threat Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Threat Header"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[60px] justify-between items-end"
              >
                <div
                  data-pencil-name="Threat Heading"
                  className="box-border w-[640px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Eyebrow"
                    className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
                  >
                    THREAT MODEL
                  </div>
                  <div
                    data-pencil-name="Title"
                    className="text-[36px]/[41px] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.1px] text-left"
                  >
                    Local-first moves the risk. It doesn't delete it.
                  </div>
                </div>
                <div
                  data-pencil-name="Threat Note"
                  className="text-[14.5px]/[24px] box-border w-[430px] shrink-0 text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  Removing the server removes a whole class of attack and hands you a different one:
                  your device is now the only thing standing between an attacker and your secrets.
                </div>
              </div>
              <div
                data-pencil-name="Gap"
                className="box-border w-full h-[48px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Threat Columns"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[24px] justify-start items-start"
              >
                <div
                  data-pencil-name="Col Protected against"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 p-[24px_26px_28px_26px] justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[12px]"
                >
                  <div
                    data-pencil-name="Col Head"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Col Icon"
                      data-icon-name="shield-check"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[18px] shrink-0 h-[18px]"
                    >
                      <path
                        d="M6.84619 0.60156q-0.34863 0.02734-0.68701 0.30762-0.51611 0.42041-1.00147 0.70068-0.48193 0.28027-1.01513 0.4751-0.30762 0.11279-0.58789 0.1709-0.28027 0.05469-0.66992 0.08203-0.23926 0.01367-0.36573 0.07178-0.19482 0.06836-0.37939 0.22217-0.18115 0.15381-0.26319 0.34863l-0.01367 0.03076q-0.07178 0.12646-0.08545 0.22217-0.01367 0.15381-0.02734 0.60156l0 1.78076q0 2.25244 0.01367 2.46094 0.14014 1.6543 1.10742 2.88477 0.14014 0.16748 0.43409 0.46142 0.29395 0.29394 0.48877 0.44775 0.92285 0.7417 2.2832 1.27491 0.46143 0.18115 0.65625 0.23926 0.23926 0.05469 0.43408 0.01367 0.16748-0.02734 0.5332-0.15381 1.35693-0.51953 2.27979-1.20313 0.37939-0.2666 0.71435-0.60498 1.37402-1.3706 1.54151-3.37353 0.01367-0.23584 0.01367-2.46094 0-2.22852-0.02734-2.35498-0.07178-0.32129-0.31787-0.56396-0.24268-0.24609-0.5503-0.31788-0.09912-0.02734-0.37939-0.04101-0.48877-0.02734-0.96387-0.18115-0.81348-0.2666-1.55518-0.77246-0.2666-0.18115-0.64257-0.48877-0.42041-0.33496-0.96729-0.28028z m0.43408 1.34326q0.64258 0.51953 1.32959 0.86817 1.2168 0.61865 2.25244 0.68701l0.21192 0-0.01367 4.31348q0 0.33496-0.02735 0.50244-0.22559 1.34326-1.1416 2.27637-0.91602 0.92969-2.66601 1.57226l-0.21192 0.08545-0.18115-0.05469q-2.32422-0.85449-3.2334-2.22851-0.47852-0.71436-0.63232-1.63721-0.02734-0.18115-0.02735-0.50244l-0.01367-4.32715 0.19483 0q0.86816-0.05469 1.84912-0.48193 0.98096-0.42725 1.83545-1.12793 0.16748-0.14014 0.19482-0.14014 0.02734 0 0.28027 0.19482z m1.32959 3.31885q-0.06836 0.02734-0.12646 0.05127-0.05469 0.02051-1.06299 1.02539l-0.99463 0.99463-0.40674-0.40332q-0.2666-0.2666-0.3623-0.33838-0.12646-0.11279-0.19824-0.14013-0.06836-0.02734-0.19483-0.02735-0.12646 0-0.16748 0.01367-0.04102 0.01367-0.09912 0.04102-0.18115 0.09912-0.28027 0.2666-0.04102 0.08545-0.04102 0.25293l0 0.01367q0 0.14014 0.03418 0.21192 0.0376 0.06836 0.17774 0.22216 0.0957 0.11279 0.48876 0.50586l0.04102 0.04102q0.42041 0.42041 0.55371 0.54687 0.1333 0.12305 0.20166 0.15381 0.14014 0.06836 0.29395 0.05469 0.15381-0.01367 0.28027-0.09912 0.07178-0.05469 1.28857-1.27149 0.86816-0.86816 1.04932-1.06298 0.18457-0.19824 0.21192-0.27002 0.0957-0.27686-0.05811-0.52295-0.15381-0.24609-0.44775-0.25977-0.12646-0.01367-0.18116 0z"
                        fill="#30D158"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Col Title"
                      className="text-[17px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left [white-space:nowrap]"
                    >
                      Protected against
                    </div>
                  </div>
                  <div
                    data-pencil-name="Col List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[20px] p-[22px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Item A stolen vault file"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="check"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                          fill="#30D158"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          A stolen vault file
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          vault.dat on its own is inert. Change the version, kdf id, salt or nonce and
                          the GCM tag check fails before a single byte is decrypted.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item A server breach"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="check"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                          fill="#30D158"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          A server breach
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          There is no server, no account and no cloud copy. There is nothing to breach
                          on our side because there is no our side.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item Network observation"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="check"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                          fill="#30D158"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          Network observation
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Codes are derived on the device from a local secret. Generating one sends
                          nothing anywhere.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item The interface itself"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="check"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                          fill="#30D158"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          The interface itself
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Secrets never reach the UI model. The frontend asks for a code by account id
                          and gets six digits back.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item A stale device"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="check"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M11.48096 2.95313q-0.07178 0.01367-0.12989 0.0581-0.05469 0.04102-3.07617 3.06592l-3.0249 3.00781-1.28857-1.28857q-1.28857-1.28516-1.38086-1.32618-0.08887-0.04443-0.22217-0.04443-0.1333 0-0.23242 0.0376-0.0957 0.03418-0.18799 0.11279-0.08887 0.0752-0.1333 0.1709-0.02734 0.07178-0.03418 0.11279-0.00684 0.04102-0.00684 0.14014l0 0.04102q-0.01367 0.11279 0.04102 0.19824 0.07178 0.10938 0.36572 0.40332 0.19482 0.21191 0.96729 0.98096l1.49707 1.48339q0.28027 0.2666 0.38964 0.33838 0.07178 0.05469 0.18457 0.04102l0.09571 0.01367q0.07178 0 0.14013-0.02734 0.08545-0.07178 0.32129-0.28711 0.23926-0.21875 0.79981-0.76221l2.2832-2.2832q2.08496-2.09863 2.7002-2.71387 0.61524-0.61865 0.64599-0.68701 0.04102-0.08545 0.04102-0.23926 0-0.09912-0.00684-0.14014-0.00684-0.04102-0.03418-0.11279-0.04443-0.08203-0.13672-0.16406-0.08887-0.08545-0.18115-0.11963-0.08887-0.0376-0.20849-0.0376-0.11963 0-0.18799 0.02734z"
                          fill="#30D158"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          A stale device
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Merge is newest-wins with tombstones, so an old device syncing late can never
                          resurrect an account you deleted.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Col Not protected against"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 p-[24px_26px_28px_26px] justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[12px]"
                >
                  <div
                    data-pencil-name="Col Head"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Col Icon"
                      data-icon-name="shield-alert"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[18px] shrink-0 h-[18px]"
                    >
                      <path
                        d="M6.84619 0.60156q-0.34863 0.02734-0.68701 0.30762-0.51611 0.42041-1.00147 0.70068-0.48193 0.28027-1.01513 0.4751-0.30762 0.11279-0.58789 0.1709-0.28027 0.05469-0.66992 0.08203-0.23926 0.01367-0.36573 0.07178-0.19482 0.06836-0.37939 0.22217-0.18115 0.15381-0.26319 0.34863l-0.01367 0.03076q-0.07178 0.12646-0.08545 0.22217-0.01367 0.15381-0.02734 0.60156l0 1.78076q0 2.25244 0.01367 2.46094 0.14014 1.6543 1.10742 2.88477 0.14014 0.16748 0.43409 0.46142 0.29395 0.29394 0.48877 0.44775 0.92285 0.7417 2.2832 1.27491 0.46143 0.18115 0.65625 0.23926 0.23926 0.05469 0.43408 0.01367 0.16748-0.02734 0.5332-0.15381 1.35693-0.51953 2.27979-1.20313 0.37939-0.2666 0.71435-0.60498 1.37402-1.3706 1.54151-3.37353 0.01367-0.23584 0.01367-2.46094 0-2.22852-0.02734-2.35498-0.07178-0.32129-0.31787-0.56396-0.24268-0.24609-0.5503-0.31788-0.09912-0.02734-0.37939-0.04101-0.48877-0.02734-0.96387-0.18115-0.81348-0.2666-1.55518-0.77246-0.2666-0.18115-0.64257-0.48877-0.42041-0.33496-0.96729-0.28028z m0.43408 1.34326q0.64258 0.51953 1.32959 0.86817 1.2168 0.61865 2.25244 0.68701l0.21192 0-0.01367 4.31348q0 0.33496-0.02735 0.50244-0.22559 1.34326-1.1416 2.27637-0.91602 0.92969-2.66601 1.57226l-0.21192 0.08545-0.18115-0.05469q-2.32422-0.85449-3.2334-2.22851-0.47852-0.71436-0.63232-1.63721-0.02734-0.18115-0.02735-0.50244l-0.01367-4.32715 0.19483 0q0.86816-0.05469 1.84912-0.48193 0.98096-0.42725 1.83545-1.12793 0.16748-0.14014 0.19482-0.14014 0.02734 0 0.28027 0.19482z m-0.37939 2.15674q-0.0957 0.01367-0.17432 0.05127-0.0752 0.03418-0.15381 0.12647-0.0752 0.08887-0.11279 0.16748-0.03418 0.0752-0.03418 0.25634l0 2.46436 0.04102 0.08545q0.04443 0.06836 0.12646 0.15381 0.08545 0.08203 0.16065 0.12646 0.07861 0.04102 0.24609 0.04102 0.16748 0 0.24268-0.04102 0.07861-0.04443 0.16064-0.12646 0.08545-0.08545 0.12988-0.15381l0.04102-0.08545 0-2.33789q0-0.2666-0.02051-0.3418-0.02051-0.07861-0.07861-0.16064l-0.01367-0.01367q-0.09912-0.12646-0.2461-0.18116-0.14697-0.05811-0.31445-0.03076z m-0.05469 4.67578q-0.2085 0.05811-0.32129 0.22559-0.11279 0.16748-0.09912 0.37256 0.01367 0.20166 0.15381 0.35547 0.08545 0.08203 0.15381 0.12646 0.21191 0.0957 0.42041 0.03418 0.2085-0.06494 0.33496-0.24609 0.12646-0.18115 0.08545-0.40674-0.01367-0.10938-0.05127-0.17773-0.03418-0.07178-0.11963-0.14014-0.08203-0.07178-0.16064-0.11279-0.0752-0.04443-0.19483-0.05127-0.11621-0.00684-0.20166 0.0205z"
                        fill="#6E6E73"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Col Title"
                      className="text-[17px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left [white-space:nowrap]"
                    >
                      Not protected against
                    </div>
                  </div>
                  <div
                    data-pencil-name="Col List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[20px] p-[22px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Item Malware running as you"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="x"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M3.34619 2.93945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04102 0.25293 0.04443 0.08203 1.62353 1.66455l1.58252 1.58252-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 1.58252 1.58252q1.58252 1.5791 1.66455 1.62353 0.08545 0.04102 0.23926 0.04102 0.15381 0 0.23584-0.03418 0.08545-0.0376 0.18115-0.1333 0.09912-0.09912 0.1333-0.18115 0.0376-0.08545 0.0376-0.23926 0-0.15381-0.04443-0.23584-0.04101-0.08545-1.62012-1.66797l-1.58252-1.58252 1.58252-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.25293 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
                          fill="#6E6E73"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          Malware running as you
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Anything with your user privileges can read vault.dat, and once the vault is
                          unlocked, the decrypted document in memory.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item A weak passphrase"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="x"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M3.34619 2.93945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04102 0.25293 0.04443 0.08203 1.62353 1.66455l1.58252 1.58252-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 1.58252 1.58252q1.58252 1.5791 1.66455 1.62353 0.08545 0.04102 0.23926 0.04102 0.15381 0 0.23584-0.03418 0.08545-0.0376 0.18115-0.1333 0.09912-0.09912 0.1333-0.18115 0.0376-0.08545 0.0376-0.23926 0-0.15381-0.04443-0.23584-0.04101-0.08545-1.62012-1.66797l-1.58252-1.58252 1.58252-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.25293 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
                          fill="#6E6E73"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          A weak passphrase
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          600,000 PBKDF2 iterations make an offline guess expensive. They do not rescue
                          a passphrase that was already guessable.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item Remembering the passphrase"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="x"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M3.34619 2.93945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04102 0.25293 0.04443 0.08203 1.62353 1.66455l1.58252 1.58252-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 1.58252 1.58252q1.58252 1.5791 1.66455 1.62353 0.08545 0.04102 0.23926 0.04102 0.15381 0 0.23584-0.03418 0.08545-0.0376 0.18115-0.1333 0.09912-0.09912 0.1333-0.18115 0.0376-0.08545 0.0376-0.23926 0-0.15381-0.04443-0.23584-0.04101-0.08545-1.62012-1.66797l-1.58252-1.58252 1.58252-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.25293 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
                          fill="#6E6E73"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          Remembering the passphrase
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Enabling "remember" stores it in the OS keyring. From then on your vault is
                          exactly as strong as that keyring.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item Unsigned installers"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="x"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M3.34619 2.93945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04102 0.25293 0.04443 0.08203 1.62353 1.66455l1.58252 1.58252-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 1.58252 1.58252q1.58252 1.5791 1.66455 1.62353 0.08545 0.04102 0.23926 0.04102 0.15381 0 0.23584-0.03418 0.08545-0.0376 0.18115-0.1333 0.09912-0.09912 0.1333-0.18115 0.0376-0.08545 0.0376-0.23926 0-0.15381-0.04443-0.23584-0.04101-0.08545-1.62012-1.66797l-1.58252-1.58252 1.58252-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.25293 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
                          fill="#6E6E73"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          Unsigned installers
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          Windows and macOS builds are not code-signed yet. Verify checksums, or build
                          from source.
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-name="Item The issuer's copy"
                      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
                    >
                      <svg
                        data-pencil-name="Item Icon"
                        data-icon-name="x"
                        data-icon-set="lucide"
                        viewBox="0 0 13.99993896484375 14"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15px] shrink-0 h-[15px]"
                      >
                        <path
                          d="M3.34619 2.93945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04102 0.25293 0.04443 0.08203 1.62353 1.66455l1.58252 1.58252-1.58252 1.58252q-1.5791 1.58252-1.62353 1.66797-0.04102 0.08203-0.04102 0.23584 0 0.15381 0.03418 0.23926 0.0376 0.08203 0.1333 0.18115 0.09912 0.0957 0.18115 0.1333 0.08545 0.03418 0.23926 0.03418 0.15381 0 0.23584-0.04102 0.08545-0.04443 1.66797-1.62353l1.58252-1.58252 1.58252 1.58252q1.58252 1.5791 1.66455 1.62353 0.08545 0.04102 0.23926 0.04102 0.15381 0 0.23584-0.03418 0.08545-0.0376 0.18115-0.1333 0.09912-0.09912 0.1333-0.18115 0.0376-0.08545 0.0376-0.23926 0-0.15381-0.04443-0.23584-0.04101-0.08545-1.62012-1.66797l-1.58252-1.58252 1.58252-1.58252q1.5791-1.58252 1.62012-1.66455 0.04443-0.08545 0.04443-0.25293 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
                          fill="#6E6E73"
                        ></path>
                      </svg>
                      <div
                        data-pencil-name="Item Text"
                        className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] justify-start items-start"
                      >
                        <div
                          data-pencil-name="Item Title"
                          className="text-[14.5px]/[normal] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left"
                        >
                          The issuer's copy
                        </div>
                        <div
                          data-pencil-name="Item Body"
                          className="text-[13.5px]/[22px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                        >
                          TOTP is a shared secret by design. Whoever issued the seed can still generate
                          the same codes you can.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
