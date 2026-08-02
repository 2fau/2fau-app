export type LogoTone = 'color' | 'mono-light' | 'mono-dark'

type MarkProps = {
    size?: number
    tone?: LogoTone
    /** 0 - 1, how much of the countdown ring is remaining */
    progress?: number
    /** urgent state — ring switches to the warning colour */
    urgent?: boolean
    className?: string
    title?: string
}

const TONES: Record<LogoTone, { ring: string; track: string; u: string }> = {
    color: { ring: '#0A84FF', track: 'rgba(10,132,255,0.22)', u: '#FFFFFF' },
    'mono-light': { ring: '#FFFFFF', track: 'rgba(255,255,255,0.22)', u: '#FFFFFF' },
    'mono-dark': { ring: '#101216', track: 'rgba(16,18,22,0.18)', u: '#101216' },
}

const RADIUS = 25
const CIRCUM = 2 * Math.PI * RADIUS

/**
 * The mark: a TOTP countdown ring wrapping a lowercase "u" — the timer you already
 * watch every 30 seconds doubles as the accent letter of the wordmark.
 */
export function LogoMark({
                             size = 64,
                             tone = 'color',
                             progress = 0.72,
                             urgent = false,
                             className,
                             title = '2FAu',
                         }: MarkProps) {
    const c = TONES[tone]
    const ring = tone === 'color' && urgent ? '#FF9F0A' : c.ring
    const clamped = Math.max(0, Math.min(1, progress))

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            role="img"
            aria-label={title}
            className={className}
        >
            <circle cx="32" cy="32" r={RADIUS} stroke={c.track} strokeWidth="5" />
            <circle
                cx="32"
                cy="32"
                r={RADIUS}
                stroke={ring}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${CIRCUM * clamped} ${CIRCUM}`}
                transform="rotate(-90 32 32)"
            />
            <path
                d="M22 22.5V31.5a10 10 0 0 0 20 0V22.5"
                stroke={c.u}
                strokeWidth="6.5"
                strokeLinecap="round"
            />
            <path d="M42 22.5V41.5" stroke={c.u} strokeWidth="6.5" strokeLinecap="round" />
        </svg>
    )
}

type WordmarkProps = {
    size?: number
    tone?: LogoTone
    className?: string
}

export function Wordmark({ size = 28, tone = 'color', className }: WordmarkProps) {
    const base = tone === 'mono-dark' ? 'text-[#101216]' : 'text-white'
    const accent =
        tone === 'color' ? 'text-[#0A84FF]' : tone === 'mono-dark' ? 'text-[#101216]' : 'text-white'
    return (
        <span
            className={`select-none font-semibold tracking-[-0.03em] leading-none ${base} ${className ?? ''}`}
            style={{ fontSize: size }}
        >
      2FA<span className={accent}>u</span>
    </span>
    )
}

type LockupProps = {
    size?: number
    tone?: LogoTone
    orientation?: 'horizontal' | 'stacked'
    className?: string
}

export function LogoLockup({
                               size = 40,
                               tone = 'color',
                               orientation = 'horizontal',
                               className,
                           }: LockupProps) {
    const stacked = orientation === 'stacked'
    return (
        <div
            className={`flex items-center ${stacked ? 'flex-col' : 'flex-row'} ${className ?? ''}`}
            style={{ gap: stacked ? size * 0.35 : size * 0.32 }}
        >
            <LogoMark size={size} tone={tone} />
            <Wordmark size={size * 0.7} tone={tone} />
        </div>
    )
}

type AppIconProps = {
    size?: number
    className?: string
}

/** macOS-style squircle app tile */
export function AppIcon({ size = 128, className }: AppIconProps) {
    return (
        <div
            className={`relative flex items-center justify-center bg-[#16181D] ring-1 ring-white/10 ${className ?? ''}`}
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.2237,
                boxShadow: '0 18px 40px -12px rgba(0,0,0,0.65)',
            }}
        >
            <LogoMark size={size * 0.62} tone="color" />
        </div>
    )
}
