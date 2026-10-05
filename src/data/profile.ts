/**
 * Everything about you that is not a game.
 *
 * This lives in code rather than the database on purpose: it changes once or
 * twice a year, and keeping it here means the About and Experience sections
 * render instantly with no network round-trip. Move it to Supabase later if
 * you decide you want to edit it from /admin too.
 */

export const profile = {
  name: 'Zain Ul Abideen',
  role: 'Gameplay Programmer',
  location: 'Islamabad, PK',
  engine: 'Unity',

  headline: 'I build the feel of mobile games.',

  intro:
    'Five years of shipping hyper-casual and casual titles — player controllers, NPC behaviour trees, merge and idle economies — then profiling them until they hold a stable frame on a four-year-old Android. Everything below is running footage from a build I worked on.',

  stats: [
    { value: '16', label: 'Titles shipped' },
    { value: '40+', label: 'Prototypes built' },
    { value: '5 yrs', label: 'In production' },
    { value: 'Unity / C#', label: 'Primary stack' },
  ],

  links: {
    email: 'mailto:xainulabideen600@gmail.com',
    github: 'https://github.com/Zain-IIU',
    linkedin: '#',
    cv: '/ZainUlAbideen-Resume.pdf',
  },
}

/**
 * The "What I do" block beside the journey timeline. Four is the right number:
 * it fills the two-by-two grid with no gap, and more than four stops reading
 * as a summary.
 */
export const capabilities = [
  { title: 'Gameplay systems', body: 'Core mechanics, game loops, player progression and merge economies.' },
  { title: 'AI behaviour', body: 'NPC behaviour trees, pathing, and the tuning that makes them read as intentional.' },
  { title: 'Performance', body: 'Deep profiling for memory and stable frame times on low-end Android.' },
  { title: 'Live ops', body: 'Ad and analytics SDKs, Firebase A/B tests balanced against retention KPIs.' },
]

export interface Role {
  when: string
  title: string
  where: string
  note: string
}

export const experience: Role[] = [
  {
    when: 'Nov 2023 → now',
    title: 'Software Engineer',
    where: 'Game District, Lahore',
    note: 'Full product lifecycle work: complex mechanics and AI behaviour, deep profiling for memory and frame stability, ad & analytics SDKs, Firebase A/B tests balanced against KPIs.',
  },
  {
    when: 'Aug 2022 → Oct 2023',
    title: 'Game Developer',
    where: 'SnackGamer, Remote',
    note: 'Player controllers written from scratch, third-party API and plugin integration, NPC behaviour trees, and design work on a full title.',
  },
  {
    when: 'May 2022 → Aug 2022',
    title: 'Game Developer',
    where: 'Metal Games — contract for Voodoo',
    note: "Rapid ideation against Voodoo's publishing bar; branched out of hyper-casual into io, puzzle and simulation loops.",
  },
  {
    when: 'Oct 2021 → May 2022',
    title: 'Associate Game Developer',
    where: 'M.A.S Games — work for Rollic',
    note: 'A new prototype most weeks, each with a distinct core mechanic, tested for marketability before any polish went in.',
  },
  {
    when: 'Jul 2021 → Aug 2021',
    title: 'Game Programmer Fellow',
    where: 'Mindstorm Studios, Remote',
    note: 'Third place, Rookie Game Jam 2021. First exposure to how hyper-casual titles actually get marketed and published.',
  },
]

export interface Education {
  when: string
  what: string
  where: string
  note: string
}

export const education: Education[] = [
  {
    when: '2019 → 2023',
    what: 'BS Computer Science',
    where: 'International Islamic University, Islamabad',
    note: 'Graduated with an A grade. Public Relations Lead at GDSC, full-fee waiver scholarship awardee.',
  },
]
