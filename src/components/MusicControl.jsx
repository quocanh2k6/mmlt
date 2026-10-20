import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * MusicControl — Toggle button for background music.
 * Gracefully handles missing audio files.
 */
export default function MusicControl({ stage }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Try to load audio file — fail silently if not found
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.4;

    // Try multiple possible music file paths
    const sources = ['/music/background.mp3', '/music.mp3', '/audio/bg.mp3'];
    let loaded = false;

    const trySource = (index) => {
      if (index >= sources.length) {
        setHasAudio(false);
        return;
      }
      audio.src = sources[index];
      audio.addEventListener('canplaythrough', () => {
        if (!loaded) {
          loaded = true;
          audioRef.current = audio;
        }
      }, { once: true });
      audio.addEventListener('error', () => {
        if (!loaded) trySource(index + 1);
      }, { once: true });
      audio.load();
    };

    trySource(0);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Browser blocked autoplay
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  // Auto-play when journey starts (if user has interacted)
  useEffect(() => {
    if (stage === 'gathering' && audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked — that's ok
      });
    }
  }, [stage]);

  // Don't show control if no audio available and stage is still early
  if (!hasAudio && stage === 'void') return null;

  return (
    <button
      className="music-control"
      onClick={toggleMusic}
      aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
      title={!hasAudio ? 'Chưa có file nhạc' : isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
      style={!hasAudio ? { opacity: 0.3, cursor: 'default' } : {}}
      id="music-toggle"
    >
      <div className={`music-bars ${isPlaying ? 'playing' : ''}`}>
        <span className="music-bar" style={{ height: '8px' }} />
        <span className="music-bar" style={{ height: '12px' }} />
        <span className="music-bar" style={{ height: '6px' }} />
        <span className="music-bar" style={{ height: '10px' }} />
      </div>
    </button>
  );
}
