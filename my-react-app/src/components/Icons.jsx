const iconDefaults = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

function Icon({ children, className = '', size = 20 }) {
  return (
    <svg {...iconDefaults} width={size} height={size} className={className}>
      {children}
    </svg>
  )
}

export function Archive(props) {
  return (
    <Icon {...props}>
      <path d="M3 7h18" />
      <path d="M5 7v12h14V7" />
      <path d="M8 7V5h8v2" />
      <path d="M10 12h4" />
    </Icon>
  )
}

export function BarChart3(props) {
  return (
    <Icon {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17v-5" />
      <path d="M12 17V8" />
      <path d="M16 17v-8" />
    </Icon>
  )
}

export function Bell(props) {
  return (
    <Icon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </Icon>
  )
}

export function Play(props) {
  return (
    <Icon {...props}>
      <path d="M6 4v16l14-8-14-8Z" />
    </Icon>
  )
}

export function Volume2(props) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15 9.4a5 5 0 0 1 0 5.2" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </Icon>
  )
}

export function Box(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </Icon>
  )
}

export function BriefcaseBusiness(props) {
  return (
    <Icon {...props}>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 12h8" />
    </Icon>
  )
}

export function CalendarDays(props) {
  return (
    <Icon {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </Icon>
  )
}

export function Camera(props) {
  return (
    <Icon {...props}>
      <path d="M14 5h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-2Z" />
      <circle cx="12" cy="13" r="3" />
    </Icon>
  )
}

export function ChevronDown(props) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function ChevronLeft(props) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  )
}

export function CreditCard(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </Icon>
  )
}

export function DollarSign(props) {
  return (
    <Icon {...props}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  )
}

export function Download(props) {
  return (
    <Icon {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </Icon>
  )
}

export function Eye(props) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

export function Factory(props) {
  return (
    <Icon {...props}>
      <path d="M3 21V8l6 4V8l6 4V6h6v15H3Z" />
      <path d="M7 17h2" />
      <path d="M13 17h2" />
    </Icon>
  )
}

export function Filter(props) {
  return (
    <Icon {...props}>
      <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
    </Icon>
  )
}

export function Globe2(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </Icon>
  )
}

export function Grid2X2(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </Icon>
  )
}

export function History(props) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function Lock(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  )
}

export function LayoutDashboard(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  )
}

export function Mail(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  )
}

export function MessageCircle(props) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 21l1.8-5a8.4 8.4 0 1 1 16.2-4.5Z" />
    </Icon>
  )
}

export function Moon(props) {
  return (
    <Icon {...props}>
      <path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10Z" />
    </Icon>
  )
}

export function Phone(props) {
  return (
    <Icon {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </Icon>
  )
}

export function Package(props) {
  return (
    <Icon {...props}>
      <path d="m16 16 3-3-7-10-7 10 3 3" />
      <path d="M8 16v5h8v-5" />
      <path d="M8 13h8" />
    </Icon>
  )
}

export function Plus(props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

export function Printer(props) {
  return (
    <Icon {...props}>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </Icon>
  )
}

export function ReceiptText(props) {
  return (
    <Icon {...props}>
      <path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3H5Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </Icon>
  )
}

export function Share2(props) {
  return (
    <Icon {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4" />
      <path d="m8.6 13.5 6.8 4" />
    </Icon>
  )
}

export function RefreshCcw(props) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 0 1 15-6.7" />
      <path d="M18 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7" />
      <path d="M6 21v-5h5" />
    </Icon>
  )
}

export function X(props) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  )
}

export function Search(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  )
}

export function Send(props) {
  return (
    <Icon {...props}>
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </Icon>
  )
}

export function Settings(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </Icon>
  )
}

export function Shield(props) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </Icon>
  )
}

export function ShoppingCart(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7" />
    </Icon>
  )
}

export function Shuffle(props) {
  return (
    <Icon {...props}>
      <path d="M16 3h5v5" />
      <path d="m4 20 17-17" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="m4 4 5 5" />
    </Icon>
  )
}

export function SlidersHorizontal(props) {
  return (
    <Icon {...props}>
      <path d="M21 4h-7" />
      <path d="M10 4H3" />
      <path d="M21 12h-9" />
      <path d="M8 12H3" />
      <path d="M21 20h-5" />
      <path d="M12 20H3" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="14" cy="20" r="2" />
    </Icon>
  )
}

export function SquareMenu(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </Icon>
  )
}

export function Trash2(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  )
}

export function Truck(props) {
  return (
    <Icon {...props}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 11h4l3 3v3h-7" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </Icon>
  )
}

export function Upload(props) {
  return (
    <Icon {...props}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </Icon>
  )
}

export function UserPlus(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </Icon>
  )
}

export function Users(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M17 11a3 3 0 0 0 0-6" />
      <path d="M21 21a5 5 0 0 0-4-5" />
    </Icon>
  )
}

export function WalletCards(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M7 6V4h10v2" />
      <path d="M16 13h3" />
    </Icon>
  )
}
