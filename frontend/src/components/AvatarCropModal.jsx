import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move } from 'lucide-react';

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Viewport circle diameter in pixels
  const CROP_SIZE = 260;

  // On image load, compute initial fitting dimensions
  const handleImageLoaded = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Dragging / Panning handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile / touchscreens
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  // Zoom controls
  const handleZoomChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  const zoomIn = () => setScale((prev) => Math.min(3, +(prev + 0.15).toFixed(2)));
  const zoomOut = () => setScale((prev) => Math.max(1, +(prev - 0.15).toFixed(2)));
  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Perform crisp high-res 512x512 circular crop
  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const OUTPUT_SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    // Fill clean dark background
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Calculate source and target coordinates
    // In viewport: the image is displayed at natural aspect ratio scaled to fill the CROP_SIZE box * scale
    const { naturalWidth, naturalHeight } = img;
    const aspect = naturalWidth / naturalHeight;

    let baseWidth, baseHeight;
    if (aspect >= 1) {
      // Landscape or square: match height to CROP_SIZE
      baseHeight = CROP_SIZE;
      baseWidth = CROP_SIZE * aspect;
    } else {
      // Portrait: match width to CROP_SIZE
      baseWidth = CROP_SIZE;
      baseHeight = CROP_SIZE / aspect;
    }

    const currentWidth = baseWidth * scale;
    const currentHeight = baseHeight * scale;

    // Viewport center is at (CROP_SIZE / 2, CROP_SIZE / 2)
    // Canvas output scale ratio
    const outputRatio = OUTPUT_SIZE / CROP_SIZE;

    const drawX = (CROP_SIZE / 2 - currentWidth / 2 + position.x) * outputRatio;
    const drawY = (CROP_SIZE / 2 - currentHeight / 2 + position.y) * outputRatio;
    const drawW = currentWidth * outputRatio;
    const drawH = currentHeight * outputRatio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        const croppedPreviewUrl = URL.createObjectURL(blob);
        onConfirm(croppedFile, croppedPreviewUrl);
      },
      'image/jpeg',
      0.92
    );
  };

  // Compute displayed image base dimensions
  const aspect = imageSize.width && imageSize.height ? imageSize.width / imageSize.height : 1;
  const baseWidth = aspect >= 1 ? CROP_SIZE * aspect : CROP_SIZE;
  const baseHeight = aspect >= 1 ? CROP_SIZE : CROP_SIZE / aspect;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
              SCALE & POSITION AVATAR
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Drag to center. Use the slider to scale your profile photo.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Box */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'relative',
            width: `${CROP_SIZE}px`,
            height: `${CROP_SIZE}px`,
            background: '#070707',
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            border: '3px solid #ffffff',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 24px rgba(255, 255, 255, 0.15)',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Image being scaled and panned */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop target"
            onLoad={handleImageLoaded}
            draggable={false}
            style={{
              position: 'absolute',
              width: `${baseWidth * scale}px`,
              height: `${baseHeight * scale}px`,
              left: `${CROP_SIZE / 2 - (baseWidth * scale) / 2 + position.x}px`,
              top: `${CROP_SIZE / 2 - (baseHeight * scale) / 2 + position.y}px`,
              pointerEvents: 'none',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
          />

          {/* Center alignment guide crosshair overlay (subtle) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '14px',
              height: '14px',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              opacity: 0.3,
              border: '1px dashed #fff',
              borderRadius: '50%'
            }}
          />
        </div>

        {/* Drag Hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px' }}>
          <Move size={12} />
          <span>Click and drag photo to reposition</span>
        </div>

        {/* Zoom Controls */}
        <div style={{ width: '100%', marginTop: '16px', padding: '12px 16px', background: '#161616', borderRadius: '8px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Zoom Scale</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
              {scale.toFixed(2)}x
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={zoomOut}
              style={{
                background: '#222',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={handleZoomChange}
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: '#ffffff'
              }}
            />

            <button
              type="button"
              onClick={zoomIn}
              style={{
                background: '#222',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>

            <button
              type="button"
              onClick={resetTransform}
              style={{
                background: '#222',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#aaa',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Reset Zoom and Position"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyCrop}
            style={{ flex: 1.5, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Check size={16} /> Apply Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
