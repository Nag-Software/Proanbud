import { 
  KpiData, 
  ChartDataPoint, 
  ActivityItem, 
  InboxMessage,
  Tilbud, 
  Kunde,
  JobbtypeAnalyse, 
  InntektFordeling,
  NavLink,
  User
} from './types';

export const navLinks: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard'
  },
  {
    href: '/tilbud',
    label: 'Tilbud',
    icon: 'FileText'
  },
  {
    href: '/kunder',
    label: 'Kunder',
    icon: 'Users'
  },
  {
    href: '/innboks',
    label: 'Innboks',
    icon: 'Inbox'
  },
  {
    href: "/prislister",
    label: "Prislister",
    icon: "BookOpen"
  },
  {
    href: '/bedrift',
    label: 'Min Bedrift',
    icon: 'Store'
  },
  {
    href: '/innstillinger',
    label: 'Innstillinger',
    icon: 'Settings'
  }
];