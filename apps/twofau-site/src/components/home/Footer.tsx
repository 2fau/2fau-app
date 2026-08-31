export function Footer() {
  return (
    <div
      data-pencil-name="Footer"
      className="box-border w-full h-fit shrink-0 flex flex-col gap-0 p-[26px_40px] justify-start items-center bg-[#111113]"
    >
      <div
        data-pencil-name="Footer Bottom"
        className="box-border w-[1200px] h-fit shrink-0 flex flex-row gap-0 justify-between items-center"
      >
        <div
          data-pencil-name="Footer Left"
          className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
        >
          <div
            data-pencil-name="Logo Mark"
            className="box-border w-[20px] shrink-0 h-[20px] relative"
          >
            <div
              data-pencil-name="Ring Track"
              className="box-border w-[17.18px] h-[17.18px] absolute left-[1.406px] top-[1.406px] bg-[#0A84FF3D] [clip-path:path('M8.59_0_C13.334_0_17.18_3.846_17.18_8.59_C17.18_13.334_13.334_17.18_8.59_17.18_C3.846_17.18_0_13.334_0_8.59_C0_3.846_3.846_0_8.59_0_Z_M8.59_1.563_C4.709_1.563_1.563_4.709_1.563_8.59_C1.563_12.471_4.709_15.617_8.59_15.617_C12.471_15.617_15.617_12.471_15.617_8.59_C15.617_4.709_12.471_1.563_8.59_1.563_Z')] [z-index:0]"
            ></div>
            <div
              data-pencil-name="Ring Progress"
              className="box-border w-[17.18px] h-[17.18px] absolute left-[1.406px] top-[1.406px] bg-[#0A84FF] [clip-path:path('M8.59_0_C13.334_0_17.18_3.846_17.18_8.59_C17.18_13.334_13.334_17.18_8.59_17.18_C3.846_17.18_0_13.334_0_8.59_L1.563_8.59_C1.563_12.471_4.709_15.617_8.59_15.617_C12.471_15.617_15.617_12.471_15.617_8.59_C15.617_4.709_12.471_1.563_8.59_1.563_L8.59_0_Z')] [z-index:1]"
            ></div>
            <svg
              data-pencil-name="U Glyph"
              viewBox="0 0 64 64"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[20px] h-[20px] absolute left-0 top-0 overflow-visible [z-index:2]"
            >
              <path
                d="M22 22.5v9a10 10 0 0 0 20 0v-9m0 0v19"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.031"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              ></path>
            </svg>
          </div>
          <div
            data-pencil-name="Copyright"
            className="text-[12px]/[normal] box-border text-[#6E6E73] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            © 2026 2FAu · MIT licensed
          </div>
        </div>
        <div
          data-pencil-name="Footer Bottom Right"
          className="box-border w-fit shrink-0 h-fit flex flex-row gap-[22px] justify-start items-center"
        >
          <div
            data-pencil-name="GitHub"
            className="text-[12px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            How it works
          </div>
          <div
            data-pencil-name="Discussions"
            className="text-[12px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Security
          </div>
          <div
            data-pencil-name="Mastodon"
            className="text-[12px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Docs
          </div>
          <div
            data-pencil-name="X"
            className="text-[12px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            GitHub
          </div>
          <div
            data-pencil-name="Built With"
            className="text-[11px]/[normal] box-border text-[#413F4B] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Built with Rust and Tauri 2
          </div>
        </div>
      </div>
    </div>
  );
}
