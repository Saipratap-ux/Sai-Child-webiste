export interface ColoringPage {
  id: string;
  pageNumber: number;
  pageType: 'cover' | 'story' | 'certificate';
  title: string;
  storyCaption: string;
  imagePrompt: string;
  imageDataUrl: string;
  userDrawingDataUrl?: string;
}

export interface ColoringBook {
  id: string;
  bookTitle: string;
  childName: string;
  theme: string;
  ageGroup: 'toddler' | 'early' | 'big-kid';
  dedication: string;
  coverColor: string;
  pages: ColoringPage[];
  createdAt: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  defaultTitle: string;
  coverColor: string;
  samplePrompt: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'dinosaur',
    name: 'Dino Safari Adventure',
    emoji: '🦕',
    description: 'Friendly dinosaurs, volcanic valleys, and cute prehistoric hatchlings.',
    defaultTitle: 'Dino Safari Adventures',
    coverColor: '#10b981',
    samplePrompt: 'a cute cartoon baby triceratops playing with flowers, thick outlines, coloring page',
  },
  {
    id: 'space',
    name: 'Cosmic Space Odyssey',
    emoji: '🚀',
    description: 'Rockets, gentle alien buddies, orbiting planets, and starry galaxies.',
    defaultTitle: 'Journey to the Stars',
    coverColor: '#6366f1',
    samplePrompt: 'a friendly astronaut puppy floating outside a spaceship, thick black lines, coloring page',
  },
  {
    id: 'fairytale',
    name: 'Enchanted Fairy Forest',
    emoji: '🦄',
    description: 'Sparkly unicorns, mushroom cottages, and friendly woodland fairies.',
    defaultTitle: 'The Magic Enchanted Woods',
    coverColor: '#ec4899',
    samplePrompt: 'a cute baby unicorn sleeping under a rainbow tree with butterflies, coloring page',
  },
  {
    id: 'underwater',
    name: 'Deep Sea Coral Reef',
    emoji: '🌊',
    description: 'Playful baby dolphins, treasure chests, and friendly sea turtles.',
    defaultTitle: 'Ocean Wonders & Secret Treasures',
    coverColor: '#0ea5e9',
    samplePrompt: 'a happy little octopus wearing a pirate hat opening a treasure box, coloring page',
  },
  {
    id: 'safari',
    name: 'Jungle Animal Pals',
    emoji: '🦁',
    description: 'Smiling lions, baby elephants, playful monkeys, and tall giraffes.',
    defaultTitle: 'Wild Safari Expedition',
    coverColor: '#f59e0b',
    samplePrompt: 'a baby lion cub and baby elephant playing peek-a-boo in the savanna, coloring book',
  },
];

// Helper to generate SVG data URLs with crisp vector strokes
export function makeSvgPage(title: string, innerSvg: string, captionText?: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCaption = (captionText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <!-- White background -->
    <rect width="800" height="1000" fill="#ffffff"/>
    
    <!-- Outer decorative frame with rounded corners -->
    <rect x="30" y="30" width="740" height="940" rx="28" fill="none" stroke="#0f172a" stroke-width="6"/>
    <rect x="44" y="44" width="712" height="912" rx="20" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="14 10"/>
    
    <!-- Corner stars -->
    <polygon points="65,65 69,76 81,76 71,83 75,94 65,87 55,94 59,83 49,76 61,76" fill="#0f172a"/>
    <polygon points="735,65 739,76 751,76 741,83 745,94 735,87 725,94 729,83 719,76 731,76" fill="#0f172a"/>
    <polygon points="65,935 69,946 81,946 71,953 75,964 65,957 55,964 59,953 49,946 61,946" fill="#0f172a"/>
    <polygon points="735,935 739,946 751,946 741,953 745,964 735,957 725,964 729,953 719,946 731,946" fill="#0f172a"/>

    <!-- Header Banner -->
    <g transform="translate(400, 100)">
      <rect x="-240" y="-32" width="480" height="56" rx="28" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>
      <text x="0" y="6" text-anchor="middle" font-family="'Fredoka', system-ui, sans-serif" font-weight="700" font-size="24" fill="#0f172a">${safeTitle}</text>
    </g>

    <!-- Main Art Area -->
    <g transform="translate(0, 40)">
      ${innerSvg}
    </g>

    <!-- Bottom Caption Box -->
    ${safeCaption ? `
    <g transform="translate(400, 905)">
      <rect x="-310" y="-35" width="620" height="55" rx="16" fill="#fffbeb" stroke="#0f172a" stroke-width="4"/>
      <text x="0" y="0" text-anchor="middle" font-family="'Nunito', system-ui, sans-serif" font-weight="700" font-size="17" fill="#0f172a">${safeCaption}</text>
    </g>
    ` : ''}
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Generate complete 5-page initial book for any preset
export function createDefaultBook(childName = 'Maya', themeId = 'dinosaur', dedication = ''): ColoringBook {
  const preset = THEME_PRESETS.find(p => p.id === themeId) || THEME_PRESETS[0];
  const name = childName.trim() || 'Maya';
  const customDedication = dedication || `Made with lots of love for ${name}, our greatest little artist! Keep shining and coloring the world with bright joy.`;

  let pages: ColoringPage[] = [];

  if (themeId === 'space') {
    pages = [
      {
        id: 'page-1',
        pageNumber: 1,
        pageType: 'cover',
        title: `${name}'s Cosmic Space Book`,
        storyCaption: `Official Cover Page: Designed for Explorer ${name}!`,
        imagePrompt: 'A brave astronaut standing proudly on the Moon holding an explorer flag',
        imageDataUrl: makeSvgPage(`${name}'s Space Book`, `
          <!-- Space Cover Scene -->
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Rocket -->
            <path d="M 400 240 C 460 350 470 520 450 630 L 350 630 C 330 520 340 350 400 240 Z" stroke-width="12" fill="#ffffff"/>
            <!-- Rocket Window -->
            <circle cx="400" cy="400" r="48" stroke-width="10" fill="#ffffff"/>
            <circle cx="400" cy="400" r="32" stroke-width="6"/>
            <!-- Rocket Fins -->
            <path d="M 348 540 L 250 640 L 348 625" stroke-width="10"/>
            <path d="M 452 540 L 550 640 L 452 625" stroke-width="10"/>
            <!-- Thrust Clouds -->
            <path d="M 360 640 Q 400 780 400 800 Q 400 780 440 640" stroke-width="9"/>
            <path d="M 320 730 Q 280 770 340 810" stroke-width="6"/>
            <path d="M 480 730 Q 520 770 460 810" stroke-width="6"/>
            <!-- Saturn -->
            <circle cx="190" cy="320" r="60" stroke-width="8"/>
            <ellipse cx="190" cy="320" rx="100" ry="24" stroke-width="7"/>
            <!-- Cute Smiling Moon -->
            <path d="M 600 280 A 65 65 0 1 1 540 400 A 50 50 0 1 0 600 280 Z" stroke-width="8"/>
            <circle cx="560" cy="340" r="5" fill="#0f172a"/>
            <!-- Twinkling Stars -->
            <polygon points="260,200 266,218 285,218 270,229 276,247 260,236 244,247 250,229 235,218 254,218" stroke-width="6"/>
            <polygon points="630,500 634,514 649,514 637,522 642,536 630,527 618,536 623,522 611,514 626,514" stroke-width="5"/>
          </g>
        `, `Blast off on an interstellar journey with ${name}!`),
      },
      {
        id: 'page-2',
        pageNumber: 2,
        pageType: 'story',
        title: 'Mission Launch!',
        storyCaption: `3... 2... 1... Blast off! The silver rocket soared above the puffy clouds and into the starry night sky.`,
        imagePrompt: 'A rocket shooting past giant fluffy clouds with smiling stars',
        imageDataUrl: makeSvgPage('Mission Launch!', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Cloud base -->
            <path d="M 150 720 Q 220 620 320 680 Q 420 580 520 660 Q 640 600 700 720" stroke-width="10"/>
            <path d="M 120 740 Q 260 760 380 740 Q 510 770 680 730" stroke-width="6"/>
            <!-- Rocket angled -->
            <g transform="translate(400, 420) rotate(-25)">
              <path d="M 0 -180 C 45 -80 50 60 40 160 L -40 160 C -50 60 -45 -80 0 -180 Z" stroke-width="10" fill="#ffffff"/>
              <circle cx="0" cy="-10" r="32" stroke-width="8" fill="#ffffff"/>
              <!-- Flame -->
              <path d="M -25 165 Q 0 260 0 290 Q 0 260 25 165" stroke-width="9"/>
            </g>
            <!-- Planet with rings -->
            <circle cx="620" cy="240" r="45" stroke-width="7"/>
            <ellipse cx="620" cy="240" rx="75" ry="18" stroke-width="6"/>
            <!-- Shooting star -->
            <polygon points="200,240 205,255 221,255 208,264 213,279 200,270 187,279 192,264 179,255 195,255" stroke-width="6"/>
            <line x1="220" y1="240" x2="310" y2="200" stroke-width="5" stroke-dasharray="10 8"/>
            <line x1="225" y1="260" x2="320" y2="225" stroke-width="5" stroke-dasharray="10 8"/>
          </g>
        `, `Color the rocket's fire trail bright orange, yellow, and red!`),
      },
      {
        id: 'page-3',
        pageNumber: 3,
        pageType: 'story',
        title: 'Meeting Cosmo the Alien',
        storyCaption: `On a glowing purple moon, ${name} met Cosmo, a friendly little extraterrestrial with 3 eyes who loves dancing.`,
        imagePrompt: 'A cute friendly alien with antenna and three joyful eyes dancing',
        imageDataUrl: makeSvgPage('Meeting Cosmo the Alien', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Moon surface with craters -->
            <path d="M 80 730 Q 400 660 720 730" stroke-width="10"/>
            <ellipse cx="220" cy="740" rx="45" ry="16" stroke-width="6"/>
            <ellipse cx="580" cy="720" rx="55" ry="18" stroke-width="6"/>
            <!-- Alien Body -->
            <path d="M 330 630 C 310 490 350 420 400 420 C 450 420 490 490 470 630 Z" stroke-width="10" fill="#ffffff"/>
            <!-- 3 Eyes -->
            <circle cx="360" cy="460" r="18" stroke-width="6" fill="#ffffff"/>
            <circle cx="360" cy="460" r="7" fill="#0f172a"/>
            <circle cx="400" cy="445" r="20" stroke-width="6" fill="#ffffff"/>
            <circle cx="400" cy="445" r="8" fill="#0f172a"/>
            <circle cx="440" cy="460" r="18" stroke-width="6" fill="#ffffff"/>
            <circle cx="440" cy="460" r="7" fill="#0f172a"/>
            <!-- Big Smile -->
            <path d="M 370 510 Q 400 540 430 510" stroke-width="7"/>
            <!-- Antenna -->
            <path d="M 400 420 L 400 350" stroke-width="7"/>
            <circle cx="400" cy="340" r="16" stroke-width="7"/>
            <!-- Waving arms -->
            <path d="M 335 520 Q 270 480 270 440" stroke-width="8"/>
            <path d="M 465 520 Q 530 540 550 500" stroke-width="8"/>
            <!-- Floating balloons or space spheres -->
            <circle cx="210" cy="380" r="28" stroke-width="6"/>
            <circle cx="600" cy="370" r="34" stroke-width="6"/>
          </g>
        `, `Cosmo says: "Beep boop! Give me rainbow spots and green antennas!"`),
      },
      {
        id: 'page-4',
        pageNumber: 4,
        pageType: 'story',
        title: 'The Great Space Walk',
        storyCaption: `Float, float, hooray! Connected by a sparkling safety cord, ${name} caught a shining constellation star.`,
        imagePrompt: 'A child astronaut in a puffy space suit catching a glowing star',
        imageDataUrl: makeSvgPage('The Great Space Walk', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Astronaut Helmet -->
            <circle cx="400" cy="360" r="75" stroke-width="10" fill="#ffffff"/>
            <ellipse cx="400" cy="365" rx="52" ry="40" stroke-width="7"/>
            <!-- Smiling Face Inside -->
            <circle cx="380" cy="360" r="6" fill="#0f172a"/>
            <circle cx="420" cy="360" r="6" fill="#0f172a"/>
            <path d="M 390 380 Q 400 395 410 380" stroke-width="5"/>
            <!-- Astronaut Suit Body -->
            <path d="M 345 440 L 325 580 L 475 580 L 455 440 Z" stroke-width="9"/>
            <!-- Chest control pack -->
            <rect x="365" y="460" width="70" height="50" rx="8" stroke-width="6"/>
            <circle cx="385" cy="485" r="7" stroke-width="4"/>
            <circle cx="415" cy="485" r="7" stroke-width="4"/>
            <!-- Waving arms & holding star -->
            <path d="M 335 460 Q 260 480 230 420" stroke-width="9"/>
            <path d="M 465 460 Q 540 440 570 380" stroke-width="9"/>
            <!-- Star held in hand -->
            <polygon points="585,340 592,358 612,358 596,369 602,387 585,376 568,387 574,369 558,358 578,358" stroke-width="7" fill="#ffffff"/>
            <!-- Legs floating -->
            <path d="M 360 580 L 340 700 L 310 710" stroke-width="9"/>
            <path d="M 440 580 L 470 690 L 500 705" stroke-width="9"/>
            <!-- Curly tether cord -->
            <path d="M 325 510 Q 250 560 210 500 Q 170 440 120 490" stroke-width="6" stroke-dasharray="8 6"/>
          </g>
        `, `You are floating in zero gravity! Pick your favorite cosmic colors.`),
      },
      {
        id: 'page-5',
        pageNumber: 5,
        pageType: 'certificate',
        title: 'Master Space Explorer Certificate',
        storyCaption: `Official Award: Presented to ${name} for coloring the cosmos with imagination and bravery!`,
        imagePrompt: 'A big celebration trophy with starry ribbon and certificate award banner',
        imageDataUrl: makeSvgPage('Master Space Explorer Certificate', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Grand Trophy Cup -->
            <path d="M 300 300 L 500 300 L 480 470 Q 400 550 320 470 Z" stroke-width="12" fill="#ffffff"/>
            <!-- Trophy Handles -->
            <path d="M 300 330 C 200 330 200 450 325 450" stroke-width="9"/>
            <path d="M 500 330 C 600 330 600 450 475 450" stroke-width="9"/>
            <!-- Trophy Stem & Pedestal -->
            <rect x="375" y="525" width="50" height="75" stroke-width="8" fill="#ffffff"/>
            <polygon points="310,600 490,600 520,680 280,680" stroke-width="10" fill="#ffffff"/>
            <!-- Pedestal Plate -->
            <rect x="320" y="620" width="160" height="42" rx="8" stroke-width="5"/>
            <!-- Big Star inside Cup -->
            <polygon points="400,340 409,365 435,365 414,380 422,405 400,390 378,405 386,380 365,365 391,365" stroke-width="7" fill="#ffffff"/>
            <!-- Celebration Ribbons & Confetti -->
            <path d="M 220 250 Q 250 200 200 170" stroke-width="6"/>
            <path d="M 580 250 Q 550 200 600 170" stroke-width="6"/>
            <circle cx="210" cy="540" r="14" stroke-width="5"/>
            <circle cx="590" cy="540" r="14" stroke-width="5"/>
            <polygon points="260,600 270,620 290,620 275,632 280,650 260,640" stroke-width="4"/>
            <polygon points="540,600 550,620 570,620 555,632 560,650 540,640" stroke-width="4"/>
          </g>
        `, `Signed by: The Commander of Galactic Creativity!`),
      },
    ];
  } else {
    // Default Dinosaur Adventure
    pages = [
      {
        id: 'page-1',
        pageNumber: 1,
        pageType: 'cover',
        title: `${name}'s Dino Safari`,
        storyCaption: `Official Cover Page: Specially handcrafted for ${name}!`,
        imagePrompt: 'A friendly giant Brontosaurus smiling warmly next to a decorated safari banner',
        imageDataUrl: makeSvgPage(`${name}'s Dino Safari`, `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Giant Brontosaurus -->
            <!-- Long friendly neck & head -->
            <path d="M 330 650 Q 300 480 340 320 Q 360 220 440 220 Q 520 220 500 300 Q 480 330 420 330 Q 390 440 450 650" stroke-width="11" fill="#ffffff"/>
            <!-- Smile & Big Eye -->
            <circle cx="465" cy="265" r="16" stroke-width="6" fill="#ffffff"/>
            <circle cx="470" cy="262" r="7" fill="#0f172a"/>
            <path d="M 480 295 Q 460 310 440 295" stroke-width="6"/>
            <!-- Nostril -->
            <circle cx="492" cy="275" r="4" fill="#0f172a"/>
            <!-- Big rounded body -->
            <path d="M 280 650 Q 200 680 180 770 L 620 770 Q 580 650 440 650" stroke-width="10"/>
            <!-- Sturdy legs -->
            <rect x="230" y="750" width="70" height="90" rx="15" stroke-width="9" fill="#ffffff"/>
            <rect x="360" y="750" width="70" height="90" rx="15" stroke-width="9" fill="#ffffff"/>
            <rect x="490" y="750" width="70" height="90" rx="15" stroke-width="9" fill="#ffffff"/>
            <!-- Spots on back -->
            <circle cx="360" cy="400" r="14" stroke-width="5"/>
            <circle cx="370" cy="480" r="18" stroke-width="5"/>
            <circle cx="320" cy="680" r="22" stroke-width="6"/>
            <circle cx="450" cy="690" r="26" stroke-width="6"/>
            <!-- Gentle Prehistoric Palm Tree -->
            <path d="M 680 820 Q 660 620 700 480" stroke-width="11"/>
            <path d="M 700 480 Q 640 420 570 450" stroke-width="8"/>
            <path d="M 700 480 Q 730 400 780 430" stroke-width="8"/>
            <path d="M 700 480 Q 680 390 620 400" stroke-width="8"/>
            <!-- Volcano in distance -->
            <polygon points="120,440 170,360 210,360 260,440" stroke-width="7"/>
            <path d="M 175 360 Q 190 330 205 360" stroke-width="5" stroke-dasharray="6 6"/>
          </g>
        `, `Welcome to the magical prehistoric kingdom of ${name}!`),
      },
      {
        id: 'page-2',
        pageNumber: 2,
        pageType: 'story',
        title: 'The Great Golden Egg',
        storyCaption: `While wandering near the whispering fern grove, ${name} stumbled upon an enormous spotted egg starting to crack!`,
        imagePrompt: 'A cracked dinosaur egg with a curious baby dino peeking out happily',
        imageDataUrl: makeSvgPage('The Great Golden Egg', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Nest of leaves -->
            <ellipse cx="400" cy="720" rx="260" ry="60" stroke-width="9" fill="#ffffff"/>
            <path d="M 180 730 Q 220 680 280 720" stroke-width="6"/>
            <path d="M 520 720 Q 580 670 630 730" stroke-width="6"/>
            <!-- Bottom half of cracked egg -->
            <path d="M 270 540 Q 260 680 400 700 Q 540 680 530 540 L 490 560 L 450 530 L 410 560 L 370 530 L 330 560 Z" stroke-width="10" fill="#ffffff"/>
            <!-- Baby Dino popping out -->
            <circle cx="400" cy="400" r="85" stroke-width="10" fill="#ffffff"/>
            <!-- Big curious eyes -->
            <circle cx="365" cy="385" r="22" stroke-width="6" fill="#ffffff"/>
            <circle cx="370" cy="382" r="9" fill="#0f172a"/>
            <circle cx="435" cy="385" r="22" stroke-width="6" fill="#ffffff"/>
            <circle cx="430" cy="382" r="9" fill="#0f172a"/>
            <!-- Cute snout & smile -->
            <path d="M 375 430 Q 400 455 425 430" stroke-width="6"/>
            <!-- Tiny hands on egg shell -->
            <ellipse cx="320" cy="545" rx="18" ry="14" stroke-width="6" fill="#ffffff"/>
            <ellipse cx="480" cy="545" rx="18" ry="14" stroke-width="6" fill="#ffffff"/>
            <!-- Top eggshell piece on head like a hat -->
            <path d="M 340 330 L 370 350 L 400 320 L 430 350 L 460 330 Q 400 240 340 330 Z" stroke-width="8" fill="#ffffff"/>
            <!-- Spots on egg -->
            <circle cx="340" cy="620" r="18" stroke-width="6"/>
            <circle cx="440" cy="635" r="22" stroke-width="6"/>
            <circle cx="400" cy="590" r="15" stroke-width="5"/>
          </g>
        `, `Pop! Out popped Baby Sprout! Color the shell with your wildest patterns!`),
      },
      {
        id: 'page-3',
        pageNumber: 3,
        pageType: 'story',
        title: 'Dancing Under the Volcano',
        storyCaption: `Baby Sprout grabbed a bunch of sweet berries and started a jolly dino dance party right beneath the bubbling volcano!`,
        imagePrompt: 'A dancing dinosaur tapping its feet with flying musical notes and flowers',
        imageDataUrl: makeSvgPage('Dancing Under the Volcano', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Grassy Meadow -->
            <path d="M 80 740 Q 400 680 720 740" stroke-width="9"/>
            <!-- Happy Dancing Dino -->
            <circle cx="400" cy="360" r="80" stroke-width="10" fill="#ffffff"/>
            <!-- Dino Spikes -->
            <polygon points="370,285 385,250 400,282" stroke-width="6"/>
            <polygon points="410,282 425,250 440,285" stroke-width="6"/>
            <!-- Eyes & Cheerful Smile -->
            <circle cx="370" cy="355" r="15" stroke-width="5" fill="#ffffff"/>
            <circle cx="372" cy="353" r="6" fill="#0f172a"/>
            <circle cx="430" cy="355" r="15" stroke-width="5" fill="#ffffff"/>
            <circle cx="428" cy="353" r="6" fill="#0f172a"/>
            <!-- Open laughing mouth -->
            <path d="M 360 395 Q 400 440 440 395 Z" stroke-width="6" fill="#ffffff"/>
            <!-- Body tilted in dance -->
            <path d="M 330 435 Q 310 570 380 620 L 450 620 Q 490 570 470 435" stroke-width="9" fill="#ffffff"/>
            <!-- Dancing feet -->
            <ellipse cx="340" cy="650" rx="36" ry="24" stroke-width="8" fill="#ffffff"/>
            <ellipse cx="480" cy="625" rx="36" ry="24" transform="rotate(-20 480 625)" stroke-width="8" fill="#ffffff"/>
            <!-- Arms waving with maracas/flowers -->
            <path d="M 330 480 Q 250 450 240 400" stroke-width="8"/>
            <path d="M 470 480 Q 550 450 560 400" stroke-width="8"/>
            <circle cx="235" cy="390" r="18" stroke-width="6"/>
            <circle cx="565" cy="390" r="18" stroke-width="6"/>
            <!-- Flying musical notes -->
            <circle cx="200" cy="270" r="14" fill="#0f172a"/>
            <path d="M 214 270 L 214 220 L 250 210 L 250 260" stroke-width="6"/>
            <circle cx="250" cy="260" r="14" fill="#0f172a"/>
            <circle cx="580" cy="280" r="14" fill="#0f172a"/>
            <path d="M 594 280 L 594 230" stroke-width="6"/>
          </g>
        `, `Stomp! Clap! Roar! Dance along with ${name}'s prehistoric playlist!`),
      },
      {
        id: 'page-4',
        pageNumber: 4,
        pageType: 'story',
        title: 'Flying with Pip the Pterodactyl',
        storyCaption: `High into the twilight sunset, Pip the Pterodactyl gave ${name} a magnificent tour over the crystal waterfalls.`,
        imagePrompt: 'A friendly flying Pterodactyl soaring over waterfalls and prehistoric mountains',
        imageDataUrl: makeSvgPage('Flying with Pip the Pterodactyl', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Pterodactyl Body & Wings -->
            <g transform="translate(400, 380)">
              <!-- Wings spread wide -->
              <path d="M 0 -20 Q -180 -120 -320 -60 Q -240 40 -120 40 L 0 20 L 120 40 Q 240 40 320 -60 Q 180 -120 0 -20 Z" stroke-width="11" fill="#ffffff"/>
              <!-- Head with crest -->
              <path d="M 0 -20 L 0 -110 Q 50 -160 30 -80 L 40 -50 Z" stroke-width="8" fill="#ffffff"/>
              <!-- Long beak -->
              <polygon points="0,-70 70,-60 10,-50" stroke-width="6" fill="#ffffff"/>
              <circle cx="5" cy="-70" r="6" fill="#0f172a"/>
              <!-- Body -->
              <ellipse cx="0" cy="30" rx="35" ry="55" stroke-width="8" fill="#ffffff"/>
              <!-- Cute Feet -->
              <path d="M -15 80 L -25 110" stroke-width="6"/>
              <path d="M 15 80 L 25 110" stroke-width="6"/>
            </g>
            <!-- Waterfalls below -->
            <polygon points="120,780 240,580 320,580 360,780" stroke-width="7"/>
            <polygon points="460,780 500,600 580,600 680,780" stroke-width="7"/>
            <!-- Waterfall spray -->
            <line x1="280" y1="600" x2="280" y2="760" stroke-width="5" stroke-dasharray="12 10"/>
            <line x1="540" y1="620" x2="540" y2="760" stroke-width="5" stroke-dasharray="12 10"/>
            <!-- Fluffy clouds -->
            <ellipse cx="180" cy="240" rx="60" ry="24" stroke-width="6"/>
            <ellipse cx="620" cy="220" rx="70" ry="28" stroke-width="6"/>
          </g>
        `, `Soar high into the sky! Color the waterfall crystalline turquoise.`),
      },
      {
        id: 'page-5',
        pageNumber: 5,
        pageType: 'certificate',
        title: 'Master Dino Colorist Certificate',
        storyCaption: `Official Award: Bestowed upon ${name} for courage, creative wonder, and coloring mastery!`,
        imagePrompt: 'A big glorious dinosaur award ribbon and golden trophy cup with confetti',
        imageDataUrl: makeSvgPage('Master Dino Colorist Certificate', `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Grand Dino Trophy -->
            <path d="M 290 320 L 510 320 L 485 500 Q 400 570 315 500 Z" stroke-width="12" fill="#ffffff"/>
            <!-- Dino Tail Handle -->
            <path d="M 290 340 C 180 340 190 480 315 480" stroke-width="9"/>
            <path d="M 510 340 C 620 340 610 480 485 480" stroke-width="9"/>
            <!-- Trophy Base -->
            <rect x="375" y="550" width="50" height="70" stroke-width="8" fill="#ffffff"/>
            <polygon points="300,620 500,620 530,710 270,710" stroke-width="10" fill="#ffffff"/>
            <!-- Cute Dinosaur Silhouette Badge in Center -->
            <circle cx="400" cy="410" r="45" stroke-width="6" fill="#ffffff"/>
            <polygon points="400,375 407,395 428,395 411,407 417,427 400,415 383,427 389,407 372,395 393,395" stroke-width="5" fill="#0f172a"/>
            <!-- Plaque Text -->
            <rect x="320" y="640" width="160" height="45" rx="8" stroke-width="5"/>
            <!-- Balloons & Ribbons -->
            <ellipse cx="200" cy="260" rx="38" ry="48" stroke-width="7"/>
            <path d="M 200 308 L 200 380" stroke-width="5"/>
            <ellipse cx="600" cy="260" rx="38" ry="48" stroke-width="7"/>
            <path d="M 600 308 L 600 380" stroke-width="5"/>
          </g>
        `, `Certified and Approved by the Dinosaur Kingdom! YOU DID IT, ${name.toUpperCase()}!`),
      },
    ];
  }

  return {
    id: `book-${Date.now()}`,
    bookTitle: `${name}'s ${preset.defaultTitle}`,
    childName: name,
    theme: preset.name,
    ageGroup: 'early',
    dedication: customDedication,
    coverColor: preset.coverColor,
    pages,
    createdAt: new Date().toLocaleDateString(),
  };
}
