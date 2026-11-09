import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Paintbrush,
  Download,
  Printer,
  PlusCircle,
  HelpCircle,
  Award,
  Layers,
  Heart,
  Smile,
  RefreshCw,
} from 'lucide-react';
import { ColoringBook, ColoringPage, createDefaultBook } from './data/presets';
import { ColoringStudio } from './components/ColoringStudio';
import { BookPageGallery } from './components/BookPageGallery';
import { AiImageStudio } from './components/AiImageStudio';
import { BookCustomizerModal } from './components/BookCustomizerModal';
import { exportBookToPdf } from './utils/pdfGenerator';
import { sounds } from './utils/audio';

export default function App() {
  // Initialize with saved book or default dinosaur book
  const [book, setBook] = useState<ColoringBook>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('colorsprout_book_v1');
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore
      }
    }
    return createDefaultBook('Maya', 'dinosaur');
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeView, setActiveView] = useState<'studio' | 'gallery'>('studio');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Sync book to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('colorsprout_book_v1', JSON.stringify(book));
    } catch {
      // Ignore
    }
  }, [book]);

  const activePage = book.pages[activePageIndex] || book.pages[0];

  // Update a single page (e.g. after coloring)
  const handleSavePage = (updatedPage: ColoringPage) => {
    setBook((prev) => ({
      ...prev,
      pages: prev.pages.map((p, idx) => (idx === activePageIndex ? updatedPage : p)),
    }));
  };

  // Apply new AI generated image to specific book page
  const handleApplyAiImageToPage = (targetIndex: number, newImageUrl: string, promptText: string) => {
    setBook((prev) => ({
      ...prev,
      pages: prev.pages.map((p, idx) =>
        idx === targetIndex
          ? {
              ...p,
              imageDataUrl: newImageUrl,
              imagePrompt: promptText,
              userDrawingDataUrl: undefined, // Reset drawing layer for fresh outline
            }
          : p
      ),
    }));
    setActivePageIndex(targetIndex);
    setActiveView('studio');
  };

  // Color an image immediately
  const handleColorImageImmediately = (imageUrl: string, promptText: string) => {
    handleApplyAiImageToPage(activePageIndex, imageUrl, promptText);
  };

  // Export full PDF directly from navbar
  const handleQuickDownloadPdf = async () => {
    setIsExportingPdf(true);
    sounds.playPop(520);
    try {
      const blob = await exportBookToPdf(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.childName}-ColorSprout-Booklet.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      sounds.playFanfare();
    } catch (err) {
      console.error('Quick PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col text-slate-800 antialiased selection:bg-amber-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Child Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveView('studio');
                sounds.playPop(480);
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Paintbrush className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1 font-heading">
                  ColorSprout<span className="text-amber-500">.</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 -mt-1 block">
                  Children's Coloring Book Generator
                </span>
              </div>
            </button>

            {/* Child Profile Pill */}
            <div
              onClick={() => setIsCustomizerModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 hover:bg-amber-100 text-amber-800 text-xs font-extrabold cursor-pointer transition-colors"
              title="Click to edit child name or change theme"
            >
              <Smile className="w-3.5 h-3.5 text-amber-600" />
              <span>For {book.childName}</span>
              <span className="text-amber-400">•</span>
              <span className="font-medium text-amber-700">{book.theme}</span>
            </div>
          </div>

          {/* Navigation View Switchers */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setActiveView('studio');
                sounds.playPop(480);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs md:text-sm transition-all ${
                activeView === 'studio'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Paintbrush className="w-4 h-4 text-amber-500" />
              <span>Coloring Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveView('gallery');
                sounds.playPop(520);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs md:text-sm transition-all ${
                activeView === 'gallery'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span>5-Page Book & PDF</span>
            </button>
          </div>

          {/* Action Tools: AI Studio & PDF Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs md:text-sm shadow-md shadow-purple-600/20 active:scale-95 transition-all"
              title="Generate new art or edit images using Gemini Nano Banana 2.1"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="hidden md:inline">Gemini Nano Banana 2.1</span>
              <span className="md:hidden">AI Studio</span>
            </button>

            <button
              onClick={handleQuickDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs md:text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50"
              title="Export complete 5-page printable PDF booklet"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'studio' ? (
          <ColoringStudio
            page={activePage}
            pageNumber={activePageIndex + 1}
            totalPages={book.pages.length}
            childName={book.childName}
            onSavePage={handleSavePage}
            onPrevPage={() => {
              if (activePageIndex > 0) {
                setActivePageIndex(activePageIndex - 1);
                sounds.playPop(440);
              }
            }}
            onNextPage={() => {
              if (activePageIndex < book.pages.length - 1) {
                setActivePageIndex(activePageIndex + 1);
                sounds.playPop(480);
              }
            }}
            onOpenAiStudio={() => setIsAiModalOpen(true)}
          />
        ) : (
          <BookPageGallery
            book={book}
            activePageIndex={activePageIndex}
            onSelectPage={(index) => {
              setActivePageIndex(index);
              setActiveView('studio');
              sounds.playPop(520);
            }}
            onOpenAiStudioForPage={(index) => {
              setActivePageIndex(index);
              setIsAiModalOpen(true);
            }}
            onOpenBookCustomizer={() => setIsCustomizerModalOpen(true)}
          />
        )}
      </main>

      {/* AI Image Generation & Editing Modal (Powered by Gemini Nano Banana 2.1) */}
      {isAiModalOpen && (
        <AiImageStudio
          book={book}
          activePageIndex={activePageIndex}
          onApplyImageToPage={handleApplyAiImageToPage}
          onColorImageImmediately={handleColorImageImmediately}
          onClose={() => setIsAiModalOpen(false)}
        />
      )}

      {/* Book Customizer Modal */}
      {isCustomizerModalOpen && (
        <BookCustomizerModal
          currentBook={book}
          onUpdateBook={(newBook) => {
            setBook(newBook);
            setActivePageIndex(0);
          }}
          onClose={() => setIsCustomizerModalOpen(false)}
        />
      )}

      {/* Printable All-Pages Hidden Container (Used for standard browser window.print) */}
      <div className="hidden print:block print-only">
        {book.pages.map((p, idx) => (
          <div key={p.id} className="page-break flex flex-col items-center justify-center min-h-[90vh] p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{p.title}</h2>
            <div className="relative w-[650px] aspect-[4/5] mx-auto border-4 border-black">
              <img src={p.imageDataUrl} alt={p.title} className="w-full h-full object-contain" />
              {p.userDrawingDataUrl && (
                <img
                  src={p.userDrawingDataUrl}
                  alt="Coloring layer"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              )}
            </div>
            {p.storyCaption && <p className="text-base font-medium mt-4 max-w-lg">{p.storyCaption}</p>}
            <p className="text-xs text-slate-500 mt-2">
              Page {p.pageNumber} of {book.pages.length} • Artist: {book.childName}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-amber-200/60 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-700">ColorSprout</span>
            <span>•</span>
            <span>Personalized 5-page children's coloring books with Gemini Nano Banana 2.1 AI studio</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <button
              onClick={() => setIsCustomizerModalOpen(true)}
              className="hover:text-amber-600 transition-colors"
            >
              New Book
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="hover:text-purple-600 transition-colors"
            >
              AI Creator
            </button>
            <button
              onClick={handleQuickDownloadPdf}
              className="hover:text-amber-600 transition-colors"
            >
              Printable PDF
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
