export function Security() {
  return (
    <div
      data-pencil-name="Security"
      className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[100px_40px] justify-center items-start bg-[#111113]"
    >
      <div
        data-pencil-name="Security Inner"
        className="box-border w-[1200px] shrink-0 h-fit flex flex-row gap-[100px] justify-start items-start"
      >
        <div
          data-pencil-name="Security Copy"
          className="box-border w-[520px] shrink-0 h-fit flex flex-col gap-[20px] justify-start items-start"
        >
          <div
            data-pencil-name="Eyebrow"
            className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
          >
            SECURITY
          </div>
          <div
            data-pencil-name="Title"
            className="text-[40px]/[44px] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-1.2px] text-left"
          >
            Your secrets never leave the device.
          </div>
          <div
            data-pencil-name="Body"
            className="text-[15.5px]/[26px] box-border w-full text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
          >
            The vault is a single encrypted blob on your disk. Codes are computed in Rust and
            handed to the UI already formatted — the interface never sees a shared secret, and
            neither does a server, because there isn't one.
          </div>
          <div
            data-pencil-name="Bullets"
            className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] justify-start items-start"
          >
            <div
              data-pencil-name="Bullet"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
            >
              <svg
                data-pencil-name="Check"
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
                data-pencil-name="Text"
                className="text-[14.5px]/[normal] box-border [flex:1_1_0] text-[#B6B3C0] font-[Inter,system-ui,sans-serif] font-normal text-left"
              >
                AES-256-GCM with Argon2id key derivation
              </div>
            </div>
            <div
              data-pencil-name="Bullet"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
            >
              <svg
                data-pencil-name="Check"
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
                data-pencil-name="Text"
                className="text-[14.5px]/[normal] box-border [flex:1_1_0] text-[#B6B3C0] font-[Inter,system-ui,sans-serif] font-normal text-left"
              >
                Auto-lock on sleep, on blur, on a timer you set
              </div>
            </div>
            <div
              data-pencil-name="Bullet"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
            >
              <svg
                data-pencil-name="Check"
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
                data-pencil-name="Text"
                className="text-[14.5px]/[normal] box-border [flex:1_1_0] text-[#B6B3C0] font-[Inter,system-ui,sans-serif] font-normal text-left"
              >
                Optional device-to-device sync over your own network
              </div>
            </div>
            <div
              data-pencil-name="Bullet"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
            >
              <svg
                data-pencil-name="Check"
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
                data-pencil-name="Text"
                className="text-[14.5px]/[normal] box-border [flex:1_1_0] text-[#B6B3C0] font-[Inter,system-ui,sans-serif] font-normal text-left"
              >
                Reproducible builds, MIT licence, audited dependencies
              </div>
            </div>
          </div>
          <div
            data-pencil-name="Link"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-[7px] justify-start items-center"
          >
            <div
              data-pencil-name="Link Label"
              className="text-[14.5px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
            >
              Read the threat model
            </div>
            <svg
              data-pencil-name="Arrow"
              data-icon-name="arrow-right"
              data-icon-set="lucide"
              viewBox="0 0 13.99993896484375 14"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[15px] shrink-0 h-[15px]"
            >
              <path
                d="M6.90088 2.35156q-0.18115 0.02734-0.32129 0.16748-0.11279 0.11279-0.14697 0.28028-0.03418 0.16748 0.02051 0.32129 0.02734 0.08545 0.25976 0.3247 0.23242 0.23584 1.36377 1.37061 1.58252 1.58252 1.58252 1.59619 0 0.01367-3.45557 0.01367l-3.44531 0-0.08545 0.04102q-0.22217 0.11279-0.30078 0.33838-0.0752 0.22217 0.00684 0.43408 0.05811 0.0957 0.14013 0.18115 0.08545 0.08203 0.16748 0.11963 0.08545 0.03418 0.53321 0.03418l3.01123 0q3.42822 0 3.42822 0.01367 0 0.01367-1.58252 1.59619-1.13135 1.13477-1.36377 1.37402-0.23242 0.23584-0.25976 0.3213-0.05469 0.15381-0.02051 0.32128 0.03418 0.16748 0.14697 0.28028 0.18115 0.18115 0.42041 0.18115l0.04102 0q0.11279 0 0.19824-0.05469 0.14014-0.09912 0.51611-0.46484l1.68164-1.67822q2.1123-2.10205 2.15332-2.18409 0.07178-0.12646 0.07178-0.28027 0-0.15381-0.07178-0.28027-0.04102-0.08203-2.1499-2.18067-2.10547-2.10205-2.17725-2.13623-0.06836-0.0376-0.23584-0.06494-0.04102 0-0.12646 0.01367z"
                fill="#F5F5F7"
              ></path>
            </svg>
          </div>
        </div>
        <div
          data-pencil-name="Vault Card"
          className="box-border [flex:1_1_0] h-fit flex flex-col gap-[20px] p-[24px] justify-start items-start bg-[#0B0A0F] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[14px]"
        >
          <div
            data-pencil-name="Card Head"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 justify-between items-center"
          >
            <div
              data-pencil-name="Head Left"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-[8px] justify-start items-center"
            >
              <svg
                data-pencil-name="File Icon"
                data-icon-name="file-lock"
                data-icon-set="lucide"
                viewBox="0 0 13.99993896484375 14"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[14px] shrink-0 h-[14px]"
              >
                <path
                  d="M3.33252 0.60156q-0.58789 0.04102-1.02197 0.44776-0.43408 0.40674-0.53321 0.99463-0.02734 0.16748-0.02734 1.96191 0 1.79102 0.02734 1.87305 0.07178 0.25293 0.31446 0.36572 0.24609 0.11279 0.48535 0 0.08203-0.04102 0.15722-0.10938 0.07861-0.07178 0.12305-0.14355 0.04102-0.11279 0.05469-0.39307 0.01367-0.28027 0.01367-1.62353l0-1.53809q0-0.23926 0.03418-0.32129 0.0376-0.08545 0.11963-0.17431 0.08545-0.09229 0.16748-0.13672l0.09912-0.04102 4.22803-0.01367 0.01367 2.54639 0.04102 0.14013q0.08545 0.22559 0.24609 0.40674 0.16064 0.18115 0.35547 0.28028 0.14014 0.07178 0.22558 0.08544 0.12646 0.02734 0.40674 0.04102l2.21143 0 0 6.11816q0 0.43408-0.0376 0.51954-0.03418 0.08203-0.11963 0.17431-0.08203 0.08887-0.16406 0.1333l-0.09912 0.04102-2.05762 0.02734-0.09912 0.04102q-0.2666 0.12646-0.31445 0.42041-0.04785 0.29395 0.14697 0.50586 0.08545 0.08203 0.18115 0.14013l0.1128 0.04102 1.93115 0q0.19824-0.01367 0.29394-0.02734 0.5332-0.11279 0.90235-0.50245 0.37256-0.39307 0.47168-0.92627 0.02734-0.16748 0.02734-3.80078 0-3.6333-0.02734-3.80078-0.08545-0.51953-0.39307-0.90918-0.12646-0.14014-1.26123-1.2749-1.13135-1.13477-1.24414-1.20312-0.43408-0.30762-0.95361-0.36573-0.14014-0.02734-2.49854-0.02734-2.3584 0-2.53955 0.02734z m6.4668 2.43701l1.03564 1.03565-2.08496 0 0-1.03565q0-1.03564 0-1.04931l1.04932 1.04931z m-5.9917 3.98877q-0.54688 0.08545-0.93311 0.45801-0.38281 0.36914-0.50928 0.91602-0.02734 0.12305-0.04101 0.52978l0 0.40674-0.12647 0.01367q-0.37939 0.02734-0.70068 0.33496-0.14014 0.15381-0.20508 0.28711-0.06152 0.1333-0.08887 0.21875-0.01367 0.09912-0.02734 0.36231l0 0.82715 0 0.90918q0 0.16748 0.02734 0.2666 0.07178 0.28027 0.32129 0.51953 0.11279 0.10938 0.22559 0.18115 0.11279 0.06836 0.2666 0.11279l0.12647 0.04102 3.90332 0 0.14013-0.04102q0.29395-0.09912 0.50928-0.34179 0.21875-0.24609 0.27686-0.52637 0.02734-0.14014 0.02734-1.13477 0-0.99463-0.02734-1.12109-0.07178-0.33496-0.35889-0.60156-0.28711-0.2666-0.6084-0.29395l-0.18115-0.02734 0-0.3794q0-0.30762-0.01367-0.45459-0.01367-0.14697-0.08545-0.32812-0.14014-0.40674-0.4751-0.70752-0.33496-0.30078-0.75537-0.3999-0.14014-0.04102-0.34522-0.04785-0.20166-0.00684-0.34179 0.0205z m0.51953 1.18946q0.08203 0.04443 0.15722 0.12304 0.07861 0.0752 0.12305 0.14356 0.06836 0.14014 0.06836 0.57422l0 0.2666-1.17578 0 0-0.36572q0.01367-0.26318 0.02051-0.31788 0.00684-0.05811 0.04101-0.14013 0.0376-0.08545 0.12647-0.16748 0.09229-0.08545 0.18799-0.11963 0.09912-0.0376 0.23242-0.0376 0.1333 0 0.21875 0.04102z m1.49707 3.15136l0 0.88184-3.5 0 0-1.75 3.5 0 0 0.86816z"
                  fill="#6E6E73"
                ></path>
              </svg>
              <div
                data-pencil-name="Path"
                className="text-[12px]/[normal] box-border text-[#98989D] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                app_data_dir/vault.dat
              </div>
            </div>
            <div
              data-pencil-name="Cipher Tag"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[4px_9px] justify-start items-start bg-[#4ADE801A] [outline:1px_solid_#4ADE8038] [outline-offset:-0.5px] rounded-[6px]"
            >
              <div
                data-pencil-name="Tag Label"
                className="text-[11px]/[normal] box-border text-[#30D158] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                AES-256-GCM
              </div>
            </div>
          </div>
          <div
            data-pencil-name="Layout Label"
            className="text-[10.5px]/[normal] box-border text-[#4A4854] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.2px] text-left [white-space:nowrap]"
          >
            BLOB LAYOUT
          </div>
          <div
            data-pencil-name="Byte Layout"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-[6px] justify-start items-start"
          >
            <div
              data-pencil-name="Chip 2FAU"
              className="box-border w-[56px] shrink-0 h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                2FAU
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                magic
              </div>
            </div>
            <div
              data-pencil-name="Chip 01"
              className="box-border w-[40px] shrink-0 h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                01
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                ver
              </div>
            </div>
            <div
              data-pencil-name="Chip 02"
              className="box-border w-[40px] shrink-0 h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                02
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                kdf
              </div>
            </div>
            <div
              data-pencil-name="Chip salt"
              className="box-border w-[70px] shrink-0 h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#98989D] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                salt
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                16 bytes
              </div>
            </div>
            <div
              data-pencil-name="Chip nonce"
              className="box-border w-[70px] shrink-0 h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#98989D] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                nonce
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                12 bytes
              </div>
            </div>
            <div
              data-pencil-name="Chip ciphertext"
              className="box-border [flex:1_1_0] h-fit flex flex-col gap-[5px] p-[10px] justify-start items-center bg-[#232326] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[8px]"
            >
              <div
                data-pencil-name="Chip Value"
                className="text-[12px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                ciphertext
              </div>
              <div
                data-pencil-name="Chip Sub"
                className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                n bytes
              </div>
            </div>
          </div>
          <div
            data-pencil-name="Card Note"
            className="text-[13px]/[21px] box-border w-full text-[#6E6E73] font-[Inter,system-ui,sans-serif] font-normal text-left"
          >
            The 6-byte header is self-describing and bound as associated data, so a tampered
            version or KDF id fails the tag check before anything is decrypted.
          </div>
          <div
            data-pencil-name="Card Divider"
            className="box-border w-full h-[1px] shrink-0 bg-[#262628]"
          ></div>
          <div
            data-pencil-name="KDF Row"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 justify-between items-start"
          >
            <div
              data-pencil-name="KDF KDF"
              className="box-border w-fit shrink-0 h-fit flex flex-col gap-[5px] justify-start items-start"
            >
              <div
                data-pencil-name="Key"
                className="text-[10px]/[normal] box-border text-[#4A4854] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.8px] text-left [white-space:nowrap]"
              >
                KDF
              </div>
              <div
                data-pencil-name="Value"
                className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Argon2id
              </div>
            </div>
            <div
              data-pencil-name="KDF MEMORY"
              className="box-border w-fit shrink-0 h-fit flex flex-col gap-[5px] justify-start items-start"
            >
              <div
                data-pencil-name="Key"
                className="text-[10px]/[normal] box-border text-[#4A4854] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.8px] text-left [white-space:nowrap]"
              >
                MEMORY
              </div>
              <div
                data-pencil-name="Value"
                className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                64 MiB
              </div>
            </div>
            <div
              data-pencil-name="KDF ITERATIONS"
              className="box-border w-fit shrink-0 h-fit flex flex-col gap-[5px] justify-start items-start"
            >
              <div
                data-pencil-name="Key"
                className="text-[10px]/[normal] box-border text-[#4A4854] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.8px] text-left [white-space:nowrap]"
              >
                ITERATIONS
              </div>
              <div
                data-pencil-name="Value"
                className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                3
              </div>
            </div>
            <div
              data-pencil-name="KDF PARALLELISM"
              className="box-border w-fit shrink-0 h-fit flex flex-col gap-[5px] justify-start items-start"
            >
              <div
                data-pencil-name="Key"
                className="text-[10px]/[normal] box-border text-[#4A4854] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[0.8px] text-left [white-space:nowrap]"
              >
                PARALLELISM
              </div>
              <div
                data-pencil-name="Value"
                className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                4
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
