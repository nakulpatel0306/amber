/**
 * True in the GitHub Pages build (VITE_DEMO=1). Vite inlines the value, so in a
 * normal build every demo branch is dead code and the demo modules drop out.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1';
