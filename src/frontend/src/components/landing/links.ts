import { IS_DEMO } from '../../demo/flag';

export const REPO_URL = 'https://github.com/nakulpatel0306/amber';

// The Pages build has the in-browser demo; a full-stack build signs up for real
export const DEMO_PATH = IS_DEMO ? '/demo' : '/auth/signup';

export const TEAM = [
  { name: 'Nakul Patel', github: 'nakulpatel0306' },
  { name: 'Arsh Patel', github: 'Arshpatel10' },
  { name: 'Neel', github: 'neelp04' },
];
