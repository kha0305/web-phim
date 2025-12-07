import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ src, poster, initialTime = 0, onProgress, skipSegments = [], onNext, onPrev, hasNext, hasPrev }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const hlsRef = useRef(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('videoVolume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videoVolume');
    return saved !== null ? parseFloat(saved) === 0 : false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Apply volume on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Initialize HLS
  useEffect(() => {
    let hls;
    if (Hls.isSupported() && src) {
      hls = new Hls({
        startPosition: initialTime
      });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate
        }));
        setQualityLevels(levels);
        hlsRef.current = hls;
        if (initialTime > 0) {
           videoRef.current.currentTime = initialTime;
        }
        // Ensure volume is applied after HLS attach
        videoRef.current.volume = volume;
        
        // Disable subtitles by default to prevent thumbnail tracks (sprite maps) from showing as text
        hls.subtitleTrack = -1;
        hls.subtitleDisplay = false;
        
        // Also force disable any native text tracks potentially created
        if (videoRef.current && videoRef.current.textTracks) {
           const disableTracks = () => {
              for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                videoRef.current.textTracks[i].mode = 'disabled';
              }
           };

           // Disable initial tracks
           disableTracks();

           // Listen for new tracks added asynchronously and disable them
           videoRef.current.textTracks.addEventListener('addtrack', disableTracks);
        }
      });
      
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
      }
      videoRef.current.volume = volume;
    }

    return () => {
      if (hls) hls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, initialTime]);

  // Controls Visibility Logic
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 5000);
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [handleMouseMove, isPlaying]);

  // Video Event Handlers
  const togglePlay = useCallback(() => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      handleMouseMove(); // Keep controls visible briefly
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true); // Always show controls when paused
    }
  }, [handleMouseMove]);

  const [showSkipButton, setShowSkipButton] = useState(null); // { start, end, label }

  const handleTimeUpdate = () => {
    const time = videoRef.current.currentTime;
    const totalDuration = videoRef.current.duration;
    
    // Skip Button Logic
    let activeSegment = null;
    if (skipSegments && skipSegments.length > 0) {
      for (const segment of skipSegments) {
        if (time >= segment.start && time < segment.end) {
          activeSegment = segment;
          break;
        }
      }
    }
    setShowSkipButton(activeSegment);

    setCurrentTime(time);
    if (onProgress) {
      onProgress(time, totalDuration);
    }
  };

  const handleSkip = () => {
    if (showSkipButton && videoRef.current) {
      videoRef.current.currentTime = showSkipButton.end;
      setShowSkipButton(null);
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    if (initialTime > 0 && Math.abs(videoRef.current.currentTime - initialTime) > 1) {
       videoRef.current.currentTime = initialTime;
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    videoRef.current.volume = vol;
    setIsMuted(vol === 0);
    localStorage.setItem('videoVolume', vol);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleQualityChange = (event) => {
    const newQuality = parseInt(event.target.value);
    setCurrentQuality(newQuality);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = newQuality;
    }
  };

  const formatTime = (time) => {
    if (!time) return '00m00s';
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}h${pad(minutes)}m${pad(seconds)}s`;
    } else {
      return `${pad(minutes)}m${pad(seconds)}s`;
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
             videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
             handleMouseMove();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
             videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
             handleMouseMove();
          }
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, handleMouseMove]);

  return (
    <div 
      className="video-player-container custom-player" 
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        poster={poster}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (hasNext && onNext) {
            onNext();
          }
        }}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }}
      />
      
      {/* Overlay Play Button (Centered) */}
      {!isPlaying && (
        <div className="center-play-btn" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" fill="white" width="64" height="64">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      {/* Skip Button */}
      {showSkipButton && (
        <button 
          className="skip-btn"
          onClick={handleSkip}
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 20,
            backdropFilter: 'blur(5px)',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showSkipButton.label || "Bỏ qua"} 
          <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        </button>
      )}

      {/* Custom Controls Bar */}
      <div className={`custom-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="progress-bar"
            style={{
              backgroundSize: `${(currentTime / duration) * 100}% 100%`
            }}
          />
        </div>

        <div className="controls-row">
          <div className="left-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            
            {/* Prev/Next Buttons */}
            {hasPrev && (
              <button className="control-btn" onClick={onPrev} title="Tập trước">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
            )}
            {hasNext && (
              <button className="control-btn" onClick={onNext} title="Tập tiếp theo">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            )}
            
            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{
                  backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%`
                }}
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>

          <div className="right-controls">
            {/* Speed Control */}
            <div className="speed-control" style={{ position: 'relative', marginRight: '10px' }}>
               <select
                 value={videoRef.current?.playbackRate || 1}
                 onChange={(e) => {
                   const rate = parseFloat(e.target.value);
                   if (videoRef.current) videoRef.current.playbackRate = rate;
                   // Force re-render to update UI if needed, usually simple select is enough
                 }}
                 className="speed-select"
                 style={{
                   background: 'transparent', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer', outline: 'none'
                 }}
               >
                 <option value="0.5">0.5x</option>
                 <option value="0.75">0.75x</option>
                 <option value="1">1x</option>
                 <option value="1.25">1.25x</option>
                 <option value="1.5">1.5x</option>
                 <option value="2">2x</option>
               </select>
            </div>

            {/* PiP Button */}
            {document.pictureInPictureEnabled && (
              <button 
                className="control-btn" 
                onClick={async () => {
                  try {
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture();
                    } else if (videoRef.current) {
                      await videoRef.current.requestPictureInPicture();
                    }
                  } catch (error) {
                    console.error("PiP failed:", error);
                  }
                }}
                title="Picture in Picture"
              >
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.97h18v14.04z"/></svg>
              </button>
            )}

            {qualityLevels.length > 0 && (
              <select 
                value={currentQuality} 
                onChange={handleQualityChange}
                className="quality-select"
              >
                <option value="-1">Auto</option>
                {qualityLevels.map((level) => (
                  <option key={level.index} value={level.index}>
                    {level.height}p
                  </option>
                ))}
              </select>
            )}

            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
