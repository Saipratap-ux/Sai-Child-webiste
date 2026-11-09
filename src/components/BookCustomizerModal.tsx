import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Heart,
  Palette,
  User,
  RefreshCw,
  Check,
  ChevronRight,
} from 'lucide-react';
import { THEME_PRESETS, ColoringBook, createDefaultBook, makeSvgPage } from '../data/presets';
import { sounds } from '../utils/audio';

interface BookCustomizerModalProps {
  currentBook: ColoringBook;
  onUpdateBook: (newBook: ColoringBook) => void;
  onClose: () => void;
}

export const BookCustomizerModal: React.FC<BookCustomizerModalProps> = ({
  currentBook,
  onUpdateBook,
  onClose,
}) => {
  const [childName, setChildName] = useState(currentBook.childName);
  const [selectedThemeId, setSelectedThemeId] = useState(
    THEME_PRESETS.find((t) => t.name.toLowerCase() === currentBook.theme.toLowerCase())?.id || 'dinosaur'
  );
  const [customTheme, setCustomTheme] = useState('');
  const [ageGroup, setAgeGroup] = useState<'toddler' | 'early' | 'big-kid'>(currentBook.ageGroup);
  const [dedication, setDedication] = useState(currentBook.dedication);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Apply instant preset
  const handleApplyPreset = () => {
    sounds.playPop(520);
    const newBook = createDefaultBook(childName || 'Maya', selectedThemeId, dedication);
    onUpdateBook(newBook);
    sounds.playFanfare();
    onClose();
  };

  // Generate 5-page story with Gemini 3.8 Flash
  const handleGenerateStoryWithGemini = async () => {
    setIsGeneratingStory(true);
    sounds.playPop(480);

    const activeThemeName = customTheme.trim()
      ? customTheme.trim()
      : THEME_PRESETS.find((t) => t.id === selectedThemeId)?.name || 'Dino Safari';

    try {
      const resp = await fetch('/api/gemini/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim() || 'Maya',
          theme: activeThemeName,
          ageGroup,
          dedication: dedication.trim(),
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to generate story book plan');
      }

      const plan = await resp.json();

      // Transform plan into 5 coloring pages
      const newPages = plan.pages.map((p: any, idx: number) => {
        const svgUrl = makeSvgPage(
          p.title || `Page ${idx + 1}`,
          `
          <g stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Whimsical Story Illustration -->
            <circle cx="400" cy="400" r="160" stroke-width="10" fill="#ffffff"/>
            <!-- Friendly character -->
            <circle cx="340" cy="360" r="24" stroke-width="6" fill="#ffffff"/>
            <circle cx="345" cy="358" r="8" fill="#0f172a"/>
            <circle cx="460" cy="360" r="24" stroke-width="6" fill="#ffffff"/>
            <circle cx="455" cy="358" r="8" fill="#0f172a"/>
            <!-- Big joyous smile -->
            <path d="M 360 420 Q 400 480 440 420" stroke-width="8"/>
            <!-- Decorative stars -->
            <polygon points="220,260 226,275 242,275 229,285 234,300 220,290 206,300 211,285 198,275 214,275" stroke-width="6"/>
            <polygon points="580,260 586,275 602,275 589,285 594,300 580,290 566,300 571,285 558,275 574,275" stroke-width="6"/>
            <polygon points="400,620 406,635 422,635 409,645 414,660 400,650 386,660 391,645 378,635 394,635" stroke-width="6"/>
          </g>
          `,
          p.storyCaption || ''
        );

        return {
          id: `page-${idx + 1}-${Date.now()}`,
          pageNumber: idx + 1,
          pageType: p.pageType || (idx === 0 ? 'cover' : idx === 4 ? 'certificate' : 'story'),
          title: p.title || `Chapter ${idx + 1}`,
          storyCaption: p.storyCaption || '',
          imagePrompt: p.imagePrompt || '',
          imageDataUrl: svgUrl,
        };
      });

      const updatedBook: ColoringBook = {
        id: `book-${Date.now()}`,
        bookTitle: plan.bookTitle || `${childName}'s ${activeThemeName}`,
        childName: childName.trim() || 'Maya',
        theme: activeThemeName,
        ageGroup,
        dedication: plan.dedication || dedication,
        coverColor: '#f59e0b',
        pages: newPages,
        createdAt: new Date().toLocaleDateString(),
      };

      onUpdateBook(updatedBook);
      sounds.playFanfare();
      onClose();
    } catch (err) {
      console.error('Story generation error:', err);
      // Fallback to instant preset
      handleApplyPreset();
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Create a New 5-Page Coloring Book
              </h2>
              <p className="text-amber-100 text-xs md:text-sm mt-0.5">
                Personalized with child's name, custom themes, and printable layout
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Child's Name Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Child's Name:</span>
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g., Maya, Leo, Sophia..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-slate-800 text-base font-bold transition-all"
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Select Adventure Theme:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = selectedThemeId === preset.id && !customTheme;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedThemeId(preset.id);
                      setCustomTheme('');
                      sounds.playPop(480);
                    }}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{preset.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-extrabold text-slate-800">{preset.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{preset.description}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 mt-1" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Theme option */}
            <div className="mt-3">
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Or type a custom theme (e.g., Underwater Karate Pandas, Candy Castle)..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm font-medium text-slate-800 focus:border-amber-500 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Age Group */}
          <div>
            <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Age Group (Line art complexity):
            </span>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'toddler', label: 'Toddler (2-4)', desc: 'Extra thick lines, simple shapes' },
                  { id: 'early', label: 'Early Reader (5-7)', desc: 'Bold lines with fun details' },
                  { id: 'big-kid', label: 'Big Kid (8+)', desc: 'Detailed scenes & patterns' },
                ] as const
              ).map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => setAgeGroup(ag.id)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    ageGroup === ag.id
                      ? 'border-amber-500 bg-amber-50 text-slate-900 font-extrabold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs md:text-sm">{ag.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ag.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dedication Message */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Special Dedication Note (Printed on Cover):</span>
            </label>
            <textarea
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="e.g., Dedicated with love to Maya on her 6th Birthday! Love, Mom & Dad."
              rows={2}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 text-slate-800 text-xs md:text-sm font-medium outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleGenerateStoryWithGemini}
              disabled={isGeneratingStory}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isGeneratingStory ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Writing 5-Page Story with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate with AI Storyteller</span>
                </>
              )}
            </button>

            <button
              onClick={handleApplyPreset}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>Use Instant Preset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
