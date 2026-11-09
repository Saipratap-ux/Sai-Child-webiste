import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Paintbrush,
  Sparkles,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  PaintBucket,
  Palette,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { ColoringPage } from '../data/presets';
import { sounds } from '../utils/audio';

interface ColoringStudioProps {
  page: ColoringPage;
  pageNumber: number;
  totalPages: number;
  childName: string;
  onSavePage: (updatedPage: ColoringPage) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenAiStudio: () => void;
}

const PALETTE = [
  { name: 'Candy Red', hex: '#ef4444' },
  { name: 'Bubblegum Pink', hex: '#ec4899' },
  { name: 'Bright Rose', hex: '#f43f5e' },
  { name: 'Clementine Orange', hex: '#f97316' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Sunshine Yellow', hex: '#eab308' },
  { name: 'Lime Zest', hex: '#84cc16' },
  { name: 'Apple Green', hex: '#22c55e' },
  { name: 'Emerald Forest', hex: '#10b981' },
  { name: 'Teal Splash', hex: '#14b8a6' },
  { name: 'Sky Cyan', hex: '#06b6d4' },
  { name: 'Ocean Blue', hex: '#0ea5e9' },
  { name: 'Cobalt Indigo', hex: '#3b82f6' },
  { name: 'Deep Royal', hex: '#6366f1' },
  { name: 'Grape Purple', hex: '#8b5cf6' },
  { name: 'Wild Violet', hex: '#a855f7' },
  { name: 'Lavender Blush', hex: '#d8b4fe' },
  { name: 'Peach Cream', hex: '#fed7aa' },
  { name: 'Warm Chocolate', hex: '#78350f' },
  { name: 'Caramel Tan', hex: '#b45309' },
  { name: 'Cozy Gray', hex: '#94a3b8' },
  { name: 'Charcoal Night', hex: '#334155' },
  { name: 'Pure White', hex: '#ffffff' },
];

export const ColoringStudio: React.FC<ColoringStudioProps> = ({
  page,
  pageNumber,
  totalPages,
  childName,
  onSavePage,
  onPrevPage,
  onNextPage,
  onOpenAiStudio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  const [activeColor, setActiveColor] = useState('#ef4444');
  const [tool, setTool] = useState<'brush' | 'bucket' | 'rainbow' | 'stamp' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(20);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const rainbowHueRef = useRef<number>(0);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 1500;

  // Initialize and load the line art on base canvas
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    baseCanvas.width = CANVAS_WIDTH;
    baseCanvas.height = CANVAS_HEIGHT;
    drawCanvas.width = CANVAS_WIDTH;
    drawCanvas.height = CANVAS_HEIGHT;

    const baseCtx = baseCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!baseCtx || !drawCtx) return;

    // Clear both
    baseCtx.fillStyle = '#ffffff';
    baseCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Load line art
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // If page has existing user drawing, restore it
      if (page.userDrawingDataUrl) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.onload = () => {
          drawCtx.drawImage(userImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          saveToHistory();
        };
        userImg.src = page.userDrawingDataUrl;
      } else {
        saveToHistory();
      }
    };
    img.src = page.imageDataUrl;
  }, [page.id, page.imageDataUrl]);

  // Save drawing state to history stack for Undo/Redo
  const saveToHistory = useCallback(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyStep + 1);
      return [...nextHistory, imgData];
    });
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  // Undo
  const handleUndo = () => {
    if (historyStep <= 0) return;
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep - 1;
    ctx.putImageData(history[newStep], 0, 0);
    setHistoryStep(newStep);
    setHasUnsavedChanges(true);
    if (soundEnabled) sounds.playPop(380);
  };

  // Redo
  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep + 1;
    ctx.putImageData(history[newStep], 0, 0);
    setHistoryStep(newStep);
    setHasUnsavedChanges(true);
    if (soundEnabled) sounds.playPop(480);
  };

  // Clear Canvas
  const handleClear = () => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveToHistory();
    setHasUnsavedChanges(true);
    if (soundEnabled) sounds.playPop(260);
  };

  // Coordinates helper mapping pointer position to 1200x1500 canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return { x: 0, y: 0 };
    const rect = drawCanvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Stamp star or heart at coordinate
  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = brushSize * 1.6;
    const innerRadius = brushSize * 0.7;
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;

    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let sx = x + Math.cos(rot) * outerRadius;
      let sy = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(sx, sy);
      rot += step;

      sx = x + Math.cos(rot) * innerRadius;
      sy = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(sx, sy);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Flood fill algorithm
  const floodFill = (startX: number, startY: number, fillColorHex: string) => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;
    const baseCtx = baseCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!baseCtx || !drawCtx) return;

    const ix = Math.floor(startX);
    const iy = Math.floor(startY);
    if (ix < 0 || ix >= CANVAS_WIDTH || iy < 0 || iy >= CANVAS_HEIGHT) return;

    // Convert hex to rgb
    const r = parseInt(fillColorHex.slice(1, 3), 16);
    const g = parseInt(fillColorHex.slice(3, 5), 16);
    const b = parseInt(fillColorHex.slice(5, 7), 16);

    // Read combined base and draw layers
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = CANVAS_WIDTH;
    compositeCanvas.height = CANVAS_HEIGHT;
    const compCtx = compositeCanvas.getContext('2d');
    if (!compCtx) return;

    compCtx.drawImage(baseCanvas, 0, 0);
    compCtx.drawImage(drawCanvas, 0, 0);

    const compData = compCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const pixels = compData.data;

    const startPos = (iy * CANVAS_WIDTH + ix) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];

    // If clicking directly on a dark outline, don't fill
    if (startR < 60 && startG < 60 && startB < 60) {
      return;
    }

    // Color match threshold
    const colorMatch = (pos: number) => {
      const pr = pixels[pos];
      const pg = pixels[pos + 1];
      const pb = pixels[pos + 2];
      const diff = Math.abs(pr - startR) + Math.abs(pg - startG) + Math.abs(pb - startB);
      return diff < 45;
    };

    const drawImgData = drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const drawPixels = drawImgData.data;

    // Breadth-first / queue fill
    const queue: [number, number][] = [[ix, iy]];
    const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    visited[iy * CANVAS_WIDTH + ix] = 1;

    let filledCount = 0;
    const maxFill = CANVAS_WIDTH * CANVAS_HEIGHT;

    while (queue.length > 0 && filledCount < maxFill) {
      const [curX, curY] = queue.pop()!;
      const pos = (curY * CANVAS_WIDTH + curX) * 4;

      drawPixels[pos] = r;
      drawPixels[pos + 1] = g;
      drawPixels[pos + 2] = b;
      drawPixels[pos + 3] = 255;
      filledCount++;

      const neighbors: [number, number][] = [
        [curX + 1, curY],
        [curX - 1, curY],
        [curX, curY + 1],
        [curX, curY - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < CANVAS_WIDTH && ny >= 0 && ny < CANVAS_HEIGHT) {
          const nIdx = ny * CANVAS_WIDTH + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const nPos = nIdx * 4;
            if (colorMatch(nPos)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }

    drawCtx.putImageData(drawImgData, 0, 0);
    saveToHistory();
    setHasUnsavedChanges(true);
    if (soundEnabled) sounds.playPop(520);
  };

  // Start Drawing
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (tool === 'bucket') {
      floodFill(x, y, activeColor);
      return;
    }

    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasUnsavedChanges(true);

    if (tool === 'stamp') {
      drawStamp(ctx, x, y, activeColor);
      if (soundEnabled) sounds.playPop(620);
      saveToHistory();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 1.5;
    } else if (tool === 'rainbow') {
      ctx.globalCompositeOperation = 'source-over';
      rainbowHueRef.current = (rainbowHueRef.current + 25) % 360;
      ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 90%, 55%)`;
      ctx.lineWidth = brushSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw single dot on click
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    if (soundEnabled) sounds.playStroke();
  };

  // Drawing in progress
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'bucket' || tool === 'stamp') return;
    e.preventDefault();

    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (tool === 'rainbow') {
      rainbowHueRef.current = (rainbowHueRef.current + 4) % 360;
      ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 90%, 55%)`;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // End Drawing
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };

  // Save current drawing back into the book model
  const handleSavePage = () => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;

    const drawingDataUrl = drawCanvas.toDataURL('image/png');
    onSavePage({
      ...page,
      userDrawingDataUrl: drawingDataUrl,
    });
    setHasUnsavedChanges(false);

    if (soundEnabled) sounds.playFanfare();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
    });

    setCelebrationMessage(`Hooray ${childName}! Page ${pageNumber} has been saved to your coloring book!`);
    setTimeout(() => setCelebrationMessage(null), 4000);
  };

  // Download Single Page PNG
  const handleDownloadPng = () => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    expCtx.fillStyle = '#ffffff';
    expCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Draw base line art then user coloring with multiply blend
    expCtx.drawImage(drawCanvas, 0, 0);
    expCtx.globalCompositeOperation = 'multiply';
    expCtx.drawImage(baseCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = `${childName}-ColorSprout-Page-${pageNumber}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    if (soundEnabled) sounds.playPop(580);
  };

  // Print current page
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-7xl mx-auto pb-12">
      {/* Left / Main Workspace: Canvas and Page Header */}
      <div className="flex-1 flex flex-col items-center w-full">
        {/* Top Control Bar */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-amber-200/60 p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
          {/* Page Selector & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-amber-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-700"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Page {pageNumber} of {totalPages} {page.pageType === 'cover' ? '(Cover)' : page.pageType === 'certificate' ? '(Certificate)' : ''}
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800 leading-tight">
                {page.title}
              </h2>
            </div>
            <button
              onClick={onNextPage}
              disabled={pageNumber >= totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-amber-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-700"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions: Undo, Redo, Clear, Sound, AI Studio */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all"
              title="Clear Colorings"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenAiStudio}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-sm font-bold transition-all shadow-sm"
              title="Prompt AI to edit or generate new art with Gemini Nano Banana 2.1"
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>AI Edit</span>
            </button>
          </div>
        </div>

        {/* Celebration Banner Toast */}
        {celebrationMessage && (
          <div className="w-full bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg mb-4 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2 font-bold text-sm md:text-base">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{celebrationMessage}</span>
            </div>
          </div>
        )}

        {/* The Interactive Coloring Canvas Container */}
        <div
          ref={containerRef}
          className="relative bg-white rounded-3xl shadow-xl border-4 border-amber-300/80 overflow-hidden touch-none select-none w-full max-w-[700px] aspect-[4/5] cursor-crosshair group"
        >
          {/* Base Layer: Line art template */}
          <canvas
            ref={baseCanvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* User Drawing Layer: interactive strokes with multiply blending */}
          <canvas
            ref={drawCanvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />

          {/* Prompt/Story Caption overlay strip at bottom for kids */}
          {page.storyCaption && (
            <div className="absolute bottom-3 left-4 right-4 bg-white/90 backdrop-blur-sm border border-amber-200/80 rounded-xl px-4 py-2 text-center shadow-md pointer-events-none">
              <p className="text-xs md:text-sm font-extrabold text-slate-800 line-clamp-2">
                📖 {page.storyCaption}
              </p>
            </div>
          )}
        </div>

        {/* Primary Save & Export Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full">
          <button
            onClick={handleSavePage}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-base shadow-lg shadow-amber-500/30 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Save to Book & Celebrate!</span>
          </button>
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Page</span>
          </button>
        </div>
      </div>

      {/* Right Sidebar: Tools & Vibrant Color Palette */}
      <div className="w-full lg:w-80 flex flex-col gap-5">
        {/* Tool Selector Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200/60">
          <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Coloring Tools</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTool('brush');
                if (soundEnabled) sounds.playPop(480);
              }}
              className={`flex items-center gap-2.5 p-3 rounded-2xl font-extrabold text-sm transition-all ${
                tool === 'brush'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              <span>Crayon</span>
            </button>

            <button
              onClick={() => {
                setTool('bucket');
                if (soundEnabled) sounds.playPop(520);
              }}
              className={`flex items-center gap-2.5 p-3 rounded-2xl font-extrabold text-sm transition-all ${
                tool === 'bucket'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <PaintBucket className="w-4 h-4" />
              <span>Fill Bucket</span>
            </button>

            <button
              onClick={() => {
                setTool('rainbow');
                if (soundEnabled) sounds.playPop(560);
              }}
              className={`flex items-center gap-2.5 p-3 rounded-2xl font-extrabold text-sm transition-all ${
                tool === 'rainbow'
                  ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Rainbow Pen</span>
            </button>

            <button
              onClick={() => {
                setTool('stamp');
                if (soundEnabled) sounds.playPop(600);
              }}
              className={`flex items-center gap-2.5 p-3 rounded-2xl font-extrabold text-sm transition-all ${
                tool === 'stamp'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Star Stamp</span>
            </button>

            <button
              onClick={() => {
                setTool('eraser');
                if (soundEnabled) sounds.playPop(340);
              }}
              className={`col-span-2 flex items-center justify-center gap-2 p-3 rounded-2xl font-extrabold text-sm transition-all ${
                tool === 'eraser'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>Magic Eraser</span>
            </button>
          </div>

          {/* Brush Size Slider */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span>Stroke Size</span>
              <span className="text-amber-600 font-extrabold">{brushSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">Fine</span>
              <input
                type="range"
                min="6"
                max="60"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-400 font-bold">Chunky</span>
            </div>
            {/* Visual preview of size */}
            <div className="flex justify-center mt-3">
              <div
                className="rounded-full border border-slate-300 transition-all"
                style={{
                  width: `${brushSize}px`,
                  height: `${brushSize}px`,
                  backgroundColor: tool === 'eraser' ? '#ffffff' : activeColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Vibrant Color Palette Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Color Palette
            </h3>
            {/* Native color picker */}
            <label className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer">
              <span>Custom:</span>
              <input
                type="color"
                value={activeColor}
                onChange={(e) => {
                  setActiveColor(e.target.value);
                  if (tool === 'eraser') setTool('brush');
                }}
                className="w-6 h-6 rounded-md cursor-pointer border border-slate-300"
              />
            </label>
          </div>

          {/* Color Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
            {PALETTE.map((c) => {
              const isSelected = activeColor === c.hex && tool !== 'eraser' && tool !== 'rainbow';
              return (
                <button
                  key={c.hex}
                  onClick={() => {
                    setActiveColor(c.hex);
                    if (tool === 'eraser') setTool('brush');
                    if (soundEnabled) sounds.playPop(500);
                  }}
                  className={`w-12 h-12 rounded-2xl transition-all duration-150 relative flex items-center justify-center shadow-sm ${
                    isSelected ? 'scale-110 ring-4 ring-offset-2 ring-slate-800 z-10' : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {c.hex === '#ffffff' && (
                    <div className="absolute inset-0 rounded-2xl border border-slate-300 pointer-events-none" />
                  )}
                  {isSelected && (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        c.hex === '#ffffff' || c.hex === '#fed7aa' || c.hex === '#eab308'
                          ? 'bg-slate-900'
                          : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
