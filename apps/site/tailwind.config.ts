import type { Config } from 'tailwindcss';
import uiPreset from '@reset/ui/tailwind-preset';

const config: Config = {
  presets: [uiPreset as Config],
  content: ['./src/**/*.{ts,tsx,mdx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
