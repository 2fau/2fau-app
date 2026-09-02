export function VaultFormat() {
  return (
    <div
            data-pencil-name="Vault Format"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[96px_40px] justify-center items-start bg-[#111113]"
          >
            <div
              data-pencil-name="Vault Inner"
              className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-name="Vault Header"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[60px] justify-between items-end"
              >
                <div
                  data-pencil-name="Vault Heading"
                  className="box-border w-[640px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-name="Eyebrow"
                    className="text-[11.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal tracking-[1.4px] text-left [white-space:nowrap]"
                  >
                    VAULT FORMAT
                  </div>
                  <div
                    data-pencil-name="Title"
                    className="text-[36px]/[41px] box-border w-full text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-bold tracking-[-1.1px] text-left"
                  >
                    One sealed blob on disk.
                  </div>
                </div>
                <div
                  data-pencil-name="Vault Note"
                  className="text-[14.5px]/[24px] box-border w-[430px] shrink-0 text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                >
                  The whole vault — accounts, tombstones and revision metadata — is a single JSON
                  document, sealed as one AES-256-GCM ciphertext and rewritten on every mutation.
                </div>
              </div>
              <div
                data-pencil-name="Gap A"
                className="box-border w-full h-[44px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Blob Diagram"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[12px] justify-start items-start"
              >
                <div
                  data-pencil-name="Header Group"
                  className="box-border w-[464px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Header Chips"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[6px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Chip magic · 4 B"
                      className="box-border w-[84px] shrink-0 h-fit flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#232326] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
                    >
                      <div
                        data-pencil-name="Chip Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        2FAU
                      </div>
                      <div
                        data-pencil-name="Chip Sub"
                        className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        magic · 4 B
                      </div>
                    </div>
                    <div
                      data-pencil-name="Chip ver · 1 B"
                      className="box-border w-[56px] shrink-0 h-fit flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#232326] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
                    >
                      <div
                        data-pencil-name="Chip Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        01
                      </div>
                      <div
                        data-pencil-name="Chip Sub"
                        className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        ver · 1 B
                      </div>
                    </div>
                    <div
                      data-pencil-name="Chip kdf · 1 B"
                      className="box-border w-[56px] shrink-0 h-fit flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#232326] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
                    >
                      <div
                        data-pencil-name="Chip Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        01
                      </div>
                      <div
                        data-pencil-name="Chip Sub"
                        className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        kdf · 1 B
                      </div>
                    </div>
                    <div
                      data-pencil-name="Chip 16 B"
                      className="box-border w-[132px] shrink-0 h-fit flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#232326] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
                    >
                      <div
                        data-pencil-name="Chip Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        salt
                      </div>
                      <div
                        data-pencil-name="Chip Sub"
                        className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        16 B
                      </div>
                    </div>
                    <div
                      data-pencil-name="Chip 12 B"
                      className="box-border w-[112px] shrink-0 h-fit flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#232326] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[8px]"
                    >
                      <div
                        data-pencil-name="Chip Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        nonce
                      </div>
                      <div
                        data-pencil-name="Chip Sub"
                        className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        12 B
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="AAD Bracket"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[8px] p-[10px_0px_0px_0px] justify-start items-center"
                  >
                    <div
                      data-pencil-name="AAD Rule"
                      className="box-border w-full h-[1px] shrink-0 flex flex-row gap-0 justify-start items-start bg-[#0A84FF]"
                    ></div>
                    <div
                      data-pencil-name="AAD Label"
                      className="text-[10.5px]/[normal] box-border text-[#0A84FF] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      34-byte header · bound as associated data
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Ciphertext Group"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-name="Chip Ciphertext"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[5px] p-[13px_10px] justify-start items-center bg-[#1B1B1E] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[8px]"
                  >
                    <div
                      data-pencil-name="Chip Value"
                      className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      ciphertext
                    </div>
                    <div
                      data-pencil-name="Chip Sub"
                      className="text-[10px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      n B + 16 B GCM tag
                    </div>
                  </div>
                  <div
                    data-pencil-name="Cipher Caption"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[8px] p-[10px_0px_0px_0px] justify-start items-center"
                  >
                    <div
                      data-pencil-name="Cipher Rule"
                      className="box-border w-full h-[1px] shrink-0 flex flex-row gap-0 justify-start items-start bg-[#38383A]"
                    ></div>
                    <div
                      data-pencil-name="Cipher Label"
                      className="text-[10.5px]/[normal] box-border text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      JSON VaultDocument · encrypted
                    </div>
                  </div>
                </div>
              </div>
              <div
                data-pencil-name="Gap B"
                className="box-border w-full h-[56px] shrink-0 flex flex-row gap-0 justify-start items-start"
              ></div>
              <div
                data-pencil-name="Params Row"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[28px] justify-start items-start"
              >
                <div
                  data-pencil-name="Params Table"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[12px] overflow-hidden"
                >
                  <div
                    data-pencil-name="Param Key derivation"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Key derivation
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        PBKDF2-HMAC-SHA256
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Iterations"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Iterations
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        600,000
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Derived key"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Derived key
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        32 bytes
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Cipher"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Cipher
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        AES-256-GCM
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Salt"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Salt
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        16 bytes, per vault
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Nonce"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Nonce
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        12 bytes, per write
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Authenticated data"
                    className="[box-sizing:content-box] w-[742px] h-[42.5px] shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:#262628] [margin:0px_0px_-0.5px_0px]"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Authenticated data
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        full 34-byte header
                      </div>
                    </div>
                  </div>
                  <div
                    data-pencil-name="Param Key material"
                    className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[13px_18px] justify-between items-center"
                  >
                    <div
                      data-pencil-name="Cell Key"
                      className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Key"
                        className="text-[14px]/[normal] box-border text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        Key material
                      </div>
                    </div>
                    <div
                      data-pencil-name="Cell Value"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 justify-start items-center"
                    >
                      <div
                        data-pencil-name="Value"
                        className="text-[13px]/[normal] box-border text-[#F5F5F7] font-['JetBrains_Mono',system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        zeroized on drop
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-name="Rationale Card"
                  className="box-border w-[430px] shrink-0 h-fit flex flex-col gap-0 p-[22px_22px_24px_22px] justify-start items-start bg-[#1B1B1E] [outline:1px_solid_#262628] [outline-offset:-0.5px] rounded-[12px]"
                >
                  <div
                    data-pencil-name="Card Head"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[9px] justify-start items-center"
                  >
                    <svg
                      data-pencil-name="Icon"
                      data-icon-name="info"
                      data-icon-set="lucide"
                      viewBox="0 0 13.99993896484375 14"
                      preserveAspectRatio="xMidYMid meet"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[16px] shrink-0 h-[16px]"
                    >
                      <path
                        d="M6.69238 0.60156q-1.16211 0.04102-2.22851 0.50586-1.06299 0.46143-1.90381 1.26807-0.8374 0.80322-1.34326 1.85254-0.48877 1.0083-0.60157 2.15674-0.02734 0.19482-0.02734 0.61523 0 0.42041 0.02734 0.61523 0.11279 1.14844 0.60157 2.15674 0.65967 1.40137 1.89697 2.33789 1.24072 0.93652 2.75146 1.20313 0.5332 0.09912 1.13477 0.09912 0.75537 0 1.43213-0.15381 0.68018-0.15381 1.35351-0.4751 1.26123-0.61865 2.16358-1.70215 0.90234-1.0835 1.25439-2.44384 0.29395-1.11768 0.18116-2.25244-0.11279-1.13477-0.60157-2.17041-0.58789-1.20313-1.62011-2.08497-1.02881-0.88184-2.31397-1.2749-1.0083-0.30762-2.15674-0.25293z m0.96729 1.18946q1.07666 0.14014 1.99267 0.68017 0.91602 0.54004 1.56201 1.4082 0.82715 1.104 1.00831 2.54639 0.01367 0.16748 0.01367 0.57422 0 0.40674-0.01367 0.57422-0.14014 1.16211-0.7212 2.12939-0.58105 0.96387-1.53466 1.62354-0.4751 0.33496-1.04932 0.56055-0.57422 0.22217-1.18945 0.30761-0.25293 0.04102-0.72803 0.04102-0.4751 0-0.72803-0.04102-1.07666-0.15381-1.95849-0.68701-0.88184-0.5332-1.52784-1.3877-0.82715-1.104-1.0083-2.54638-0.01367-0.16748-0.01367-0.57422 0-0.40674 0.01367-0.57422 0.14014-1.12109 0.66993-2.05078 0.5332-0.92969 1.43212-1.58936 0.54346-0.40674 1.20655-0.66992 0.6665-0.2666 1.32617-0.3247l0.25293-0.02735q0.0957-0.01367 0.4751 0 0.37939 0.01367 0.51953 0.02735z m-0.75879 2.31054q-0.18115 0.02734-0.32129 0.16748-0.2085 0.21191-0.15381 0.50586 0.05469 0.29395 0.32129 0.42041 0.09912 0.04102 0.25293 0.04102 0.25293 0 0.42041-0.16748 0.12646-0.12646 0.15381-0.30762 0.05469-0.29395-0.15723-0.50244-0.2085-0.21191-0.51611-0.15723z m-0.05469 2.33789q-0.25293 0.08545-0.37939 0.30762l-0.04102 0.08545 0 2.46436q0 0.18115 0.03418 0.2666 0.0376 0.08203 0.11963 0.16748 0.08545 0.08203 0.18799 0.1333 0.10596 0.04785 0.23242 0.04785 0.12646 0 0.229-0.04785 0.10596-0.05127 0.18799-0.1333 0.08545-0.08545 0.11963-0.16748 0.0376-0.08545 0.0376-0.2666l0-2.46436-0.04102-0.08545q-0.09912-0.18115-0.28027-0.2666-0.08545-0.04102-0.22559-0.04785-0.14014-0.00684-0.18115 0.00683z"
                        fill="#7C6CFF"
                      ></path>
                    </svg>
                    <div
                      data-pencil-name="Card Title"
                      className="text-[15px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold tracking-[-0.2px] text-left [white-space:nowrap]"
                    >
                      Why PBKDF2 and not Argon2id?
                    </div>
                  </div>
                  <div
                    data-pencil-name="Card Body Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[13px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Card Body"
                      className="text-[14px]/[24px] box-border [flex:1_1_0] text-[#98989D] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      Argon2id is the stronger choice on paper, but it needs threads and a large memory
                      budget. 2FAu runs the same Rust core natively and as WebAssembly in a browser tab,
                      where neither is reliably available. PBKDF2-HMAC-SHA256 behaves identically on all
                      four targets.
                    </div>
                  </div>
                  <div
                    data-pencil-name="Card Note Wrap"
                    className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
                  >
                    <div
                      data-pencil-name="Card Note"
                      className="text-[13.5px]/[22px] box-border [flex:1_1_0] text-[#6E6E73] font-[Inter,system-ui,sans-serif] font-normal text-left"
                    >
                      The kdf_id byte is versioned, so Argon2id can be added later without invalidating
                      a single existing vault.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
