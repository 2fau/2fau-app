export interface SiteNavProps {
  active?: "desktop" | "extension" | "security";
  chromeCta?: boolean;
}

export function SiteNav({ active, chromeCta = false }: SiteNavProps) {
  return (
    <div
            data-pencil-name="Nav"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_40px] justify-between items-center"
          >
            <div
              data-pencil-name="Nav Left"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-[36px] justify-start items-center"
            >
              <a href="/"
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
              </a>
              <div
                data-pencil-name="Nav Links"
                className="box-border w-fit shrink-0 h-fit flex flex-row gap-[26px] justify-start items-center"
              >
                <a href="/desktop"
                  data-pencil-name="Desktop"
                  className={`text-[13.5px]/[normal] box-border ${active === "desktop" ? "text-[#F5F5F7]" : "text-[#98989D]"} font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap] transition-colors hover:text-[#F5F5F7]`}>
                Desktop
                </a>
                <a href="/extension"
                  data-pencil-name="Extension"
                  className={`text-[13.5px]/[normal] box-border ${active === "extension" ? "text-[#F5F5F7]" : "text-[#98989D]"} font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap] transition-colors hover:text-[#F5F5F7]`}>
                Extension
                </a>
                <a href="/security"
                  data-pencil-name="Security"
                  className={`text-[13.5px]/[normal] box-border ${active === "security" ? "text-[#F5F5F7]" : "text-[#98989D]"} font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap] transition-colors hover:text-[#F5F5F7]`}>
                Security
                </a>
              </div>
            </div>
            <div
              data-pencil-name="Nav Right"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
            >
              <a href="/desktop"
                data-pencil-name="Download"
                className="text-[13.5px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap] transition-colors hover:text-[#F5F5F7]"
              >
                Download
              </a>
              <a href="/extension"
                data-pencil-name="Nav Download"
                className={`box-border w-fit shrink-0 h-fit flex flex-row ${chromeCta ? "gap-[8px]" : "gap-0"} p-[8px_15px] justify-start items-center bg-[#0A84FF] [outline:1px_solid_#0A84FF00] [outline-offset:-0.5px] rounded-[999px]`}
              >
    {chromeCta ? (
    <div
                  data-pencil-name="Logo"
                  className="box-border w-[14px] shrink-0 h-[14px] overflow-hidden relative"
                >
                  <svg
                    viewBox="1.1920928955078125e-7 0 15.516000628471375 10.51200008392334"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[15.516px] h-[10.512px] absolute left-[1.71px] top-[-0.072px] overflow-visible [z-index:0]"
                  >
                    <path
                      d="M15.516 5.184c-1.206-2.412-3.546-5.184-8.136-5.184-2.322 0-5.022 0.9-6.75 2.934-0.162 0.234-0.36 0.522-0.63 0.918l3.726 6.66-0.072-0.108-0.126-0.432c-0.072-0.27-0.09-0.54-0.072-0.828 0-1.71 1.494-3.942 3.852-3.942l8.208 0 0-0.018z"
                      fill="#E63C2F"
                    ></path>
                  </svg>
                  <svg
                    viewBox="0.0000040531158447265625 -4.76837158203125e-7 12.38929533958435 14.436000347137451"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[12.389px] h-[14.436px] absolute left-[-0.077px] top-[3.6px] overflow-visible [z-index:1]"
                  >
                    <path
                      d="M8.4473 14.436l3.942-7.056c-0.504 0.81-1.548 1.602-2.862 1.62-0.126 0-0.27 0-0.432 0-1.278 0-2.754-0.702-3.42-2.232l-3.906-6.768c-1.17 1.638-1.836 3.528-1.764 5.22 0.18 3.87 2.952 8.91 8.442 9.216z"
                      fill="#FBC704"
                    ></path>
                  </svg>
                  <svg
                    viewBox="2.384185791015625e-7 0 9.64799952507019 12.906000137329102"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[9.648px] h-[12.906px] absolute left-[8.37px] top-[5.112px] overflow-visible [z-index:2]"
                  >
                    <path
                      d="M0.918 0c1.152 0.036 2.25 0.702 2.772 1.458 0.45 0.612 0.774 1.368 0.774 2.412 0 1.044-0.306 1.8-0.522 2.16l-3.942 6.876 1.71 0c2.34-0.198 6.102-1.53 7.578-5.778 0.234-0.72 0.36-1.53 0.36-2.34l0-1.782c-0.09-0.936-0.324-1.89-0.774-2.97l-7.956-0.036z"
                      fill="#31A558"
                    ></path>
                  </svg>
                  <svg
                    viewBox="0 -1.1920928955078125e-7 7.199999809265137 4.48199999332428"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[7.2px] h-[4.482px] absolute left-[1.728px] top-[3.618px] overflow-visible [z-index:3]"
                  >
                    <path
                      d="M0 0l3.528 4.482c0.162-0.81 1.116-2.916 3.672-2.97l-7.2-1.512z"
                      fill="#CC392E"
                    ></path>
                  </svg>
                  <svg
                    viewBox="-2.384185791015625e-7 -4.76837158203125e-7 10.52999997138977 14.400000095367432"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[10.53px] h-[14.4px] absolute left-[1.692px] top-[3.618px] overflow-visible [z-index:4]"
                  >
                    <path
                      d="M6.534 14.4l0.486-1.818 2.088-4.05c-0.45 0.252-1.08 0.45-1.782 0.45-1.62 0-2.916-0.99-3.438-2.304l-3.888-6.678 3.654 6.714 0.216 0.288c0.396 0.72 1.44 1.998 3.402 1.998 1.548 0 2.628-0.828 3.258-1.62l-3.852 7.02-0.144 0z"
                      fill="#E5B107"
                    ></path>
                  </svg>
                  <svg
                    viewBox="-9.5367431640625e-7 -8.416245691478252e-7 8.154000282287598 1.1885408234666102"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[8.154px] h-[1.189px] absolute left-[9.072px] top-[5.13px] overflow-visible [z-index:5]"
                  >
                    <path
                      d="M2.718 1.18854l5.436-1.17-8.154-0.018c0.81-0.018 1.98 0.414 2.718 1.188z"
                      fill="#2D954F"
                    ></path>
                  </svg>
                  <svg
                    viewBox="0.0000036046840250492096 0.0000046029017539694905 7.671436996664852 7.722325490482035"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[7.671px] h-[7.722px] absolute left-[5.163px] top-[5.13px] overflow-visible [z-index:6]"
                  >
                    <path
                      d="M3.85528 0.00015c-1.98-0.018-3.6 1.638-3.852 3.456l0 0.324c-0.018 0.45 0.036 0.792 0.216 1.386 0.486 1.242 1.638 2.574 3.636 2.556 2.412 0.018 3.816-1.944 3.816-3.834 0.018-1.836-1.476-3.888-3.816-3.888z"
                      fill="#FFFFFF"
                    ></path>
                  </svg>
                  <svg
                    viewBox="0 0 6.33615255355835 6.4079999923706055"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[6.336px] h-[6.408px] absolute left-[5.832px] top-[5.742px] overflow-visible [z-index:7]"
                  >
                    <path
                      d="M3.168 0c-1.53 0-3.168 1.206-3.168 3.24 0 1.746 1.224 3.168 3.15 3.168 1.728 0 3.186-1.26 3.186-3.15 0.018-1.962-1.566-3.258-3.168-3.258z"
                      fill="#4186EE"
                    ></path>
                  </svg>
                </div>
    ) : null}
                <div
                  data-pencil-name="Label"
                  className="text-[13.5px]/[normal] box-border text-[#FFFFFF] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                >
                  Add to Chrome
                </div>
              </a>
            </div>
          </div>
  );
}
