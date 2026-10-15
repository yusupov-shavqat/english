/**
 * One icon language for the whole app.
 *
 * Every mark is a 24x24 stroke drawing that inherits the colour of its container, so
 * icons always match the text next to them and nothing (emoji, system glyphs) renders
 * differently from device to device. Use <Icon size={18} /> as the wrapper and pick a
 * named icon below.
 */
export function Icon({ size = 20, strokeWidth = 1.8, className, children }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/* ---------- Voice & conversation ---------- */
export function MicIcon(props) {
  return (
    <Icon {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
    </Icon>
  )
}

export function MicOffIcon(props) {
  return (
    <Icon {...props}>
      <path d="M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5.1 2.1M5 10v1a7 7 0 0 0 11.9 5M19 10v1c0 .8-.1 1.5-.4 2.2M12 18v4M3 3l18 18" />
    </Icon>
  )
}

export function StopIcon(props) {
  return (
    <Icon {...props}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.8" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function SpeakerIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.4 8.6a5 5 0 0 1 0 6.8M18.4 5.6a9 9 0 0 1 0 12.8" />
    </Icon>
  )
}

export function HeadphonesIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 14.5V13a8 8 0 0 1 16 0v1.5" />
      <rect x="3" y="14" width="4.2" height="6.2" rx="2.1" />
      <rect x="16.8" y="14" width="4.2" height="6.2" rx="2.1" />
    </Icon>
  )
}

export function BulbIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3a5.6 5.6 0 0 0-3.3 10.1c.5.4.8.9.9 1.5l.1.6h4.6l.1-.6c.1-.6.4-1.1.9-1.5A5.6 5.6 0 0 0 12 3z" />
      <path d="M10 18.2h4M10.6 21h2.8" />
    </Icon>
  )
}

/* ---------- Progress, goals & lesson ---------- */
export function TargetIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function TrendUpIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 17.5 9.2 12l3.6 3.6L20 8" />
      <path d="M15 8h5v5" />
    </Icon>
  )
}

export function GraduationIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4.6 3 9l9 4.4L21 9z" />
      <path d="M7 11.4V16c0 1.6 2.2 2.9 5 2.9s5-1.3 5-2.9v-4.6" />
    </Icon>
  )
}

export function ChatIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.8c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.1-2.9-.4l-4.6 1.5 1.3-3.7a7 7 0 0 1-2.3-4.8C3.5 7.7 7.3 4.4 12 4.4s8.5 3.3 8.5 7.4z" />
    </Icon>
  )
}

export function BookIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 5.6A2.6 2.6 0 0 1 6.6 3H20v14.6H6.6A2.6 2.6 0 0 0 4 20.2z" />
      <path d="M4 18.4A2.6 2.6 0 0 1 6.6 15.8H20" />
    </Icon>
  )
}

export function SparkleIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7L12 16.1l-1.7-4.6L5.7 9.8l4.6-1.7z" />
      <path d="M18.4 15.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </Icon>
  )
}

export function TrophyIcon(props) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v4.8a4 4 0 0 1-8 0z" />
      <path d="M8 5.4H5.2v1.8A3.1 3.1 0 0 0 8.4 10.3M16 5.4h2.8v1.8a3.1 3.1 0 0 1-3.2 3.1" />
      <path d="M12 12.8V17M8.5 20h7l-.6-3h-5.8z" />
    </Icon>
  )
}

export function StarIcon(props) {
  return (
    <Icon {...props}>
      <path
        d="M12 3.6l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  )
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12.6l4.6 4.6L19 7.4" />
    </Icon>
  )
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h13M12.5 6.2l5.8 5.8-5.8 5.8" />
    </Icon>
  )
}

export function CapsLockIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4.2 4.6 11h3.2v3.4h8.4V11h3.2z" />
      <path d="M8.6 17.6h6.8" />
    </Icon>
  )
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.2 2" />
    </Icon>
  )
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4.4 3.6 19h16.8z" />
      <path d="M12 10v3.6M12 16.6h.01" />
    </Icon>
  )
}

/* ---------- Account ---------- */
export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4.6" y="10.4" width="14.8" height="10.1" rx="3" />
      <path d="M8.4 10.4V7.9a3.6 3.6 0 0 1 7.2 0v2.5" />
    </Icon>
  )
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.6H18a2 2 0 0 1 2 2v10.8a2 2 0 0 1-2 2h-3.5" />
      <path d="M10.5 8.2 6.7 12l3.8 3.8M7.2 12h8.3" />
    </Icon>
  )
}

export function EyeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </Icon>
  )
}

export function EyeOffIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 4l16 16" />
      <path d="M10.6 10.7a3.2 3.2 0 0 0 4.4 4.5" />
      <path d="M6.6 7.3C4.1 8.9 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.9-.4 4.1-1" />
      <path d="M17.5 15.4c2.6-1.6 4-3.4 4-3.4S18 5.5 12 5.5c-.7 0-1.3.1-2 .2" />
    </Icon>
  )
}
