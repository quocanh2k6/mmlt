import React, { useState, useCallback, useEffect, useRef } from 'react';
import Scene3D from './components/Scene3D';
import LoveLetter from './components/LoveLetter';
import MusicControl from './components/MusicControl';

/**
 * FloatingHeartsOverlay — Emoji hearts that float up when "hug" button is pressed.
 */
function FloatingHeartsOverlay({ hearts }) {
  return (
    <div className="floating-hearts-container">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="floating-heart-emoji"
          style={{
            left: `${heart.x}%`,
            fontSize: `${heart.size}px`,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
            opacity: 1,
          }}
        >
          {heart.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * App — Main application component.
 * Manages the 5-stage flow: Loading → Void → Gathering → Explosion → Letter → Forever
 */
export default function App() {
  const [stage, setStage] = useState('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [webglSupported, setWebglSupported] = useState(true);
  const heartIdCounter = useRef(0);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Transition from loading to void when scene is ready
  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
    // Small delay for a smooth transition
    setTimeout(() => setStage('void'), 800);
  }, []);

  // Handle start button click
  const handleStart = useCallback(() => {
    setStage('gathering');
  }, []);

  // Handle stage completion from 3D scene
  const handleStageComplete = useCallback((completedStage) => {
    switch (completedStage) {
      case 'gathering':
        // Hold the formed heart for a moment, then start explosion
        setTimeout(() => setStage('explosion'), 2000);
        break;
      case 'explosion':
        // After explosion settles, show letter
        setTimeout(() => {
          setStage('letter');
          setShowLetter(true);
        }, 1200);
        break;
      default:
        break;
    }
  }, []);

  // Close letter → go to forever stage
  const handleCloseLetter = useCallback(() => {
    setShowLetter(false);
    setTimeout(() => setStage('forever'), 500);
  }, []);

  // Replay entire journey
  const handleReplayJourney = useCallback(() => {
    setShowLetter(false);
    setStage('void');
    // Give a moment for reset, then auto-start
    setTimeout(() => setStage('gathering'), 1500);
  }, []);

  // Replay just the heart gathering moment
  const handleReplayHeart = useCallback(() => {
    setStage('void');
    setTimeout(() => setStage('gathering'), 1000);
  }, []);

  // Read letter again
  const handleReadLetter = useCallback(() => {
    setStage('letter');
    setShowLetter(true);
  }, []);

  // Hug button — spawn floating heart emojis
  const handleHug = useCallback(() => {
    const emojis = ['❤️', '💕', '💖', '💗', '💝', '💞', '🥰', '✨', '🌹'];
    const newHearts = [];
    const count = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      heartIdCounter.current++;
      newHearts.push({
        id: heartIdCounter.current,
        x: 5 + Math.random() * 90,
        size: 18 + Math.random() * 20,
        duration: 2.5 + Math.random() * 2,
        delay: Math.random() * 1.5,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }

    setFloatingHearts((prev) => [...prev, ...newHearts]);

    // Clean up after animation completes
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.find((nh) => nh.id === h.id))
      );
    }, 5000);
  }, []);

  // WebGL fallback
  if (!webglSupported) {
    return (
      <div className="webgl-fallback">
        <h1>Gửi vợ yêu ❤️</h1>
        <p>
          Trình duyệt của em chưa hỗ trợ WebGL để hiển thị hiệu ứng 3D.
          Hãy thử mở bằng Chrome hoặc Firefox trên máy tính nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 3D Scene — always rendered */}
      <Scene3D
        stage={stage}
        onStageComplete={handleStageComplete}
        onReady={handleSceneReady}
      />

      {/* Loading Screen */}
      {stage === 'loading' && (
        <div className={`loading-screen ${sceneReady ? 'fade-out' : ''}`}>
          <div className="loading-heart" />
          <p className="loading-text">Đang chuẩn bị món quà...</p>
        </div>
      )}

      {/* Void Stage — Intro */}
      {stage === 'void' && (
        <div className="overlay">
          <div className="intro-container">
            <p className="intro-text">
              Anh có một món quà dành riêng cho em…
            </p>
            <button
              className="start-button"
              onClick={handleStart}
              id="start-journey-btn"
            >
              Bắt đầu hành trình yêu thương ♡
            </button>
          </div>
        </div>
      )}

      {/* Gathering Stage — Center text */}
      {stage === 'gathering' && (
        <div className="overlay" style={{ pointerEvents: 'none' }}>
          <GatheringText />
        </div>
      )}

      {/* Love Letter */}
      <LoveLetter
        visible={showLetter}
        onClose={handleCloseLetter}
        onReplayJourney={handleReplayJourney}
      />

      {/* Forever Stage — Final messages & buttons */}
      {stage === 'forever' && (
        <div className="overlay">
          <div className="forever-container">
            <p className="forever-title">
              20/10 — Ngày đặc biệt dành cho người phụ nữ đặc biệt nhất của anh.
            </p>
            <p className="forever-subtitle">
              Anh yêu em. Hôm nay, ngày mai và cả những ngày sau nữa.
            </p>
            <div className="forever-buttons">
              <button
                className="forever-btn"
                onClick={handleReadLetter}
                id="reread-letter-btn"
              >
                📖 Đọc lại thư tình
              </button>
              <button
                className="forever-btn"
                onClick={handleReplayHeart}
                id="replay-heart-btn"
              >
                💕 Xem lại khoảnh khắc trái tim
              </button>
              <button
                className="forever-btn"
                onClick={handleHug}
                id="send-hug-btn"
              >
                Gửi anh một cái ôm ❤️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating hearts from hug button */}
      <FloatingHeartsOverlay hearts={floatingHearts} />

      {/* Music control — always visible after void */}
      {stage !== 'loading' && <MusicControl stage={stage} />}
    </div>
  );
}

/**
 * GatheringText — Shows the gathering message after hearts have mostly formed.
 * Appears after a delay to coincide with heart formation.
 */
function GatheringText() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5500); // Show near end of gathering
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className={`gathering-text ${visible ? 'visible' : ''}`}>
      Em là điều tuyệt vời nhất mà cuộc đời đã dành cho anh.
    </p>
  );
}
