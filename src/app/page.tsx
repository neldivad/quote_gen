"use client";
import React, { useRef, useState, useEffect } from "react";

export default function QuoteGen() {
  const [quote, setQuote] = useState("");
  const [quoter, setQuoter] = useState("");
  const [watermark, setWatermark] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });

  useEffect(() => {
    if (!image) return;
    const img = new window.Image();
    img.onload = () => {
      setCanvasSize({ width: img.width, height: img.height });
      setImageObj(img);
    };
    img.src = image;
  }, [image]);

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (let w of words) {
      const testLine = line ? line + " " + w : w;
      const { width } = ctx.measureText(testLine);
      if (width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw image with reduced opacity
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (!quote) return;

    // Auto-fit font size for both width and height
    let fontSize = Math.floor(canvas.height / 12);
    const minFontSize = 14;
    let lines: string[] = [];
    let font = `bold ${fontSize}px sans-serif`;
    let totalTextHeight = 0;
    const maxWidth = canvas.width * 0.8;
    const maxHeight = canvas.height * 0.5; // slightly less to make room for quoter
    while (fontSize >= minFontSize) {
      font = `bold ${fontSize}px sans-serif`;
      lines = wrapText(ctx, quote, maxWidth, font);
      totalTextHeight = lines.length * fontSize * 1.2;
      if (totalTextHeight <= maxHeight) break;
      fontSize -= 2;
    }
    // If still doesn't fit, truncate and add ellipsis
    if (totalTextHeight > maxHeight) {
      let allowedLines = Math.floor(maxHeight / (fontSize * 1.2));
      if (allowedLines < 1) allowedLines = 1;
      lines = lines.slice(0, allowedLines);
      if (lines.length > 0) {
        let last = lines[lines.length - 1];
        while (ctx.measureText(last + "…").width > maxWidth && last.length > 0) {
          last = last.slice(0, -1);
        }
        lines[lines.length - 1] = last + "…";
      }
    }
    // Calculate space for quoter if present
    let quoterFontSize = Math.max(fontSize * 0.7, 12);
    let quoterHeight = quoter ? quoterFontSize * 1.5 : 0;
    // Draw background for text (higher opacity)
    const yStart = canvas.height / 2 - (lines.length * fontSize * 1.2 + quoterHeight) / 2;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#fff";
    ctx.fillRect(
      canvas.width * 0.1,
      yStart - fontSize * 0.6,
      canvas.width * 0.8,
      lines.length * fontSize * 1.2 + fontSize * 1.2 + quoterHeight
    );
    ctx.restore();
    // Draw quote text
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#222";
    lines.forEach((l, i) => {
      ctx.fillText(
        l,
        canvas.width / 2,
        yStart + i * fontSize * 1.2 + fontSize / 2
      );
    });
    // Draw quoter if present
    if (quoter) {
      ctx.font = `italic ${quoterFontSize}px sans-serif`;
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `— ${quoter}`,
        canvas.width / 2,
        yStart + lines.length * fontSize * 1.2 + quoterFontSize
      );
    }
    // Draw watermark if present
    if (watermark) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.font = `bold 14px sans-serif`;
      ctx.fillStyle = "#222";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        watermark,
        canvas.width - 12,
        canvas.height - 10
      );
      ctx.restore();
    }
  }, [imageObj, quote, quoter, watermark, canvasSize]);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "quote.png";
    a.click();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Quote Generator</h1>
        <textarea
          className="border rounded p-2 w-full resize-none min-h-[80px] focus:outline-blue-400"
          placeholder="Enter your quote..."
          value={quote}
          onChange={e => setQuote(e.target.value)}
        />
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Who said it? (optional)"
          value={quoter}
          onChange={e => setQuoter(e.target.value)}
        />
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Watermark (optional)"
          value={watermark}
          onChange={e => setWatermark(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="w-full"
        />
        <button
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleDownload}
          disabled={!imageObj || !quote}
        >
          Download Quote Image
        </button>
      </div>
      <div className="mt-8 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            maxWidth: "350px",
            maxHeight: "350px",
            borderRadius: "1rem",
            boxShadow: "0 2px 16px #0002",
            background: "#eee",
            margin: "auto"
          }}
        />
        <div className="text-xs text-gray-500 mt-2">Preview</div>
      </div>
    </div>
  );
}
