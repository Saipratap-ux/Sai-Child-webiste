import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Paintbrush,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  FileDown,
  RefreshCw,
} from 'lucide-react';
import { ColoringBook, ColoringPage } from '../data/presets';
import { exportBookToPdf } from '../utils/pdfGenerator';
import { sounds } from '../utils/audio';

interface BookPageGalleryProps {
  book: ColoringBook;
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onOpenAiStudioForPage: (index: number) => void;
  onOpenBookCustomizer: () => void;
}

export const BookPageGallery: React.FC<BookPageGalleryProps> = ({
  book,
  activePageIndex,
  onSelectPage,
  onOpenAiStudioForPage,
  onOpenBookCustomizer,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  const handleDownloadFullBookPdf = async () => {
    setIsExportingPdf(true);
    setPdfProgressText('Starting booklet compile...');
    sounds.playPop(520);

    try {
      const pdfBlob = await exportBookToPdf(book, (step, total, msg) => {
        setPdfProgressText(`Building page ${step} of ${total}: ${msg}`);
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.childName}-Personalized-Coloring-Book.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      sounds.playFanfare();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  const handlePrintWholeBook = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Book Banner Summary */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white font-extrabold text-xs tracking-wider uppercase">
                5-Page Printable Booklet
              </span>
              <span className="text-amber-100 text-xs font-bold">
                Created for {book.childName}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {book.bookTitle}
            </h1>
            <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-2xl italic">
              "{book.dedication}"
            </p>
          </div>
        </div>

        {/* Action Buttons: Download PDF & New Book */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDownloadFullBookPdf}
            disabled={isExportingPdf}
            className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-600 font-extrabold text-sm md:text-base shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                <span>Download Printable PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenBookCustomizer}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-amber-700/40 hover:bg-amber-700/60 border border-white/30 text-white font-bold text-sm backdrop-blur-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Customize Book</span>
          </button>
        </div>
      </div>

      {/* PDF Progress Toast if active */}
      {isExportingPdf && (
        <div className="p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
          <span>{pdfProgressText || 'Generating high-resolution printable PDF booklet...'}</span>
        </div>
      )}

      {/* Page Cards Grid: Exactly 5 pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {book.pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const isColored = Boolean(page.userDrawingDataUrl);

          return (
            <div
              key={page.id}
              className={`bg-white rounded-3xl p-4 shadow-sm border-2 transition-all duration-200 flex flex-col justify-between group ${
                isActive
                  ? 'border-amber-500 ring-4 ring-amber-100 shadow-md'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                      page.pageType === 'cover'
                        ? 'bg-amber-100 text-amber-800'
                        : page.pageType === 'certificate'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page.pageType === 'cover'
                      ? 'Cover Page'
                      : page.pageType === 'certificate'
                      ? 'Certificate'
                      : `Page ${page.pageNumber}`}
                  </span>

                  {isColored && (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Colored
                    </span>
                  )}
                </div>

                {/* Preview Image Frame */}
                <div
                  onClick={() => onSelectPage(idx)}
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 cursor-pointer shadow-inner group-hover:scale-[1.02] transition-transform"
                >
                  <img
                    src={page.imageDataUrl}
                    alt={page.title}
                    className="w-full h-full object-contain"
                  />

                  {/* Render colored strokes on top if available */}
                  {page.userDrawingDataUrl && (
                    <img
                      src={page.userDrawingDataUrl}
                      alt="User coloring"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-white font-extrabold text-xs text-slate-900 shadow-lg flex items-center gap-1">
                      <Paintbrush className="w-3.5 h-3.5 text-amber-500" />
                      Color Page
                    </span>
                  </div>
                </div>

                {/* Title & Story */}
                <div className="mt-3">
                  <h3 className="font-extrabold text-slate-800 text-sm line-clamp-1">
                    {page.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {page.storyCaption}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  onClick={() => onSelectPage(idx)}
                  className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>{isColored ? 'Edit Colors' : 'Color Now'}</span>
                </button>

                <button
                  onClick={() => onOpenAiStudioForPage(idx)}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                  title="Prompt AI to edit this image with Gemini Nano Banana 2.1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
