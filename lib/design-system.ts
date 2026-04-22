export const ghanaPalette = {
  green: '#006B3F',
  gold: '#FCD116',
  red: '#CE1126',
  dark: '#081A10',
  dark2: '#0D2818',
  cream: '#F8F4EC',
  paper: '#FFFDF8',
  ink: '#1A1A1A',
  muted: '#637068',
  light: '#E8E3D8',
}

export const layoutTokens = {
  container: '1120px',
  containerNarrow: '760px',
  sidebar: '240px',
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
}

export const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Oti',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
]

export const publicNav = [
  { label: 'Home', href: '/' },
  { label: 'Submit Input', href: '/submit' },
  { label: 'The Bill', href: '/bill' },
  { label: 'Statistics', href: '/stats' },
  { label: 'Admin', href: '/admin' },
]

export const secureNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Editor', href: '/admin/editor' },
  { label: 'Statistics', href: '/admin' },
  { label: 'Auth', href: '/admin' },
]

export const homeFeatures = [
  {
    title: 'Fight Corruption',
    description:
      'Public officers must explain assets that go beyond lawful income, making hidden wealth harder to defend.',
    tone: 'green',
  },
  {
    title: 'Citizen-Drafted',
    description:
      'Every clause is shaped by public input and translated into formal language through a transparent workflow.',
    tone: 'gold',
  },
  {
    title: 'Restore Trust',
    description:
      'The bill creates a visible accountability path that reconnects public service with the people it serves.',
    tone: 'red',
  },
]

export const workflowSteps = [
  {
    step: '01',
    title: 'Submit',
    description: 'Share ideas, clauses, and concerns in plain language without legal training.',
    tone: 'green',
  },
  {
    step: '02',
    title: 'Cluster',
    description: 'Similar submissions are grouped so common priorities emerge clearly.',
    tone: 'gold',
  },
  {
    step: '03',
    title: 'Draft',
    description: 'Legal editors turn clusters into a disciplined, bill-ready structure.',
    tone: 'red',
  },
  {
    step: '04',
    title: 'Publish',
    description: 'The final draft is prepared for presentation and public review.',
    tone: 'dark',
  },
]

export const dashboardMetrics = [
  { label: 'Total Submissions', value: '3,847', delta: '+312 this week', tone: 'green' },
  { label: 'Regions Active', value: '16', delta: 'all regions represented', tone: 'gold' },
  { label: 'Themes Identified', value: '12', delta: 'AI clustering complete', tone: 'red' },
  { label: 'Clauses Drafted', value: '7', delta: 'ready for publication', tone: 'dark' },
]

export const dashboardActivity = [
  {
    title: 'Approve submissions before clustering',
    meta: '47 items in review',
    status: 'pending',
  },
  {
    title: 'Run the latest thematic clustering pass',
    meta: '1,847 approved inputs queued',
    status: 'processing',
  },
  {
    title: 'Publish clause revisions',
    meta: '7 clauses awaiting sign-off',
    status: 'ready',
  },
]

export const editorSections = [
  'Preamble',
  'Definitions',
  'Asset Declaration',
  'Reverse Burden',
  'Investigations',
  'Fair Hearing',
  'Confiscation',
  'Protection',
]

export const settingsGroups = [
  {
    title: 'Profile',
    description: 'Update your name, email, and organization information.',
  },
  {
    title: 'Appearance',
    description: 'Tune density, font scale, and visual emphasis.',
  },
  {
    title: 'Notifications',
    description: 'Choose which platform events should reach you.',
  },
  {
    title: 'Privacy',
    description: 'Control how much of your activity is visible to collaborators.',
  },
]

export const authHighlights = [
  'Civic workflow ready',
  'Role-based access',
  'Localized Ghanaian identity',
  'Responsive on every screen',
]
