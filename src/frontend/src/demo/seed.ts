/**
 * Seed data for the demo. Every person and company here is invented; emails
 * use example.com. OCEAN scores are spread across all 8 archetypes so a new
 * visitor gets a mix of strong, middling and weak matches.
 */
import { determineArchetype } from '../lib/ember/agent';
import type { Row, Tables } from './store';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

type Ocean = [number, number, number, number, number];

interface SeedCompany {
  key: string;
  name: string;
  contact: string;
  industry: string;
  size: '1-10' | '11-50' | '51-200';
  location: string;
  description: string;
  values: string[];
  prefs: Ocean;
  archetype: string;
  roles: SeedRole[];
}

interface SeedRole {
  title: string;
  workStyle: 'remote' | 'hybrid' | 'onsite';
  salary: [number, number];
  description: string;
  requirements: string[];
  ranges: Partial<Record<'o' | 'c' | 'e' | 'a' | 'n', [number, number]>>;
}

const COMPANIES: SeedCompany[] = [
  {
    key: 'northwind',
    name: 'Northwind Robotics',
    contact: 'Maya Okafor',
    industry: 'Robotics',
    size: '51-200',
    location: 'Toronto, ON',
    description: 'Builds warehouse robots that work alongside people. Small teams own a subsystem end to end.',
    values: ['innovation', 'quality', 'autonomy', 'excellence'],
    prefs: [78, 72, 45, 55, 30],
    archetype: 'The Innovator',
    roles: [
      {
        title: 'Robotics Software Engineer',
        workStyle: 'hybrid',
        salary: [115000, 140000],
        description: 'Own motion planning for our picking arm, from simulation to the warehouse floor.',
        requirements: ['C++ or Rust', 'ROS experience', 'Comfort with ambiguity'],
        ranges: { o: [65, 95], c: [60, 90], n: [0, 45] },
      },
      {
        title: 'Hardware Test Lead',
        workStyle: 'onsite',
        salary: [95000, 115000],
        description: 'Design the test rigs that catch failures before customers do.',
        requirements: ['Test automation', 'Electronics bench skills'],
        ranges: { c: [75, 100], e: [20, 60] },
      },
    ],
  },
  {
    key: 'fernleaf',
    name: 'Fernleaf Health',
    contact: 'Daniel Reyes',
    industry: 'Digital Health',
    size: '11-50',
    location: 'Vancouver, BC',
    description: 'Care-coordination software for community clinics. Patient outcomes come before feature counts.',
    values: ['empathy', 'mission', 'collaboration', 'balance'],
    prefs: [55, 70, 60, 85, 25],
    archetype: 'The Nurturer',
    roles: [
      {
        title: 'Product Designer',
        workStyle: 'remote',
        salary: [90000, 110000],
        description: 'Shadow clinicians, then design the tools that give them their afternoons back.',
        requirements: ['Research-led design', 'Accessible UI', 'Figma'],
        ranges: { a: [70, 100], o: [50, 90] },
      },
      {
        title: 'Clinical Success Manager',
        workStyle: 'hybrid',
        salary: [75000, 90000],
        description: 'Be the person clinics call first, and turn what you hear into product priorities.',
        requirements: ['Healthcare background', 'Calm under pressure'],
        ranges: { a: [75, 100], e: [55, 95], n: [0, 35] },
      },
    ],
  },
  {
    key: 'brightline',
    name: 'Brightline Labs',
    contact: 'Priya Nair',
    industry: 'Developer Tools',
    size: '1-10',
    location: 'Remote (Canada)',
    description: 'Six people building a faster test runner. We ship daily and change our minds often.',
    values: ['speed', 'autonomy', 'growth', 'risk'],
    prefs: [85, 50, 55, 45, 35],
    archetype: 'The Visionary',
    roles: [
      {
        title: 'Founding Engineer',
        workStyle: 'remote',
        salary: [130000, 160000],
        description: 'Second engineer. You will touch the compiler, the website and the billing page in one week.',
        requirements: ['TypeScript', 'Shipped something people use'],
        ranges: { o: [70, 100], c: [30, 75] },
      },
      {
        title: 'Developer Advocate',
        workStyle: 'remote',
        salary: [100000, 125000],
        description: 'Write the tutorials, give the talks, and bring back what developers actually need.',
        requirements: ['Public writing or speaking', 'Hands-on coding'],
        ranges: { e: [65, 100], o: [65, 100] },
      },
    ],
  },
  {
    key: 'harbor',
    name: 'Harbor & Pine',
    contact: 'Elena Vasquez',
    industry: 'Fintech',
    size: '51-200',
    location: 'Montreal, QC',
    description: 'Payments infrastructure for credit unions. Careful, audited, and proud of boring uptime.',
    values: ['integrity', 'stability', 'quality', 'excellence'],
    prefs: [45, 88, 40, 60, 20],
    archetype: 'The Stabilizer',
    roles: [
      {
        title: 'Backend Engineer, Ledger',
        workStyle: 'hybrid',
        salary: [120000, 145000],
        description: 'Keep the double-entry ledger correct to the cent while volume doubles.',
        requirements: ['Go or Java', 'Postgres', 'Testing discipline'],
        ranges: { c: [75, 100], n: [0, 40] },
      },
      {
        title: 'Compliance Analyst',
        workStyle: 'onsite',
        salary: [80000, 95000],
        description: 'Translate regulation into checklists engineers can follow.',
        requirements: ['Attention to detail', 'Financial regulation'],
        ranges: { c: [80, 100], o: [20, 60] },
      },
    ],
  },
  {
    key: 'kestrel',
    name: 'Kestrel Studio',
    contact: 'Jonah Whitfield',
    industry: 'Design Agency',
    size: '11-50',
    location: 'Calgary, AB',
    description: 'Brand and product studio for climate startups. Loud critiques, kind people.',
    values: ['creativity', 'collaboration', 'diversity', 'innovation'],
    prefs: [90, 55, 70, 70, 40],
    archetype: 'The Collaborator',
    roles: [
      {
        title: 'Brand Designer',
        workStyle: 'hybrid',
        salary: [80000, 100000],
        description: 'Lead identity projects from first sketch to launch.',
        requirements: ['Portfolio', 'Typography', 'Client presentations'],
        ranges: { o: [75, 100], e: [50, 90] },
      },
      {
        title: 'Creative Producer',
        workStyle: 'onsite',
        salary: [75000, 90000],
        description: 'Keep five projects moving without killing the fun.',
        requirements: ['Project management', 'Client communication'],
        ranges: { c: [60, 90], e: [60, 100], a: [55, 95] },
      },
    ],
  },
  {
    key: 'tallgrass',
    name: 'Tallgrass Logistics',
    contact: 'Marcus Bell',
    industry: 'Logistics',
    size: '51-200',
    location: 'Winnipeg, MB',
    description: 'Freight routing for prairie carriers. Targets on the wall, wins rung on a bell.',
    values: ['impact', 'speed', 'customer', 'excellence'],
    prefs: [50, 80, 72, 50, 30],
    archetype: 'The Driver',
    roles: [
      {
        title: 'Operations Lead',
        workStyle: 'onsite',
        salary: [90000, 110000],
        description: 'Run the dispatch floor and cut empty miles quarter over quarter.',
        requirements: ['Operations leadership', 'Spreadsheet fluency'],
        ranges: { c: [70, 100], e: [60, 100] },
      },
      {
        title: 'Data Analyst',
        workStyle: 'hybrid',
        salary: [80000, 98000],
        description: 'Find the routes that lose money and prove it.',
        requirements: ['SQL', 'Python or R', 'Storytelling with data'],
        ranges: { c: [65, 100], o: [50, 85] },
      },
      {
        title: 'Account Executive',
        workStyle: 'hybrid',
        salary: [70000, 120000],
        description: 'Win carriers across Manitoba and Saskatchewan.',
        requirements: ['B2B sales', 'Travel up to 30%'],
        ranges: { e: [70, 100], n: [0, 40] },
      },
    ],
  },
];

interface SeedCandidate {
  name: string;
  headline: string;
  location: string;
  years: number;
  workStyle: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  size: 'startup' | 'small' | 'medium' | 'large' | 'any';
  ocean: Ocean;
  bio: string;
  hobbies: string[];
  traits: string[];
}

const CANDIDATES: SeedCandidate[] = [
  { name: 'Aisha Rahman', headline: 'Product Designer', location: 'Toronto, ON', years: 6, workStyle: 'hybrid', size: 'small', ocean: [88, 52, 58, 74, 32], bio: 'Designs for people who are tired. Former nurse.', hobbies: ['pottery', 'running'], traits: ['Curious Builder', 'Empathic Listener'] },
  { name: 'Theo Lindqvist', headline: 'Backend Engineer', location: 'Montreal, QC', years: 8, workStyle: 'onsite', size: 'medium', ocean: [48, 91, 30, 58, 18], bio: 'Writes the test first. Likes ledgers more than most people do.', hobbies: ['chess', 'bread'], traits: ['Steady Hand', 'Detail Keeper'] },
  { name: 'Sofia Marchetti', headline: 'Brand Designer', location: 'Calgary, AB', years: 5, workStyle: 'hybrid', size: 'small', ocean: [94, 46, 72, 68, 41], bio: 'Type nerd. Has opinions about kerning and will share them kindly.', hobbies: ['film photography', 'climbing'], traits: ['Bold Imaginer'] },
  { name: 'Kwame Asante', headline: 'Operations Manager', location: 'Winnipeg, MB', years: 10, workStyle: 'onsite', size: 'medium', ocean: [52, 84, 82, 48, 26], bio: 'Ran a dispatch floor of 40. Measures everything, celebrates loudly.', hobbies: ['curling', 'grilling'], traits: ['Momentum Maker'] },
  { name: 'Lena Park', headline: 'Developer Advocate', location: 'Vancouver, BC', years: 4, workStyle: 'remote', size: 'startup', ocean: [86, 55, 88, 62, 30], bio: 'Turns gnarly APIs into five-minute tutorials.', hobbies: ['podcasting', 'bouldering'], traits: ['Spark Plug', 'Bridge Builder'] },
  { name: 'Mateo Alvarez', headline: 'Full-Stack Engineer', location: 'Remote (Canada)', years: 3, workStyle: 'remote', size: 'startup', ocean: [82, 44, 50, 40, 36], bio: 'Shipped three side projects this year, finished two.', hobbies: ['synths', 'cycling'], traits: ['Restless Tinkerer'] },
  { name: 'Hannah Cho', headline: 'Clinical Success Manager', location: 'Vancouver, BC', years: 7, workStyle: 'hybrid', size: 'small', ocean: [58, 72, 74, 92, 20], bio: 'Ten years in clinics before software. Still answers the phone on the first ring.', hobbies: ['choir', 'gardening'], traits: ['Calm Anchor', 'Empathic Listener'] },
  { name: 'Ravi Menon', headline: 'Data Analyst', location: 'Toronto, ON', years: 5, workStyle: 'hybrid', size: 'medium', ocean: [70, 86, 38, 52, 28], bio: 'Finds the one chart that ends the meeting early.', hobbies: ['crosswords', 'cricket'], traits: ['Pattern Finder'] },
  { name: 'Chloe Tremblay', headline: 'Compliance Analyst', location: 'Montreal, QC', years: 6, workStyle: 'onsite', size: 'large', ocean: [36, 90, 28, 66, 22], bio: 'Reads regulations for fun so the engineers do not have to.', hobbies: ['knitting', 'birding'], traits: ['Detail Keeper'] },
  { name: 'Jordan Blake', headline: 'Account Executive', location: 'Regina, SK', years: 9, workStyle: 'flexible', size: 'any', ocean: [62, 58, 90, 44, 24], bio: 'Has driven every highway in Saskatchewan. Closes on handshakes.', hobbies: ['hockey', 'fishing'], traits: ['Momentum Maker'] },
  { name: 'Noor Haddad', headline: 'Robotics Engineer', location: 'Waterloo, ON', years: 4, workStyle: 'hybrid', size: 'medium', ocean: [84, 76, 42, 56, 30], bio: 'Builds robot arms by day and tiny ones on weekends.', hobbies: ['3D printing', 'robot soccer'], traits: ['Curious Builder', 'Pattern Finder'] },
  { name: 'Ben Archer', headline: 'Hardware Test Engineer', location: 'Toronto, ON', years: 11, workStyle: 'onsite', size: 'medium', ocean: [46, 88, 24, 50, 34], bio: 'If it can break, he has a rig that proves it.', hobbies: ['woodworking', 'ham radio'], traits: ['Steady Hand'] },
  { name: 'Isabel Moreau', headline: 'Creative Producer', location: 'Calgary, AB', years: 6, workStyle: 'flexible', size: 'small', ocean: [72, 68, 78, 80, 38], bio: 'Keeps five creative teams talking to each other.', hobbies: ['improv', 'cooking'], traits: ['Bridge Builder'] },
  { name: 'Samir Patel', headline: 'Product Manager', location: 'Ottawa, ON', years: 7, workStyle: 'hybrid', size: 'medium', ocean: [76, 82, 60, 60, 32], bio: 'Writes the one-pager before the roadmap. Plans three moves out.', hobbies: ['go', 'trail running'], traits: ['Long-Range Planner'] },
  { name: 'Grace Liu', headline: 'UX Researcher', location: 'Remote (Canada)', years: 5, workStyle: 'remote', size: 'small', ocean: [80, 62, 34, 86, 28], bio: 'Quiet in meetings, devastating in research readouts.', hobbies: ['watercolour', 'hiking'], traits: ['Empathic Listener', 'Curious Builder'] },
  { name: 'Owen MacLeod', headline: 'Site Reliability Engineer', location: 'Halifax, NS', years: 9, workStyle: 'remote', size: 'large', ocean: [54, 84, 36, 46, 14], bio: 'Sleeps through the pager because the runbooks work.', hobbies: ['sailing', 'homelab'], traits: ['Calm Anchor', 'Steady Hand'] },
];

const POST_CAPTIONS: { candidate: number; caption: string; tags: string[]; hue: number }[] = [
  { candidate: 0, caption: 'Third attempt at a teapot. The spout finally pours instead of dribbling.', tags: ['pottery', 'personality:Creative'], hue: 24 },
  { candidate: 2, caption: 'Shot a whole roll at the Stampede grounds before sunrise. Developing tonight.', tags: ['film photography'], hue: 280 },
  { candidate: 4, caption: 'New episode up: we debugged a flaky test live and it fought back.', tags: ['podcasting', 'personality:Social'], hue: 200 },
  { candidate: 6, caption: 'Choir concert this weekend. Altos carried, as usual.', tags: ['choir'], hue: 340 },
  { candidate: 10, caption: 'The weekend robot can now pick up a sock. Laundry folding is next.', tags: ['3D printing', 'personality:Builder'], hue: 160 },
  { candidate: 15, caption: 'Took the boat out past the lighthouse. No pages, no signal, perfect.', tags: ['sailing'], hue: 210 },
];

/** Inline SVG artwork so seeded posts need no image hosting. */
function artwork(hue: number, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 70% 72%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 45%)"/>
</linearGradient></defs>
<rect width="600" height="600" fill="url(#g)"/>
<circle cx="420" cy="190" r="120" fill="hsl(${hue} 90% 92% / 0.35)"/>
<circle cx="170" cy="430" r="170" fill="hsl(${(hue + 20) % 360} 80% 30% / 0.25)"/>
<text x="40" y="560" font-family="Georgia, serif" font-size="44" fill="white" fill-opacity="0.9">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
}

function rangeColumns(ranges: SeedRole['ranges']): Record<string, number | null> {
  const names = { o: 'openness', c: 'conscientiousness', e: 'extraversion', a: 'agreeableness', n: 'neuroticism' } as const;
  const out: Record<string, number | null> = {};
  for (const [short, trait] of Object.entries(names)) {
    const range = ranges[short as keyof typeof names];
    out[`required_${trait}_min`] = range ? range[0] : null;
    out[`required_${trait}_max`] = range ? range[1] : null;
  }
  return out;
}

export const SEED_IDS = {
  profile: (key: string) => `seed-profile-${key}`,
  employer: (key: string) => `seed-employer-${key}`,
  candidate: (index: number) => `seed-candidate-${index + 1}`,
};

export function isSeedUser(userId: unknown): boolean {
  return typeof userId === 'string' && userId.startsWith('seed-profile-');
}

export function buildSeed(): Tables {
  const profiles: Row[] = [];
  const employers: Row[] = [];
  const roles: Row[] = [];
  const candidates: Row[] = [];
  const posts: Row[] = [];

  COMPANIES.forEach((company, i) => {
    const profileId = SEED_IDS.profile(company.key);
    profiles.push({
      id: profileId,
      email: `${slug(company.contact)}@example.com`,
      full_name: company.contact,
      avatar_url: null,
      role: 'employer',
      onboarding_completed: true,
      created_at: ago(200 - i * 10),
    });
    const [o, c, e, a, n] = company.prefs;
    const employerId = SEED_IDS.employer(company.key);
    employers.push({
      id: employerId,
      user_id: profileId,
      company_name: company.name,
      company_website: null,
      company_logo_url: null,
      company_size: company.size,
      industry: company.industry,
      description: company.description,
      location: company.location,
      culture_values: company.values,
      openness_preference: o,
      conscientiousness_preference: c,
      extraversion_preference: e,
      agreeableness_preference: a,
      neuroticism_preference: n,
      archetype_name: company.archetype,
      culture_quiz_completed: true,
      setup_step: 4,
      created_at: ago(190 - i * 10),
      updated_at: ago(20),
    });
    company.roles.forEach((role, j) => {
      roles.push({
        id: `seed-role-${company.key}-${j + 1}`,
        employer_id: employerId,
        title: role.title,
        description: role.description,
        requirements: role.requirements,
        nice_to_have: [],
        location: company.location,
        work_style: role.workStyle,
        salary_min: role.salary[0],
        salary_max: role.salary[1],
        employment_type: 'full_time',
        status: 'active',
        ...rangeColumns(role.ranges),
        created_at: ago(60 - i * 5 - j),
      });
    });
  });

  CANDIDATES.forEach((person, i) => {
    const profileId = SEED_IDS.profile(`candidate-${i + 1}`);
    profiles.push({
      id: profileId,
      email: `${slug(person.name)}@example.com`,
      full_name: person.name,
      avatar_url: null,
      role: 'candidate',
      onboarding_completed: true,
      created_at: ago(150 - i * 5),
    });
    const [o, c, e, a, n] = person.ocean;
    candidates.push({
      id: SEED_IDS.candidate(i),
      user_id: profileId,
      headline: person.headline,
      bio: person.bio,
      location: person.location,
      years_experience: person.years,
      preferred_work_style: person.workStyle,
      preferred_company_size: person.size,
      openness_score: o,
      conscientiousness_score: c,
      extraversion_score: e,
      agreeableness_score: a,
      neuroticism_score: n,
      // Archetype first, as the real assessment saves it
      top_traits: [determineArchetype({ openness: o, conscientiousness: c, extraversion: e, agreeableness: a, neuroticism: n }).name, ...person.traits],
      hobbies: person.hobbies,
      catalog_photos: [],
      assessment_status: 'completed',
      assessment_completed_at: ago(40 - i),
      setup_step: 4,
      created_at: ago(140 - i * 5),
    });
  });

  POST_CAPTIONS.forEach((post, i) => {
    posts.push({
      id: `seed-post-${i + 1}`,
      user_id: SEED_IDS.profile(`candidate-${post.candidate + 1}`),
      image_url: artwork(post.hue, CANDIDATES[post.candidate].hobbies[0]),
      caption: post.caption,
      hobby_tags: post.tags,
      like_count: 3 + ((i * 7) % 19),
      created_at: ago(i * 1.5 + 0.2),
    });
  });

  return {
    profiles,
    employers,
    roles,
    candidates,
    activity_posts: posts,
    user_settings: [],
    connections: [],
    connection_meet_invites: [],
    coffee_chats: [],
    messages: [],
    saved_matches: [],
    assessments: [],
    assessment_responses: [],
    applications: [],
    post_likes: [],
    feedback: [],
  };
}
