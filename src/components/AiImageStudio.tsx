import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Check,
  Download,
  Paintbrush,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Sliders,
} from 'lucide-react';
import { ColoringPage, ColoringBook } from '../data/presets';
import { sounds } from '../utils/audio';

interface AiImageStudioProps {
  book: ColoringBook;
  activePageIndex: number;
  onApplyImageToPage: (pageIndex: number, newImageUrl: string, promptText: string) => void;
  onColorImageImmediately: (imageUrl: string, promptText: string) => void;
  onClose: () => void;
}

export const AiImageStudio: React.FC<AiImageStudioProps> = ({
  book,
  activePageIndex,
  onApplyImageToPage,
  onColorImageImmediately,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');

  // Create Mode state
  const [createPrompt, setCreatePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9'>('3:4');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [lineStyle, setLineStyle] = useState<'coloring' | 'detailed'>('coloring');

  // Edit Mode state
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedSourcePageIndex, setSelectedSourcePageIndex] = useState<number>(activePageIndex);
  const [customUploadUrl, setCustomUploadUrl] = useState<string | null>(null);

  // Common Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResultUrl, setGeneratedResultUrl] = useState<string | null>(null);
  const [resultModelUsed, setResultModelUsed] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetBookPage, setTargetBookPage] = useState<number>(activePageIndex);

  const CREATE_SUGGESTIONS = [
    'A friendly baby dragon baking cupcakes in a tiny kitchen',
    'A joyful cat astronaut floating with bubbles in outer space',
    'A magical woodland treehouse with cute animals having tea',
    'A happy sea turtle swimming through coral with starfish',
    'A cute puppy driving a cheerful toy tractor on a sunny farm',
    'A sweet fairy princess hugging a baby unicorn in a meadow',
  ];

  const EDIT_SUGGESTIONS = [
    'Add a silly party hat on its head and festive confetti in the air',
    'Add cute fluttering butterflies and smiling flowers all around',
    'Add floating balloons and twinkling stars in the sky',
    'Put cool oversized sunglasses on the main character',
    'Add a delicious giant ice cream cone with sprinkles',
    'Add musical notes and a rainbow arching overhead',
  ];

  // Resolve source image for editing
  const getSourceImageForEdit = (): string => {
    if (customUploadUrl) return customUploadUrl;
    const page = book.pages[selectedSourcePageIndex];
    return page?.imageDataUrl || book.pages[0].imageDataUrl;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCustomUploadUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Generate Image with Gemini Nano Banana 2.1
  const handleCreateImage = async () => {
    if (!createPrompt.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResultUrl(null);
    sounds.playPop(480);

    try {
      const resp = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt.trim(),
          aspectRatio,
          imageSize,
          style: lineStyle,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (data.imageUrl) {
        setGeneratedResultUrl(data.imageUrl);
        setResultModelUsed(data.modelUsed || 'gemini-nano-banana-2.1');
        sounds.playFanfare();
      } else {
        throw new Error(data.error || 'No image was returned from the server.');
      }
    } catch (err: any) {
      console.error('AI image generation error:', err);
      setErrorMessage(err?.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit Image with Gemini Nano Banana 2.1
  const handleEditImage = async () => {
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResultUrl(null);
    sounds.playPop(520);

    const sourceImageBase64 = getSourceImageForEdit();

    try {
      const resp = await fetch('/api/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          imageBase64: sourceImageBase64,
          aspectRatio,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (data.imageUrl) {
        setGeneratedResultUrl(data.imageUrl);
        setResultModelUsed(data.modelUsed || 'gemini-nano-banana-2.1');
        sounds.playFanfare();
      } else {
        throw new Error(data.error || 'Failed to edit image.');
      }
    } catch (err: any) {
      console.error('AI edit error:', err);
      setErrorMessage(err?.message || 'Failed to edit image.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply result to target book page
  const handleApplyToPage = () => {
    if (!generatedResultUrl) return;
    const finalPrompt = activeTab === 'create' ? createPrompt : editPrompt;
    onApplyImageToPage(targetBookPage, generatedResultUrl, finalPrompt);
    sounds.playPop(640);
    onClose();
  };

  // Color immediately in studio
  const handleColorImmediately = () => {
    if (!generatedResultUrl) return;
    const finalPrompt = activeTab === 'create' ? createPrompt : editPrompt;
    onColorImageImmediately(generatedResultUrl, finalPrompt);
    sounds.playPop(640);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  Gemini Nano Banana 2.1 AI Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
                  Pro Art Engine
                </span>
              </div>
              <p className="text-purple-100 text-xs md:text-sm mt-0.5">
                Generate brand new children's coloring pages or edit existing illustrations using text prompts
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

        {/* Tab Switcher: Create vs Edit */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('create');
              setGeneratedResultUrl(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-extrabold text-sm transition-all border-t-2 border-x-2 ${
              activeTab === 'create'
                ? 'bg-white border-purple-400 text-purple-700 shadow-sm -mb-[2px] z-10'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Create New Art (Prompt-to-Image)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('edit');
              setGeneratedResultUrl(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-extrabold text-sm transition-all border-t-2 border-x-2 ${
              activeTab === 'edit'
                ? 'bg-white border-purple-400 text-purple-700 shadow-sm -mb-[2px] z-10'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4 text-indigo-600" />
            <span>Edit Existing Art (Text-to-Edit)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* TAB 1: CREATE NEW */}
          {activeTab === 'create' && (
            <div className="flex flex-col gap-5">
              {/* Prompt Input Box */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Describe what you want to create:
                </label>
                <div className="relative">
                  <textarea
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="e.g., A happy baby sloth hanging on a branch in a tropical rainforest, clean bold vector lines, coloring book page..."
                    rows={3}
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-slate-800 text-sm md:text-base font-medium resize-none transition-all placeholder:text-slate-400"
                  />
                  {createPrompt && (
                    <button
                      onClick={() => setCreatePrompt('')}
                      className="absolute top-3 right-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Inspiration Chips */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fun Ideas to Try:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CREATE_SUGGESTIONS.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCreatePrompt(idea)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors text-left"
                    >
                      ✨ {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options: Aspect Ratio & Quality */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="block text-xs font-extrabold text-slate-600 mb-2">Aspect Ratio</span>
                  <div className="flex gap-2">
                    {(['1:1', '3:4', '4:3', '16:9'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                          aspectRatio === ratio
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-extrabold text-slate-600 mb-2">Resolution (Nano Banana 2.1)</span>
                  <div className="flex gap-2">
                    {(['1K', '2K'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setImageSize(sz)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                          imageSize === sz
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sz} {sz === '2K' ? '★ High Res' : 'Standard'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-extrabold text-slate-600 mb-2">Art Style</span>
                  <button
                    onClick={() => setLineStyle(lineStyle === 'coloring' ? 'detailed' : 'coloring')}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>{lineStyle === 'coloring' ? '🖍️ Thick Coloring Outlines' : '🎨 Detailed Vector Line Art'}</span>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleCreateImage}
                disabled={isGenerating || !createPrompt.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-base shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Gemini Nano Banana 2.1 is drawing your masterpiece...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Coloring Page with Gemini Nano Banana 2.1</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: EDIT EXISTING */}
          {activeTab === 'edit' && (
            <div className="flex flex-col gap-5">
              {/* Select Source Image */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  1. Choose an image to edit:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {book.pages.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedSourcePageIndex(idx);
                        setCustomUploadUrl(null);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 p-1 bg-white flex flex-col items-center transition-all ${
                        selectedSourcePageIndex === idx && !customUploadUrl
                          ? 'border-purple-500 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={p.imageDataUrl}
                        alt={p.title}
                        className="w-full aspect-[4/5] object-contain rounded-lg bg-slate-50"
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full text-center">
                        P.{p.pageNumber} {p.pageType === 'cover' ? 'Cover' : ''}
                      </span>
                    </button>
                  ))}
                  {/* Upload Custom */}
                  <label className="relative rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-400 p-2 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-600 text-center">Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Edit Instruction Prompt */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  2. What should Gemini add or change?
                </label>
                <div className="relative">
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., Add a friendly party hat and colorful balloons in the background, make lines thick..."
                    rows={2}
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-slate-800 text-sm md:text-base font-medium resize-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Edit Suggestion Quick Chips */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Quick Edits:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EDIT_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEditPrompt(sug)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors text-left"
                    >
                      🪄 {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={handleEditImage}
                disabled={isGenerating || !editPrompt.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Gemini Nano Banana 2.1 is editing your artwork...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Apply AI Edit with Gemini Nano Banana 2.1</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Generation Notice: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Generated Result Showcase */}
          {generatedResultUrl && (
            <div className="p-6 rounded-3xl bg-amber-50/60 border-2 border-amber-300 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2 aspect-[4/5] rounded-2xl overflow-hidden border-2 border-slate-800 bg-white shadow-md flex items-center justify-center">
                <img
                  src={generatedResultUrl}
                  alt="Generated Coloring Art"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> New Art Ready!
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    Powered by {resultModelUsed}
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-slate-800">
                  What would you like to do with this artwork?
                </h4>

                {/* Target Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Assign to:</span>
                  <select
                    value={targetBookPage}
                    onChange={(e) => setTargetBookPage(parseInt(e.target.value))}
                    className="p-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800"
                  >
                    {book.pages.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        Page {p.pageNumber}: {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleApplyToPage}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition-all"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Replace Page {book.pages[targetBookPage]?.pageNumber} in Book</span>
                  </button>

                  <button
                    onClick={handleColorImmediately}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md transition-all"
                  >
                    <Paintbrush className="w-4 h-4" />
                    <span>Color in Studio Right Now</span>
                  </button>

                  <a
                    href={generatedResultUrl}
                    download="ColorSprout-Art.png"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Save PNG to Computer</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
