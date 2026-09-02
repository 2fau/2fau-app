export function Differences() {
  return (
    <div
            data-pencil-name="Differences Section"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[96px_40px] justify-center items-start bg-[#0B0B0D]"
          >
            <div
              data-pencil-name="Differences Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Differences Header"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[60px] justify-between items-end"
              >
                <div
                  data-pencil-name="Differences Heading"
                  className="box-border w-[640px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Eyebrow"
                    className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
                  >
                    CHROME / EDGE vs FIREFOX
                  </div>
                  <div
                    data-pencil-name="Title"
                    className="text-[36px]/[41px] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.1px] text-left"
                  >
                    Where the two builds actually differ.
                  </div>
                </div>
                <div
                  data-pencil-name="Differences Note"
                  className="text-[14.5px]/[24px] box-border w-[430px] shrink-0 text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  Both are MV3 and both ship the same UI and the same WASM core. Gecko needs five
                  concessions, and the Firefox manifest is generated from the Chrome one so they cannot
                  drift apart.
                </div>
              </div>
              <div
                data-pencil-name="Gap"
                className="box-border w-full h-[44px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Differences Table"
                className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[12px] overflow-hidden"
              >
                <div
                  data-pencil-name="Head Row"
                  className="[box-sizing:content-box] w-[1200px] h-[41.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center bg-[#232326] [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Head Cell aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Head Text"
                      className="text-[10.5px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1px] text-left [white-space:nowrap]"
                    ></div>
                  </div>
                  <div
                    data-pencil-name="Head Cell CHROME / EDGE"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-[8px] justify-start items-center"
                  >
                    <div
                      data-pencil-name="Logo Chrome"
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
                    <div
                      data-pencil-name="Logo Edge"
                      className="box-border w-[14px] shrink-0 h-[14px] overflow-hidden relative"
                    >
                      <svg
                        viewBox="-0.000002823770046234131 0.0000012069940567016602 15.649529419839382 15.663989767432213"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15.65px] h-[15.664px] absolute left-[1.163px] top-[1.161px] overflow-visible [z-index:0]"
                      >
                        <path
                          d="M13.94533 11.91945c-0.192 0.096-0.996 0.624-2.7 0.636-1.188 0-2.088-0.252-2.796-0.612-0.828-0.42-1.608-1.068-2.172-2.016-0.24-0.444-0.552-1.14-0.552-1.884 0-0.744 0.288-1.584 1.032-1.908 0.48-0.216 1.032-0.288 1.548-0.132 0.624 0.192 1.308 0.864 1.404 1.704 0.036 0.492-0.036 1.008-0.504 1.488-0.084 0.096-0.144 0.276-0.072 0.564 0.168 0.504 1.068 1.068 2.46 1.068 1.092 0.012 2.064-0.348 2.82-1.08 0.708-0.696 1.248-1.74 1.236-2.952-0.036-1.812-1.032-3.384-2.136-4.488-1.116-1.068-2.556-1.908-4.176-2.196-2.064-0.288-3.708-0.024-5.34 0.864-1.944 1.092-3.66 3.3-3.972 6.024l0 0.84 0.54-0.24 1.74-2.304 2.604-1.656 1.488 0.12 1.428 0.588 1.284 1.164 0.444 1.728 0.12 0.612 0 0.228-0.12 0.336 0.144-1.284-0.588-1.416-0.792-0.924-1.08-0.696-1.248-0.396-1.272 0c-0.828 0.048-1.884 0.252-2.928 1.02-0.66 0.48-1.332 1.224-1.752 2.22-0.048 0.264-0.036 0.888-0.036 1.116 0.06 3.168 2.136 6.012 5.004 7.068 1.2 0.456 2.364 0.636 3.852 0.492 1.536-0.156 3.456-0.804 4.98-2.4l0.528-0.696c0.156-0.216 0.048-0.792-0.42-0.6z"
                          fill="#1B87DC"
                        ></path>
                      </svg>
                      <svg
                        viewBox="2.384185791015625e-7 3.0547380447387695e-7 10.44956374168396 8.456208877265453"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[10.45px] h-[8.456px] absolute left-[5.16px] top-[8.22px] overflow-visible [z-index:1]"
                      >
                        <path
                          d="M9.972 4.86c-0.492 0.228-1.26 0.624-2.724 0.636-1.188 0-2.088-0.252-2.796-0.612-0.828-0.42-1.608-1.068-2.172-2.016-0.24-0.444-0.552-1.14-0.552-1.884 0-0.312 0.048-0.6 0.144-0.864l-0.696-0.12-1.176 1.62 0 2.34 1.08 2.472 2.136 1.656c0.732 0.24 1.452 0.408 2.268 0.36 1.416-0.24 3.024-0.924 4.356-2.292 0.18-0.192 0.42-0.48 0.564-0.732 0.12-0.18 0.012-0.756-0.432-0.564z"
                          fill="#35C1F1"
                        ></path>
                      </svg>
                      <svg
                        viewBox="-7.152557373046875e-7 -9.5367431640625e-7 9.70799994468689 12.03600025177002"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[9.708px] h-[12.036px] absolute left-[1.152px] top-[4.8px] overflow-visible [z-index:2]"
                      >
                        <path
                          d="M5.856 3.3c0.192-0.264 0.408-0.564 0.792-0.768-1.152 0.372-2.532 1.836-2.532 4.14 0 1.5 0.744 2.736 1.404 3.468 1.032 1.128 2.292 1.74 4.044 1.74-0.432 0.084-0.948 0.156-1.704 0.156-3.24 0-5.148-1.608-6.264-3.024-0.828-1.08-1.548-2.76-1.596-4.596 0-0.84 0.036-1.308 0.396-1.956 0.456-0.744 1.14-1.392 1.812-1.728 0.888-0.516 1.86-0.732 2.904-0.732 0.864 0 1.644 0.132 2.388 0.564 0.744 0.396 1.26 0.96 1.572 1.464 0.444 0.684 0.6 1.404 0.636 2.04-0.06-0.768-0.636-1.452-1.26-1.668-0.456-0.192-1.116-0.228-1.752 0.084-0.348 0.156-0.6 0.444-0.78 0.816l-0.06 0z"
                          fill="#0C57A4"
                        ></path>
                      </svg>
                    </div>
                    <div
                      data-pencil-name="Head Text"
                      className="text-[10.5px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1px] text-left [white-space:nowrap]"
                    >
                      CHROME / EDGE
                    </div>
                  </div>
                  <div
                    data-pencil-name="Head Cell FIREFOX"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-[8px] justify-start items-center"
                  >
                    <div
                      data-pencil-name="Logo Firefox"
                      className="box-border w-[14px] shrink-0 h-[14px] overflow-hidden relative"
                    >
                      <svg
                        viewBox="0.0000010281801223754883 0.000001043081283569336 15.23812572658062 15.182020097970963"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[15.238px] h-[15.182px] absolute left-[1.451px] top-[1.92px] overflow-visible [z-index:0]"
                      >
                        <path
                          d="M9.90733 0.40219c-0.378-0.162-2.376-0.702-4.338-0.18-2.502 0.648-4.788 2.79-5.4 5.544-0.756 3.438 0.99 8.064 5.832 9.252 4.428 0.882 9.072-1.836 9.234-7.218 0.09-3.078-1.998-6.408-5.328-7.398z"
                          fill="#FB7715"
                        ></path>
                      </svg>
                      <svg
                        viewBox="0 0 2.1059999465942383 2.3399999141693115"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[2.106px] h-[2.34px] absolute left-[9.252px] top-[0.792px] overflow-visible [z-index:1]"
                      >
                        <path
                          d="M0 2.34l0.504-2.34 1.602 1.53c0 0-1.098 0.234-2.106 0.81z"
                          fill="#FACD24"
                        ></path>
                      </svg>
                      <svg
                        viewBox="5.066394805908203e-7 0 9.12599989771843 9.648000717163086"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[9.126px] h-[9.648px] absolute left-[3.204px] top-[3.87px] overflow-visible [z-index:2]"
                      >
                        <path
                          d="M5.184 0l-1.89 1.62c0.126 0.324 0.378 0.864 1.062 0.756l1.458-0.324c1.62 0 3.312 1.422 3.312 3.42 0 1.998-1.53 4.176-4.446 4.176-1.368 0-2.664-0.396-4.266-1.854-0.234-0.594-0.414-1.296-0.414-2.178 0-2.484 2.214-5.4 5.184-5.616z"
                          fill="#FFFFFF"
                        ></path>
                      </svg>
                      <svg
                        viewBox="0 -0.0000014677643775939941 11.177802085876465 9.463450945913792"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[11.178px] h-[9.464px] absolute left-[3.618px] top-[5.819px] overflow-visible [z-index:3]"
                      >
                        <path
                          d="M5.4 0.06745c0.432-0.036 3.528-0.558 5.364 1.998 0.27 0.45 0.378 0.864 0.396 1.206 0.252 3.006-2.196 6.192-5.778 6.192-2.574 0-4.428-1.584-5.382-3.636 1.008 1.026 2.448 1.872 4.266 1.872 2.862 0 4.446-1.854 4.446-4.032 0-1.746-1.35-3.528-3.312-3.6z"
                          fill="#EE3E28"
                        ></path>
                      </svg>
                      <svg
                        viewBox="0 2.384185791015625e-7 4.895999908447266 4.878000020980835"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="box-border w-[4.896px] h-[4.878px] absolute left-[6.552px] top-[7.074px] overflow-visible [z-index:4]"
                      >
                        <path
                          d="M4.896 2.448c0 1.332-1.008 2.43-2.448 2.43-1.386 0-2.448-1.026-2.448-2.43 0-1.17 1.026-2.448 2.43-2.448 1.314 0 2.466 1.08 2.466 2.448z"
                          fill="#332572"
                        ></path>
                      </svg>
                    </div>
                    <div
                      data-pencil-name="Head Text"
                      className="text-[10.5px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1px] text-left [white-space:nowrap]"
                    >
                      FIREFOX
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row Background"
                  className="[box-sizing:content-box] w-[1200px] h-[46.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Background
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      service worker
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      event page · module scripts
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row Clipboard"
                  className="[box-sizing:content-box] w-[1200px] h-[46.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Clipboard
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      offscreen document
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      direct DOM write in the background
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row Options page"
                  className="[box-sizing:content-box] w-[1200px] h-[46.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Options page
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      options_page
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      options_ui · opens in a tab
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row offscreen permission"
                  className="[box-sizing:content-box] w-[1200px] h-[46.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      offscreen permission
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      required
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      dropped — unknown to Gecko
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row Minimum version"
                  className="[box-sizing:content-box] w-[1200px] h-[46.5px] shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Minimum version
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      Chrome 116
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      Firefox 128
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Row Distribution"
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[24px] p-[14px_22px] justify-start items-center"
                >
                  <div
                    data-pencil-name="Cell Aspect"
                    className="box-border w-[300px] shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Aspect"
                      className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Distribution
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      Chrome Web Store
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cell Value"
                    className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                  >
                    <div
                      data-pencil-name="Value"
                      className="text-[12.5px]/[19px] box-border [flex:1_1_0] text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left"
                    >
                      AMO, signed .xpi
                    </div>
                  </div>
                </div>
              </div>
              <div
                data-pencil-name="Gap 2"
                className="box-border w-full h-[24px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Derivation Strip"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[12px] p-[16px_20px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[10px]"
              >
                <svg
                  data-pencil-name="Icon"
                  data-icon-name="git-fork"
                  data-icon-set="lucide"
                  viewBox="0 0 13.99993896484375 14"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px]"
                >
                  <path
                    d="M3.1377 1.20313q-0.89893 0.15381-1.44239 0.82714-0.18457 0.22217-0.29052 0.44776-0.10254 0.22559-0.18799 0.51953-0.02734 0.10938-0.03418 0.19482-0.00684 0.08203-0.00684 0.30762 0 0.28027 0.02734 0.43408 0.02734 0.15381 0.1128 0.3794 0.18115 0.48877 0.55713 0.86132 0.37939 0.36914 0.88525 0.53663l0.16748 0.0581 0 0.40332q0 0.42041 0.03418 0.57422 0.0376 0.15381 0.09912 0.25977 0.06152 0.10596 0.19483 0.23925 0.1333 0.1333 0.23925 0.19483 0.10596 0.06152 0.27344 0.10596 0.0957 0.02734 0.30762 0.02734l2.35156 0 0 0.65625-0.16748 0.0581q-0.50586 0.16748-0.88525 0.54004-0.37598 0.36914-0.55713 0.85791-0.08545 0.22559-0.1128 0.3794-0.02734 0.15381-0.02734 0.43408 0 0.28027 0.02734 0.43408 0.02734 0.15381 0.1128 0.3794 0.16748 0.4751 0.52978 0.84082 0.36572 0.36231 0.84082 0.52978 0.22559 0.08545 0.3794 0.1128 0.15381 0.02734 0.43408 0.02734 0.28027 0 0.43408-0.02734 0.15381-0.02734 0.3794-0.1128 0.4751-0.16748 0.8374-0.52978 0.36572-0.36572 0.5332-0.84082 0.08545-0.22559 0.11279-0.3794 0.02734-0.15381 0.02735-0.43408 0-0.28027-0.02735-0.43408-0.02734-0.15381-0.11279-0.3794-0.18115-0.48877-0.56054-0.85791-0.37598-0.37256-0.88184-0.54004l-0.16748-0.0581 0-0.65625 2.35156 0q0.2085 0 0.30762-0.02734 0.16748-0.04443 0.28027-0.10596 0.11279-0.06152 0.23926-0.18799 0.12647-0.12646 0.18799-0.23926 0.06152-0.11279 0.10595-0.28027 0.02734-0.14014 0.02735-0.56055l0-0.40332 0.16748-0.0581q0.50586-0.16748 0.88183-0.53663 0.37939-0.37256 0.56055-0.86132 0.08545-0.22559 0.11279-0.3794 0.02734-0.15381 0.02735-0.43408 0-0.28027-0.02735-0.43408-0.02734-0.15381-0.11279-0.3794-0.18115-0.4751-0.56055-0.85107-0.37598-0.37939-0.86816-0.5332-0.2085-0.07178-0.35547-0.09912-0.14697-0.02734-0.3999-0.02735-0.25293 0-0.3999 0.02735-0.14697 0.02734-0.35547 0.09912-0.49219 0.15381-0.87158 0.5332-0.37598 0.37598-0.55713 0.85107-0.08545 0.22559-0.1128 0.3794-0.02734 0.15381-0.02734 0.43408 0 0.28027 0.02734 0.43408 0.02734 0.15381 0.1128 0.3794 0.18115 0.48877 0.55713 0.86132 0.37939 0.36914 0.88525 0.53663l0.16748 0.0581 0 0.65625-5.85156 0 0-0.65625 0.16748-0.0581q0.50586-0.16748 0.88184-0.53663 0.37939-0.37256 0.56054-0.86132 0.08545-0.22559 0.11279-0.3794 0.02734-0.15381 0.02735-0.43408 0-0.28027-0.02735-0.43408-0.02734-0.15381-0.11279-0.3794-0.2085-0.55713-0.6665-0.95019-0.45459-0.39307-1.04248-0.51953-0.14014-0.02734-0.42725-0.03418-0.28711-0.00684-0.41015 0.02051z m0.65625 1.1621q0.28027 0.07178 0.52294 0.31788 0.24609 0.24268 0.31788 0.52294 0.02734 0.12646 0.02734 0.29395 0 0.16748-0.02734 0.28027-0.07178 0.29395-0.3042 0.53321-0.229 0.23584-0.53662 0.32129-0.11279 0.02734-0.29395 0.02734-0.18115 0-0.29395-0.02734-0.30762-0.08545-0.54003-0.32129-0.229-0.23926-0.30079-0.53321-0.02734-0.11279-0.02734-0.28027 0-0.16748 0.02734-0.29395 0.05811-0.22559 0.22559-0.43408 0.16748-0.2085 0.40674-0.32129 0.34863-0.18115 0.79639-0.08545z m7 0q0.28027 0.07178 0.52294 0.31788 0.24609 0.24268 0.31788 0.52294 0.02734 0.12646 0.02734 0.29395 0 0.16748-0.02734 0.28027-0.07178 0.29395-0.3042 0.53321-0.229 0.23584-0.53662 0.32129-0.11279 0.02734-0.29395 0.02734-0.18115 0-0.29395-0.02734-0.30762-0.08545-0.54003-0.32129-0.229-0.23926-0.30079-0.53321-0.02734-0.11279-0.02734-0.28027 0-0.16748 0.02734-0.29395 0.05811-0.22559 0.22559-0.43408 0.16748-0.2085 0.40674-0.32129 0.34863-0.18115 0.79639-0.08545z m-3.5 7q0.28027 0.07178 0.52294 0.31788 0.24609 0.24268 0.31788 0.52294 0.02734 0.12647 0.02734 0.29395 0 0.16748-0.02734 0.28027-0.07178 0.29395-0.3042 0.53321-0.229 0.23584-0.53662 0.32129-0.11279 0.02734-0.29395 0.02734-0.18115 0-0.29395-0.02734-0.30762-0.08545-0.54003-0.32129-0.229-0.23926-0.30079-0.53321-0.02734-0.11279-0.02734-0.28027 0-0.16748 0.02734-0.29395 0.05811-0.22559 0.22559-0.43408 0.16748-0.2085 0.40674-0.32129 0.34863-0.18115 0.79639-0.08545z"
                    fill="#7C6CFF"
                  ></path>
                </svg>
                <div
                  data-pencil-name="Strip Text"
                  className="text-[13.5px]/[21px] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  scripts/firefox-manifest.mjs derives the Gecko manifest from the Chrome one — a pure
                  function, unit-tested, so a permission added for Chrome shows up in the Firefox build
                  or fails the suite.
                </div>
              </div>
            </div>
          </div>
  );
}
