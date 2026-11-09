import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get Gemini AI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to strip data URL prefix
function stripDataUrlPrefix(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/png', base64: dataUrl };
}

// Fallback high quality SVG line art generator for offline or key-less mode
function generateFallbackColoringSvg(prompt: string, title?: string): string {
  const safeTitle = (title || prompt.slice(0, 30)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pLower = prompt.toLowerCase();

  let subjectSvg = '';
  if (pLower.includes('dino') || pLower.includes('t-rex') || pLower.includes('dragon')) {
    subjectSvg = `
      <g stroke="#1e293b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Cute Dino Body -->
        <path d="M 320 280 Q 280 200 360 160 Q 440 120 500 180 Q 550 230 520 320 Q 560 360 590 320 Q 610 360 560 410 Q 520 450 420 460 Q 340 470 280 430 Q 220 380 240 310 Q 260 260 320 280 Z" stroke-width="10"/>
        <!-- Big friendly eye -->
        <circle cx="450" cy="190" r="22" stroke-width="8" fill="white"/>
        <circle cx="455" cy="188" r="9" fill="#1e293b"/>
        <!-- Smile -->
        <path d="M 480 225 Q 460 245 430 235" stroke-width="7"/>
        <!-- Cute Spikes along back -->
        <path d="M 330 200 L 310 160 L 345 180" stroke-width="8"/>
        <path d="M 285 240 L 255 210 L 295 230" stroke-width="8"/>
        <path d="M 250 290 L 220 270 L 255 290" stroke-width="8"/>
        <!-- Belly plate -->
        <path d="M 360 280 Q 420 320 440 430" stroke-dasharray="16 10" stroke-width="6"/>
        <!-- Feet -->
        <path d="M 330 450 L 330 530 Q 310 550 360 550 L 370 460" stroke-width="10"/>
        <path d="M 430 450 L 440 530 Q 420 550 470 550 L 475 450" stroke-width="10"/>
        <!-- Little cute hands -->
        <path d="M 460 310 Q 490 320 480 340" stroke-width="8"/>
        <!-- Scenery: clouds and plants -->
        <path d="M 120 540 Q 180 500 240 540" stroke-width="6"/>
        <path d="M 540 540 Q 620 490 700 540" stroke-width="6"/>
        <ellipse cx="680" cy="160" rx="60" ry="25" stroke-width="6"/>
        <ellipse cx="160" cy="180" rx="50" ry="20" stroke-width="6"/>
      </g>
    `;
  } else if (pLower.includes('space') || pLower.includes('rocket') || pLower.includes('planet')) {
    subjectSvg = `
      <g stroke="#1e293b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Rocket Body -->
        <path d="M 400 140 C 440 220 450 340 440 430 L 360 430 C 350 340 360 220 400 140 Z" stroke-width="10"/>
        <!-- Window -->
        <circle cx="400" cy="270" r="35" stroke-width="8" fill="white"/>
        <circle cx="400" cy="270" r="22" stroke-width="5"/>
        <!-- Fins -->
        <path d="M 358 370 L 290 440 L 358 430" stroke-width="9"/>
        <path d="M 442 370 L 510 440 L 442 430" stroke-width="9"/>
        <!-- Flame -->
        <path d="M 375 435 Q 400 540 400 560 Q 400 540 425 435" stroke-width="8"/>
        <!-- Planets & Stars -->
        <circle cx="200" cy="220" r="45" stroke-width="7"/>
        <ellipse cx="200" cy="220" rx="75" ry="18" stroke-width="6"/>
        <polygon points="620,200 630,225 655,225 635,240 642,265 620,250 598,265 605,240 585,225 610,225" stroke-width="6"/>
        <polygon points="220,440 226,455 242,455 229,465 233,480 220,470 207,480 211,465 198,455 214,455" stroke-width="5"/>
        <polygon points="580,420 586,435 602,435 589,445 593,460 580,450 567,460 571,445 558,435 574,435" stroke-width="5"/>
      </g>
    `;
  } else {
    // Cute animal/hero character
    subjectSvg = `
      <g stroke="#1e293b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Cute Teddy / Character -->
        <circle cx="400" cy="290" r="100" stroke-width="10"/>
        <!-- Ears -->
        <circle cx="320" cy="210" r="38" stroke-width="8"/>
        <circle cx="320" cy="210" r="20" stroke-width="5"/>
        <circle cx="480" cy="210" r="38" stroke-width="8"/>
        <circle cx="480" cy="210" r="20" stroke-width="5"/>
        <!-- Eyes & Snout -->
        <ellipse cx="365" cy="275" rx="14" ry="18" fill="#1e293b"/>
        <ellipse cx="435" cy="275" rx="14" ry="18" fill="#1e293b"/>
        <ellipse cx="400" cy="320" rx="35" ry="25" stroke-width="6"/>
        <polygon points="390,312 410,312 400,324" fill="#1e293b"/>
        <path d="M 400 324 L 400 335 Q 385 345 375 335" stroke-width="6"/>
        <path d="M 400 335 Q 415 345 425 335" stroke-width="6"/>
        <!-- Body & Paws -->
        <path d="M 330 380 Q 280 430 310 520 L 490 520 Q 520 430 470 380" stroke-width="9"/>
        <ellipse cx="400" cy="460" rx="50" ry="40" stroke-dasharray="14 8" stroke-width="5"/>
        <!-- Paws -->
        <circle cx="280" cy="420" r="28" stroke-width="8"/>
        <circle cx="520" cy="420" r="28" stroke-width="8"/>
        <!-- Stars & Hearts -->
        <path d="M 180 320 C 180 300 210 290 220 315 C 230 290 260 300 260 320 C 260 350 220 375 220 375 C 220 375 180 350 180 320 Z" stroke-width="6"/>
        <path d="M 560 310 C 560 290 590 280 600 305 C 610 280 640 290 640 310 C 640 340 600 365 600 365 C 600 365 560 340 560 310 Z" stroke-width="6"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 680" width="100%" height="100%">
    <rect width="800" height="680" fill="#ffffff" />
    <!-- Decorative Frame -->
    <rect x="25" y="25" width="750" height="630" rx="24" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-dasharray="18 12"/>
    <rect x="40" y="40" width="720" height="600" rx="16" fill="none" stroke="#0f172a" stroke-width="6"/>
    <!-- Corner stars -->
    <polygon points="65,65 68,74 77,74 70,79 73,88 65,83 57,88 60,79 53,74 62,74" fill="none" stroke="#0f172a" stroke-width="4"/>
    <polygon points="735,65 738,74 747,74 740,79 743,88 735,83 727,88 730,79 723,74 732,74" fill="none" stroke="#0f172a" stroke-width="4"/>
    <polygon points="65,615 68,624 77,624 70,629 73,638 65,633 57,638 60,629 53,624 62,624" fill="none" stroke="#0f172a" stroke-width="4"/>
    <polygon points="735,615 738,624 747,624 740,629 743,638 735,633 727,638 730,629 723,624 732,624" fill="none" stroke="#0f172a" stroke-width="4"/>
    ${subjectSvg}
    <!-- Caption text banner at bottom -->
    <text x="400" y="605" text-anchor="middle" font-family="'Nunito', sans-serif" font-weight="800" font-size="20" fill="#0f172a">${safeTitle}</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// -------------------------------------------------------------
// API: Generate Image using gemini-nano-banana-2.1
// -------------------------------------------------------------
app.post('/api/gemini/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K', style = 'coloring' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY is not configured or placeholder. Using crisp procedural line art.');
      const fallbackUrl = generateFallbackColoringSvg(prompt, prompt);
      return res.json({
        imageUrl: fallbackUrl,
        prompt,
        modelUsed: 'offline-svg',
        notice: 'Configure your GEMINI_API_KEY in Settings > Secrets to unlock photorealistic Gemini Nano Banana 2.1 generation.',
      });
    }

    // Specially crafted prompt for clean children's coloring page
    const coloringPrompt = style === 'coloring'
      ? `Children's printable coloring book page: ${prompt}. Ultra-clean thick bold black outlines, solid black vector linework, pure solid white background (#FFFFFF), zero grayscale, zero shading, zero shadows, zero colored fills, high contrast, perfect for a child's coloring book.`
      : prompt;

    console.log(`Generating image with gemini-nano-banana-2.1, prompt: "${prompt.slice(0, 80)}..."`);

    let generatedImageUrl = '';
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: coloringPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio as any) || '1:1',
            imageSize: (imageSize as any) || '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('gemini-nano-banana-2.1 call returned error, trying gemini-3.1-flash-lite-image fallback:', primaryErr?.message);
      // Fallback model for images
      try {
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: coloringPrompt }],
          },
        });
        for (const part of fallbackResp.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            modelUsed = 'gemini-3.1-flash-lite-image';
            break;
          }
        }
      } catch (secErr: any) {
        console.warn('gemini-3.1-flash-lite-image fallback also failed:', secErr?.message);
      }
    }

    if (!generatedImageUrl) {
      console.warn('Falling back to vector SVG coloring page for smooth user experience.');
      generatedImageUrl = generateFallbackColoringSvg(prompt, prompt);
      modelUsed = 'procedural-vector-art';
    }

    return res.json({
      imageUrl: generatedImageUrl,
      prompt,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    // Provide a graceful fallback instead of breaking the web interface
    const fallbackUrl = generateFallbackColoringSvg(req.body.prompt || 'Coloring Page');
    return res.json({
      imageUrl: fallbackUrl,
      prompt: req.body.prompt,
      modelUsed: 'procedural-vector-art',
      notice: error?.message || 'Generated with vector artist engine.',
    });
  }
});

// -------------------------------------------------------------
// API: Edit Image using gemini-nano-banana-2.1
// -------------------------------------------------------------
app.post('/api/gemini/edit-image', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/png', aspectRatio = '1:1' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Edit prompt is required' });
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Source imageBase64 is required for editing' });
    }

    const { base64: cleanBase64, mimeType: resolvedMime } = stripDataUrlPrefix(imageBase64);

    const ai = getGenAIClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured. Generating edited illustration with vector engine.');
      const fallbackUrl = generateFallbackColoringSvg(`Edited: ${prompt}`);
      return res.json({
        imageUrl: fallbackUrl,
        prompt,
        modelUsed: 'offline-svg',
        notice: 'Configure your GEMINI_API_KEY in Settings > Secrets to unlock AI editing.',
      });
    }

    const editInstruction = `Modify this black and white children's coloring page: ${prompt}. Maintain crisp, high contrast black outlines on a pure white background, suitable for a child to color. No shaded gradients or solid black fill blocks.`;

    console.log(`Editing image with gemini-nano-banana-2.1, edit instruction: "${prompt.slice(0, 80)}..."`);

    let editedImageUrl = '';
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: resolvedMime || mimeType,
              },
            },
            {
              text: editInstruction,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio as any) || '1:1',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          editedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('gemini-nano-banana-2.1 edit failed, trying gemini-3.1-flash-lite-image:', primaryErr?.message);
      try {
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: resolvedMime || mimeType,
                },
              },
              {
                text: editInstruction,
              },
            ],
          },
        });
        for (const part of fallbackResp.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            editedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            modelUsed = 'gemini-3.1-flash-lite-image';
            break;
          }
        }
      } catch (fallbackErr: any) {
        console.warn('gemini-3.1-flash-lite-image fallback also failed:', fallbackErr?.message);
      }
    }

    if (!editedImageUrl) {
      editedImageUrl = generateFallbackColoringSvg(`Edited: ${prompt}`);
      modelUsed = 'procedural-vector-art';
    }

    return res.json({
      imageUrl: editedImageUrl,
      prompt,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error editing image:', error);
    const fallbackUrl = generateFallbackColoringSvg(`Edited: ${req.body.prompt || 'Custom Edit'}`);
    return res.json({
      imageUrl: fallbackUrl,
      prompt: req.body.prompt,
      modelUsed: 'procedural-vector-art',
      notice: error?.message,
    });
  }
});

// -------------------------------------------------------------
// API: Generate 5-Page Story & Prompts with gemini-3.8-flash
// -------------------------------------------------------------
app.post('/api/gemini/generate-book', async (req: Request, res: Response) => {
  try {
    const { childName = 'Maya', theme = 'Dinosaur Safari', ageGroup = '5-7', dedication } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      // Return beautiful preset plan
      return res.json(createPresetBookPlan(childName, theme, ageGroup, dedication));
    }

    const systemPrompt = `You are a world-class children's book author and illustrator assistant.
Generate a structured 5-page coloring book plan for a child named "${childName}", age "${ageGroup}", theme "${theme}".
Output strictly valid JSON with no markdown backticks, matching this exact structure:
{
  "bookTitle": "Catchy Book Title",
  "childName": "${childName}",
  "dedication": "Warm 1-sentence dedication message",
  "pages": [
    {
      "pageNumber": 1,
      "pageType": "cover",
      "title": "Front Cover Title",
      "storyCaption": "Welcome to an adventure specially created for ${childName}!",
      "imagePrompt": "A joyful hero character celebrating, welcoming ${childName} to ${theme}, thick bold lines, coloring book page"
    },
    {
      "pageNumber": 2,
      "pageType": "story",
      "title": "Scene 1 Title",
      "storyCaption": "1-2 fun sentences advancing the story with ${childName}",
      "imagePrompt": "Description of coloring scene 1 with thick black outlines and cute characters"
    },
    {
      "pageNumber": 3,
      "pageType": "story",
      "title": "Scene 2 Title",
      "storyCaption": "1-2 fun sentences advancing the story",
      "imagePrompt": "Description of coloring scene 2 with bold black vector linework"
    },
    {
      "pageNumber": 4,
      "pageType": "story",
      "title": "Scene 3 Title",
      "storyCaption": "1-2 fun sentences advancing the story",
      "imagePrompt": "Description of coloring scene 3 with bold black vector linework"
    },
    {
      "pageNumber": 5,
      "pageType": "certificate",
      "title": "Master Artist Certificate",
      "storyCaption": "Awarded to ${childName} for coloring their very own masterpiece book!",
      "imagePrompt": "A grand trophy, ribbons, and cute celebration confetti, coloring book outline"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create the coloring book plan for ${childName} exploring ${theme}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating book plan with Gemini:', error?.message);
    const { childName = 'Maya', theme = 'Dinosaur Safari', ageGroup = '5-7', dedication } = req.body;
    return res.json(createPresetBookPlan(childName, theme, ageGroup, dedication));
  }
});

function createPresetBookPlan(childName: string, theme: string, ageGroup: string, userDedication?: string) {
  const cleanName = childName || 'Little Explorer';
  const cleanTheme = theme || 'Wonderland';
  const defaultDedication = userDedication || `Dedicated with love to ${cleanName}, our shining star and brilliant artist!`;

  return {
    bookTitle: `${cleanName}'s ${cleanTheme} Adventures`,
    childName: cleanName,
    dedication: defaultDedication,
    pages: [
      {
        pageNumber: 1,
        pageType: 'cover',
        title: `${cleanName}'s ${cleanTheme}`,
        storyCaption: `A personalized coloring journey made especially for ${cleanName}!`,
        imagePrompt: `A cheerful friendly character smiling warmly, decorated greeting banner for ${cleanName}, thick black lines, coloring book page.`,
      },
      {
        pageNumber: 2,
        pageType: 'story',
        title: 'The Great Journey Begins',
        storyCaption: `One sunny morning, ${cleanName} packed an explorer backpack and stepped into a world of magic and wonder.`,
        imagePrompt: `Cute explorer character setting off down a winding path with singing birds and gentle trees, bold outlines coloring page.`,
      },
      {
        pageNumber: 3,
        pageType: 'story',
        title: 'A New Wonderful Friend',
        storyCaption: `Behind the sparkling bushes, ${cleanName} met a playful creature who loved to dance and share sweet berries.`,
        imagePrompt: `Two cute friendly animals dancing together surrounded by flowers, butterflies, and puffy clouds, thick coloring linework.`,
      },
      {
        pageNumber: 4,
        pageType: 'story',
        title: 'Secret Rainbow Grove',
        storyCaption: `Together they discovered a hidden grove filled with giant friendly mushrooms and shining wish-granting stars.`,
        imagePrompt: `Enchanted fairy forest with huge whimsical mushrooms, starry night sky, fireflies, clean black line art.`,
      },
      {
        pageNumber: 5,
        pageType: 'certificate',
        title: 'Official Super Artist Award',
        storyCaption: `This high honor certifies that ${cleanName} is a certified master colorist of the universe!`,
        imagePrompt: `Big golden celebration trophy with starry ribbon banner, winner crown, and festive balloons, coloring outline.`,
      },
    ],
  };
}

// -------------------------------------------------------------
// Vite Dev Middleware or Static Production Serve
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ColorSprout server listening on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
