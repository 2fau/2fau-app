export function Nav() {
  return (
    <div
      data-pencil-name="Nav"
      className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_40px] justify-between items-center"
    >
      <div
        data-pencil-name="Nav Left"
        className="box-border w-fit shrink-0 h-fit flex flex-row gap-[36px] justify-start items-center"
      >
        <div
          data-pencil-name="Logo"
          className="box-border w-fit shrink-0 h-fit flex flex-row gap-[9px] justify-start items-center"
        >
          <div
            data-pencil-name="Logo Mark"
            className="box-border w-[26px] shrink-0 h-[26px] relative"
          >
            <div
              data-pencil-name="Ring Track"
              className="box-border w-[22.334px] h-[22.334px] absolute left-[1.828px] top-[1.828px] bg-[#0A84FF3D] [clip-path:path('M11.167_0_C17.334_0_22.334_5_22.334_11.167_C22.334_17.334_17.334_22.334_11.167_22.334_C5_22.334_0_17.334_0_11.167_C0_5_5_0_11.167_0_Z_M11.167_2.032_C6.122_2.032_2.032_6.122_2.032_11.167_C2.032_16.212_6.122_20.302_11.167_20.302_C16.212_20.302_20.302_16.212_20.302_11.167_C20.302_6.122_16.212_2.032_11.167_2.032_Z')] [z-index:0]"
            ></div>
            <div
              data-pencil-name="Ring Progress"
              className="box-border w-[22.334px] h-[22.334px] absolute left-[1.828px] top-[1.828px] bg-[#0A84FF] [clip-path:path('M11.167_0_C17.334_0_22.334_5_22.334_11.167_C22.334_17.334_17.334_22.334_11.167_22.334_C5_22.334_0_17.334_0_11.167_L2.032_11.167_C2.032_16.212_6.122_20.302_11.167_20.302_C16.212_20.302_20.302_16.212_20.302_11.167_C20.302_6.122_16.212_2.032_11.167_2.032_L11.167_0_Z')] [z-index:1]"
            ></div>
            <svg
              data-pencil-name="U Glyph"
              viewBox="0 0 64 64"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[26px] h-[26px] absolute left-0 top-0 overflow-visible [z-index:2]"
            >
              <path
                d="M22 22.5v9a10 10 0 0 0 20 0v-9m0 0v19"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.641"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              ></path>
            </svg>
          </div>
          <div
            data-pencil-name="Wordmark"
            className="text-[16px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left [white-space:nowrap]"
          >
            2FAu
          </div>
        </div>
        <div
          data-pencil-name="Nav Links"
          className="box-border w-fit shrink-0 h-fit flex flex-row gap-[26px] justify-start items-center"
        >
          <div
            data-pencil-name="Desktop"
            className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Desktop
          </div>
          <div
            data-pencil-name="Extension"
            className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Extension
          </div>
          <div
            data-pencil-name="Security"
            className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Security
          </div>
          <div
            data-pencil-name="Docs"
            className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Docs
          </div>
        </div>
      </div>
      <div
        data-pencil-name="Nav Right"
        className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
      >
        <div
          data-pencil-name="Changelog"
          className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
        >
          Download
        </div>
        <div
          data-pencil-name="Nav Download"
          className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[8px_15px] justify-start items-center bg-[#0A84FF] [outline:1px_solid_#0A84FF00] [outline-offset:-0.5px] rounded-[999px]"
        >
          <div
            data-pencil-name="Label"
            className="text-[13.5px]/[normal] box-border text-[#FFFFFF] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
          >
            Add to Chrome
          </div>
        </div>
      </div>
    </div>
  );
}
