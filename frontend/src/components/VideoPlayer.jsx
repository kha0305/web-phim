import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

// Helper to convert SRT to WebVTT
const srtToVtt = (srtContent) => {
  let vtt = "WEBVTT\n\n";
  vtt += srtContent
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2') // Fix timestamp format
    .replace(/\r\n|\r/g, '\n'); // Normalize newlines
  return vtt;
};

const VideoPlayer = ({ src, poster, initialTime = 0, onProgress, skipSegments = [], onNext, onPrev, hasNext, hasPrev }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const hlsRef = useRef(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  
  // Custom Subtitles State
  const [subtitles, setSubtitles] = useState([]); // Array of { label, src, lang }
  const [activeSubtitle, setActiveSubtitle] = useState(-1); // -1 = Off
  const [showSubMenu, setShowSubMenu] = useState(false);

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('videoVolume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videoVolume');
    return saved !== null ? parseFloat(saved) === 0 : false;
  });
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem('videoSpeed');
    return saved !== null ? parseFloat(saved) : 1;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Apply volume and speed on mount/update
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Clean up subtitle blob URLs
  useEffect(() => {
    return () => {
      subtitles.forEach(sub => {
        if (sub.isBlob) URL.revokeObjectURL(sub.src);
      });
    };
  }, [subtitles]);

  // Handle Subtitle Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result;
      let vttUrl = '';

      if (file.name.endsWith('.srt')) {
         content = srtToVtt(content);
      }
      
      const blob = new Blob([content], { type: 'text/vtt' });
      vttUrl = URL.createObjectURL(blob);

      const newSub = { 
        label: file.name, 
        src: vttUrl, 
        lang: 'custom', 
        isBlob: true 
      };

      setSubtitles(prev => [...prev, newSub]);
      setActiveSubtitle(subtitles.length); // Select new sub index
      setShowSubMenu(false);
    };
    reader.readAsText(file);
  };

  // Initialize HLS
  useEffect(() => {
    let hls;
    if (Hls.isSupported() && src) {
      hls = new Hls({
        startPosition: initialTime,
        enableWebVTT: true,
        subtitleStartLoad: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
      });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate
        }));
        // Parse HLS Subtitles
        const hlsSubs = [];
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
            hls.subtitleTracks.forEach((t, i) => {
                hlsSubs.push({
                    label: t.name || `Sub ${i + 1} (${t.lang || 'unk'})`,
                    id: i,
                    index: i,
                    type: 'hls',
                    lang: t.lang,
                    isHls: true
                });
            });
        }

        setQualityLevels(levels);
        hlsRef.current = hls; // Ensure ref is set before using in logic below? No, ref update is async safe but here immediate.
        
        // Update Subtitles State
        setSubtitles(hlsSubs);

        // Auto-select Vietnamese or First sub
        if (hlsSubs.length > 0) {
            const viIndex = hlsSubs.findIndex(s => s.lang === 'vi' || (s.label && s.label.toLowerCase().includes('viet')));
            const initialSub = viIndex !== -1 ? viIndex : 0;
            setActiveSubtitle(initialSub);
            hls.subtitleTrack = hlsSubs[initialSub].index;
            hls.subtitleDisplay = true;
        } else {
             hls.subtitleTrack = -1;
             hls.subtitleDisplay = false;
        }

        if (initialTime > 0) {
           videoRef.current.currentTime = initialTime;
        }
        videoRef.current.volume = volume;
        videoRef.current.playbackRate = playbackRate;
      });
      
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error (HLS), recovering...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error (HLS), recovering...");
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
      videoRef.current.playbackRate = playbackRate;
    }

    return () => {
      if (hls) hls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, initialTime]);

  // Controls Visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      // Don't hide if paused, showing submenu, or hovering controls
      if (isPlaying && !showSubMenu && !isHoveringControls) { 
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showSubMenu, isHoveringControls]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying && !showSubMenu) setShowControls(false);
  }, [isPlaying, showSubMenu]);

  // If hovering controls state changes, we might need to re-evaluate or just let next move handle it.
  // Actually, if we enter controls, we should clear timeout.
  useEffect(() => {
     if (isHoveringControls) {
         if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
         setShowControls(true);
     } else if (isPlaying) {
         // Re-trigger hide timer if we left controls and are playing
         handleMouseMove();
     }
  }, [isHoveringControls, isPlaying, handleMouseMove]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // ... (Keep existing Play/Progress/Volume functions) ...
  const togglePlay = useCallback(() => {
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      handleMouseMove();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  }, [handleMouseMove]);

  const [showSkipButton, setShowSkipButton] = useState(null);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return; 
    const time = vid.currentTime;
    
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
    if (onProgress) onProgress(time, vid.duration);
    
    if (vid.buffered.length > 0) {
      for (let i = 0; i < vid.buffered.length; i++) {
        if (vid.buffered.start(i) <= time && vid.buffered.end(i) >= time) {
           setBuffered(vid.buffered.end(i));
           break;
        }
      }
    }
  };

  const handleSkip = () => {
    if (showSkipButton && videoRef.current) {
      videoRef.current.currentTime = showSkipButton.end;
      setShowSkipButton(null);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
       setDuration(videoRef.current.duration);
       if (initialTime > 0 && Math.abs(videoRef.current.currentTime - initialTime) > 1) {
          videoRef.current.currentTime = initialTime;
       }
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
  
  const toggleMute = useCallback(() => {
    if (isMuted) {
      const newVol = volume || 1;
      videoRef.current.volume = newVol;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleSpeedChange = (e) => {
      const rate = parseFloat(e.target.value);
      setPlaybackRate(rate);
      if (videoRef.current) videoRef.current.playbackRate = rate;
      localStorage.setItem('videoSpeed', rate);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
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
    if (!time) return '00:00';
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => num.toString().padStart(2, '0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      switch(e.key) {
        case 'ArrowRight': 
        case 'l':
        case 'L':
            e.preventDefault(); 
            if (videoRef.current) { 
                videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); 
                handleMouseMove(); 
            } 
            break;
        case 'ArrowLeft': 
        case 'j':
        case 'J':
            e.preventDefault(); 
            if (videoRef.current) { 
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); 
                handleMouseMove(); 
            } 
            break;
        case 'ArrowUp':
            e.preventDefault();
            setVolume(v => {
                const newVol = Math.min(1, v + 0.1);
                localStorage.setItem('videoVolume', newVol);
                return newVol;
            });
            handleMouseMove();
            break;
        case 'ArrowDown':
            e.preventDefault();
            setVolume(v => {
                const newVol = Math.max(0, v - 0.1);
                localStorage.setItem('videoVolume', newVol);
                return newVol;
            });
            handleMouseMove();
            break;
        case ' ': 
        case 'k':
        case 'K':
            e.preventDefault(); 
            togglePlay(); 
            break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': toggleMute(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, handleMouseMove]);
  
  // Loading
  const handleWaiting = () => setIsWaiting(true);
  const handlePlaying = () => { setIsWaiting(false); setIsPlaying(true); };
  const handleCanPlay = () => setIsWaiting(false);

  return (
    <div 
      className={`video-player-container custom-player ${!showControls && isPlaying ? 'hide-cursor' : ''}`} 
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
      onMouseMove={handleMouseMove}
      onPointerMove={handleMouseMove} // Better support for some devices/browsers
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        poster={poster}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onCanPlay={handleCanPlay}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
           setIsPlaying(false);
           if (hasNext && onNext) onNext();
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        crossOrigin="anonymous" // Essential for tracks
      >
        {subtitles.map((sub, index) => (
           !sub.isHls && (
             <track
               key={index}
               kind="subtitles"
               label={sub.label}
               src={sub.src}
               srcLang={sub.lang}
               default={index === activeSubtitle}
             />
           )
        ))}
        {/* We manipulate mode manually, but React needs default/mode prop hint */}
      </video>

      {useEffect(() => {
         // Sync HLS
         if (hlsRef.current) {
             const currentSub = subtitles[activeSubtitle];
             if (currentSub && currentSub.isHls) {
                 hlsRef.current.subtitleTrack = currentSub.index;
                 hlsRef.current.subtitleDisplay = true;
             } else {
                 hlsRef.current.subtitleTrack = -1;
                 hlsRef.current.subtitleDisplay = false;
             }
         }

         // Sync Native Tracks
         if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
               const track = tracks[i];
               // If using HLS sub, hide all native text tracks (unless HLS uses native tracks?)
               // HLS.js with enableWebVTT: true might be piping cues to a native track.
               // Check if this track corresponds to our active custom subtitle.
               
               const currentSub = subtitles[activeSubtitle];
               
               // If active sub is Custom (not HLS) 
               if (currentSub && !currentSub.isHls) {
                   // Compare loosely or by index similarity if we mapped them 1:1. 
                   // However, native tracks list might include HLS tracks if enableWebVTT is true!
                   // Simpler approach: 
                   // If HLS sub is active, we rely on HLS display (which might be native or canvas).
                   // If Custom sub is active, we find the track with matching src/label and show it.
                   
                   // Note: track.src might not be available on TextTrack object. Use label/language.
                   if (track.label === currentSub.label) {
                       track.mode = 'showing';
                   } else {
                       track.mode = 'hidden';
                   }
               } else {
                   // HLS Sub active or None active -> Hide "Custom" tracks.
                   // But wait, if HLS uses native tracks, we shouldn't hide them if HLS enables them.
                   // HLS.js controls its own tracks.
                   // Safest: Hide only the tracks we know are custom?
                   // Or just let HLS manage its tracks and we manage ours.
                   
                   // If "Off" (-1), hide everything
                   if (activeSubtitle === -1) {
                       track.mode = 'hidden';
                   }
                   
                   // If custom sub not active, we force hide?
                   // Let's rely on the loop above: we iterated all tracks.
                   // If currentSub.isHls, we enabled HLS. We should ensure custom tracks are hidden.
                   // Identifying custom tracks: they have blob URLs usually, but TextTrack obj doesn't show src.
                   // We can assume if it's HLS managed, HLS will toggle `mode`. 
                   // We just need to ensure we don't conflict.
                   
                   // Since we moved `enableWebVTT: true`, HLS might create native tracks.
                   // For now, let's just loop and set 'hidden' only if we are sure we want to hide it.
                   // Actually, with HLS.js, changing subtitleTrack usually updates the mode of the corresponding native track if enableWebVTT is on.
                   // So we only need to manage non-HLS scenarios explicitly or "Off".
                   
                   if (activeSubtitle === -1) {
                      track.mode = 'hidden';
                   } else if (currentSub && !currentSub.isHls && track.label === currentSub.label) {
                      track.mode = 'showing';
                   } else if (currentSub && !currentSub.isHls) {
                      track.mode = 'hidden';
                   }
                   // If HLS is active, we let HLS do its thing, unless we want to force hide others?
                   // HLS usually manages its own.
                   
               }
            }
         }
      }, [activeSubtitle, subtitles]) || null}
      
      {/* Loading Spinner */}
      {isWaiting && ( <div className="video-loader"><div className="spinner"></div></div> )}

      {/* Play Button Overlay */}
      {!isPlaying && !isWaiting && (
        <div className="center-play-btn" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" fill="white" width="64" height="64"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}

      {/* Skip Button */}
      {showSkipButton && (
        <button className="skip-btn" onClick={handleSkip} 
          style={{
             position: 'absolute', bottom: '120px', right: '20px', padding: '12px 24px',
             backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid var(--primary-color)',
             color: 'var(--primary-color)', borderRadius: '6px', cursor: 'pointer', zIndex: 100,
             fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
             boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transition: 'all 0.2s ease'
          }}>
          {showSkipButton.label || "Bỏ qua"} <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        </button>
      )}

      {/* Controls */}
      <div 
          className={`custom-controls ${showControls ? 'visible' : 'hidden'}`}
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
          onClick={(e) => e.stopPropagation()} 
      >
        <div style={{position: 'absolute', right: '20px', bottom: '60px', color: 'rgba(255,255,255,0.5)', fontSize: '10px', pointerEvents: 'none'}}>Space: Play | F: Full | M: Mute | Arrows: Seek/Vol</div>

        <div className="progress-bar-container">
           <div className="buffered-bar" style={{ position: 'absolute', top: '50%', left: 0, height: '4px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.4)', borderRadius: '2px', width: `${(buffered / (duration || 1)) * 100}%` }}></div>
           <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="progress-bar" style={{ backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%` }} />
        </div>

        <div className="controls-row">
          <div className="left-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            {hasPrev && <button className="control-btn" onClick={onPrev} title="Previous"><svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>}
            {hasNext && <button className="control-btn" onClick={onNext} title="Next"><svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>}
            
            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> : <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}
              </button>
              <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider" style={{ backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%` }} />
            </div>
            <span className="time-display">{formatTime(currentTime)} / {formatTime(duration || 0)}</span>
          </div>

          <div className="right-controls">
            {/* Speed Control */}
            <select value={playbackRate} onChange={handleSpeedChange} className="speed-select" style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer', outline: 'none', marginRight: '10px' }}>
               <option value="0.5">0.5x</option><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option>
            </select>

            {/* Subtitle (CC) Button */}
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
               <button 
                  className="control-btn" 
                  onClick={() => setShowSubMenu(!showSubMenu)}
                  title="Phụ đề / Subtitles"
               >
                  <svg viewBox="0 0 24 24" fill={activeSubtitle >= 0 ? "var(--primary-color)" : "white"} width="24" height="24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/></svg>
               </button>

               {/* Subtitle Menu */}
               {showSubMenu && (
                  <div className="subtitle-menu" style={{
                      position: 'absolute', bottom: '100%', right: '0', 
                      background: 'rgba(0,0,0,0.9)', borderRadius: '8px', 
                      padding: '10px', minWidth: '150px', marginBottom: '10px',
                      display: 'flex', flexDirection: 'column', gap: '5px',
                      border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                      <div 
                         style={{padding: '5px 10px', cursor: 'pointer', color: activeSubtitle === -1 ? 'var(--primary-color)' : 'white'}}
                         onClick={() => { setActiveSubtitle(-1); setShowSubMenu(false); }}
                      >
                         Tắt (Off)
                      </div>
                      
                      <div style={{height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0'}}></div>
                      
                      {subtitles.map((sub, idx) => (
                         <div
                            key={idx}
                            style={{
                               padding: '5px 10px', cursor: 'pointer', 
                               color: activeSubtitle === idx ? 'var(--primary-color)' : 'white',
                               maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}
                            onClick={() => { setActiveSubtitle(idx); setShowSubMenu(false); }}
                         >
                            {sub.label}
                         </div>
                      ))}

                      <div style={{height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0'}}></div>

                      <label style={{
                            padding: '5px 10px', cursor: 'pointer', color: '#aaa', 
                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem'
                         }}>
                         <span>📤 Tải lên (.srt, .vtt)</span>
                         <input 
                            type="file" 
                            accept=".srt,.vtt" 
                            style={{display: 'none'}} 
                            onChange={handleFileUpload} 
                            ref={fileInputRef}
                         />
                      </label>
                  </div>
               )}
            </div>

            {/* Quality Select */}
            {qualityLevels.length > 0 && (
              <select value={currentQuality} onChange={handleQualityChange} className="quality-select">
                <option value="-1">Auto</option>
                {qualityLevels.map((level) => <option key={level.index} value={level.index}>{level.height}p</option>)}
              </select>
            )}

            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5z"/></svg> : <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v2h2V5h-5z"/></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
