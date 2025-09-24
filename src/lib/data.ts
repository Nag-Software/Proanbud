import { 
  KpiData, 
  ChartDataPoint, 
  ActivityItem, 
  Tilbud, 
  Kunde,
  JobbtypeAnalyse, 
  InntektFordeling,
  NavLink,
  User
} from './types';

export const kpiData: KpiData[] = [
  {
    title: 'Total Omsetning',
    value: '2,847,500 kr',
    change: '+12.3%',
    icon: 'DollarSign'
  },
  {
    title: 'Aktive Tilbud',
    value: '47',
    change: '+8.2%',
    icon: 'FileText'
  },
  {
    title: 'Vunnede Tilbud',
    value: '23',
    change: '+15.7%',
    icon: 'Award'
  },
  {
    title: 'Treffprosent',
    value: '68.5%',
    change: '+4.1%',
    icon: 'Target'
  }
];

export const chartData: ChartDataPoint[] = [
  { date: 'Jan', omsatt: 180000, tilbudt: 320000 },
  { date: 'Feb', omsatt: 210000, tilbudt: 380000 },
  { date: 'Mar', omsatt: 195000, tilbudt: 295000 },
  { date: 'Apr', omsatt: 280000, tilbudt: 420000 },
  { date: 'Mai', omsatt: 320000, tilbudt: 480000 },
  { date: 'Jun', omsatt: 290000, tilbudt: 390000 },
  { date: 'Jul', omsatt: 350000, tilbudt: 520000 },
  { date: 'Aug', omsatt: 285000, tilbudt: 445000 },
  { date: 'Sep', omsatt: 410000, tilbudt: 580000 },
  { date: 'Okt', omsatt: 380000, tilbudt: 495000 },
  { date: 'Nov', omsatt: 425000, tilbudt: 620000 },
  { date: 'Des', omsatt: 315000, tilbudt: 450000 }
];

export const activityFeed: ActivityItem[] = [
  {
    id: '1',
    type: 'tilbud_vunnet',
    title: 'Tilbud vunnet',
    description: 'Kjøkkenrenovering - Villa Solberg',
    timestamp: '2 timer siden',
    amount: 185000
  },
  {
    id: '2',
    type: 'tilbud_sendt',
    title: 'Nytt tilbud sendt',
    description: 'Baderomsrenovering - Torggata 15',
    timestamp: '4 timer siden',
    amount: 95000
  },
  {
    id: '3',
    type: 'ny_kunde',
    title: 'Ny kunde registrert',
    description: 'Hansen Bygg AS',
    timestamp: '6 timer siden'
  },
  {
    id: '4',
    type: 'tilbud_tapt',
    title: 'Tilbud tapt',
    description: 'Terrasse - Strandveien 42',
    timestamp: '1 dag siden',
    amount: 65000
  },
  {
    id: '5',
    type: 'tilbud_vunnet',
    title: 'Tilbud vunnet',
    description: 'Oppbevaring - Loft og kjeller',
    timestamp: '2 dager siden',
    amount: 125000
  }
];

export const tilbudData: Tilbud[] = [
  {
    id: 'T001',
    kundenavn: 'Olsen Familie',
    prosjekt: 'Kjøkkenrenovering komplett',
    jobbtype: 'Kjøkken',
    belop: 285000,
    status: 'vunnet',
    dato: '2024-12-15',
    svarfrist: '2024-12-20'
  },
  {
    id: 'T002',
    kundenavn: 'Hansen Bygg AS',
    prosjekt: 'Baderomsrenovering',
    jobbtype: 'Bad/Sanitær',
    belop: 95000,
    status: 'venter',
    dato: '2024-12-18',
    svarfrist: '2024-12-25'
  },
  {
    id: 'T003',
    kundenavn: 'Villa Solberg',
    prosjekt: 'Terrasse og uteplass',
    jobbtype: 'Utendørs',
    belop: 165000,
    status: 'vunnet',
    dato: '2024-12-10',
    svarfrist: '2024-12-22'
  },
  {
    id: 'T004',
    kundenavn: 'Andersen Eiendom',
    prosjekt: 'Oppussing av leilighet',
    jobbtype: 'Oppussing',
    belop: 325000,
    status: 'venter',
    dato: '2024-12-20',
    svarfrist: '2024-12-28'
  },
  {
    id: 'T005',
    kundenavn: 'Bergstøm Familie',
    prosjekt: 'Innebygde skap',
    jobbtype: 'Møbler/Innredning',
    belop: 85000,
    status: 'tapt',
    dato: '2024-12-05',
    svarfrist: '2024-12-15'
  },
  {
    id: 'T006',
    kundenavn: 'Moderne Hjem AS',
    prosjekt: 'Komplett tregulv',
    jobbtype: 'Gulv',
    belop: 145000,
    status: 'venter',
    dato: '2024-12-22',
    svarfrist: '2025-01-05'
  }
];

export const kundeData: Kunde[] = [
  {
    id: 'K001',
    navn: 'Olsen Familie',
    epost: 'post@olsenfamilie.no',
    telefon: '123 45 678',
    antallTilbud: 3,
    antallVunnet: 2,
    sistAktivitet: '2024-12-15',
    addresser: ['Storgata 123, 0101 Oslo'],
    tilbud: []
  },
  {
    id: 'K002',
    navn: 'Hansen Bygg AS',
    epost: 'kontakt@hansenbygg.no',
    telefon: '987 65 432',
    antallTilbud: 5,
    antallVunnet: 3,
    sistAktivitet: '2024-12-18',
    addresser: ['Industrigata 45, 2000 Lillestrøm'],
    tilbud: []
  },
  {
    id: 'K003',
    navn: 'Villa Solberg',
    epost: 'eier@villasolberg.no',
    telefon: '456 78 901',
    antallTilbud: 2,
    antallVunnet: 2,
    sistAktivitet: '2024-12-10',
    addresser: ['Solbergsveien 78, 1400 Ski'],
    tilbud: []
  },
  {
    id: 'K004',
    navn: 'Andersen Eiendom',
    epost: 'post@anderseneiendom.no',
    telefon: '234 56 789',
    antallTilbud: 4,
    antallVunnet: 1,
    sistAktivitet: '2024-12-20',
    addresser: ['Eiendomsveien 12, 3000 Drammen'],
    tilbud: []
  },
  {
    id: 'K005',
    navn: 'Bergstøm Familie',
    epost: 'familie@bergstom.no',
    telefon: '345 67 890',
    antallTilbud: 2,
    antallVunnet: 0,
    sistAktivitet: '2024-12-05',
    addresser: ['Bergveien 34, 1200 Oslo'],
    tilbud: []
  },
  {
    id: 'K006',
    navn: 'Moderne Hjem AS',
    epost: 'salg@modernehjem.no',
    telefon: '678 90 123',
    antallTilbud: 3,
    antallVunnet: 1,
    sistAktivitet: '2024-12-22',
    addresser: ['Modernveien 56, 4000 Stavanger'],
    tilbud: []
  }
];

export const jobbtypeAnalyse: JobbtypeAnalyse[] = [
  {
    jobbtype: 'Kjøkken',
    treffprosent: 72,
    antallTilbud: 18,
    antallVunnet: 13
  },
  {
    jobbtype: 'Bad/Sanitær',
    treffprosent: 65,
    antallTilbud: 23,
    antallVunnet: 15
  },
  {
    jobbtype: 'Utendørs',
    treffprosent: 58,
    antallTilbud: 12,
    antallVunnet: 7
  },
  {
    jobbtype: 'Oppussing',
    treffprosent: 71,
    antallTilbud: 14,
    antallVunnet: 10
  },
  {
    jobbtype: 'Møbler/Innredning',
    treffprosent: 45,
    antallTilbud: 11,
    antallVunnet: 5
  },
  {
    jobbtype: 'Gulv',
    treffprosent: 68,
    antallTilbud: 9,
    antallVunnet: 6
  }
];

export const inntektFordeling: InntektFordeling[] = [
  {
    jobbtype: 'Kjøkken',
    inntekt: 925000,
    prosent: 32.5,
    color: '#1A4314'
  },
  {
    jobbtype: 'Oppussing',
    inntekt: 685000,
    prosent: 24.1,
    color: '#2D5A21'
  },
  {
    jobbtype: 'Bad/Sanitær',
    inntekt: 485000,
    prosent: 17.0,
    color: '#A2E4B8'
  },
  {
    jobbtype: 'Utendørs',
    inntekt: 385000,
    prosent: 13.5,
    color: '#7DD3A0'
  },
  {
    jobbtype: 'Gulv',
    inntekt: 245000,
    prosent: 8.6,
    color: '#58C27D'
  },
  {
    jobbtype: 'Møbler/Innredning',
    inntekt: 125000,
    prosent: 4.4,
    color: '#3FB865'
  }
];

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
    href: '/analyse',
    label: 'Analyse',
    icon: 'BarChart3'
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

export const currentUser: User = {
  navn: 'caspernag',
  bedrift: 'Nag Snekkeri AS'
};