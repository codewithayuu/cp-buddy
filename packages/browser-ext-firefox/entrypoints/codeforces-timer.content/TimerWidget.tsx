import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { storage } from 'wxt/utils/storage';
import { ThemeProvider, createTheme } from '@mui/material';
import { enableAmoledTheme } from '@b/settings';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1a1a1a',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

interface TimerData {
  elapsedMs: number;
  lastStartTimestamp: number | null;
  isRunning: boolean;
  attemptCount: number;
  solvedTimeMs?: number | null;
  verdictCls?: string;
}

export const TimerWidget = ({ problemId, submitEvent }: { problemId: string, submitEvent: EventTarget }) => {
  const storageKey = `local:cftimer_${problemId}`;

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAmoled, setIsAmoled] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [verdictCls, setVerdictCls] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const frameRef = useRef<number>();
  const segmentStartRef = useRef<number | null>(null);
  const initialElapsedRef = useRef<number>(0);
  
  const latestElapsedRef = useRef(elapsed);
  useEffect(() => {
    latestElapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    enableAmoledTheme.getValue().then(setIsAmoled);
    const unwatch = enableAmoledTheme.watch(setIsAmoled);
    return unwatch;
  }, []);

  useEffect(() => {
    storage.getItem<TimerData>(storageKey).then((data) => {
      let initialElapsed = 0;
      let solved = false;
      let shouldRun = false;
      if (data) {
        initialElapsed = data.elapsedMs || 0;
        if (data.isRunning && data.lastStartTimestamp) {
          initialElapsed += (Date.now() - data.lastStartTimestamp);
        }
        if (data.solvedTimeMs != null && !data.isRunning) {
          setIsSolved(true);
          solved = true;
        }
        if (data.verdictCls) {
          setVerdictCls(data.verdictCls);
        }
        shouldRun = data.isRunning;
      }

      if (!data || (!data.elapsedMs && !data.lastStartTimestamp)) {
        if (document.querySelector('.verdict-accepted')) {
          setIsSolved(true);
          solved = true;
          setVerdictCls('ok');
          initialElapsed = 0;
        }
      }
      
      setElapsed(initialElapsed);
      latestElapsedRef.current = initialElapsed;
      
      if (solved) {
        shouldRun = false;
      }
      
      setIsRunning(shouldRun);
      setIsLoaded(true);
    });
  }, [storageKey]);

  const saveState = useCallback((currentElapsed: number, running: boolean, solvedTime: number | null = null, vcls: string = '') => {
    storage.setItem(storageKey, {
      elapsedMs: currentElapsed,
      isRunning: running,
      attemptCount: 1,
      lastStartTimestamp: running ? Date.now() : null,
      solvedTimeMs: solvedTime,
      verdictCls: vcls
    } as TimerData);
  }, [storageKey]);

  useEffect(() => {
    if (isRunning) {
      if (!segmentStartRef.current) {
        segmentStartRef.current = Date.now();
        initialElapsedRef.current = latestElapsedRef.current;
        saveState(initialElapsedRef.current, true, null, verdictCls);
      }
      
      const tick = () => {
        if (segmentStartRef.current) {
          setElapsed(initialElapsedRef.current + (Date.now() - segmentStartRef.current));
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }
    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, saveState, verdictCls]);

  useEffect(() => {
    const handleSubmission = () => {
      let finalTime = latestElapsedRef.current;
      if (segmentStartRef.current) {
        finalTime = initialElapsedRef.current + (Date.now() - segmentStartRef.current);
        segmentStartRef.current = null;
      }
      setIsRunning(false);
      setIsSolved(true);
      setVerdictCls('stopped');
      setElapsed(finalTime);
      saveState(finalTime, false, finalTime, 'stopped');
    };
    submitEvent.addEventListener('cpbuddy-submit-triggered', handleSubmission);
    return () => submitEvent.removeEventListener('cpbuddy-submit-triggered', handleSubmission);
  }, [submitEvent, saveState]);

  useEffect(() => {
    const handleVerdict = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.cls && detail.problemId === problemId) {
        setVerdictCls(detail.cls);
        storage.getItem<TimerData>(storageKey).then(data => {
            if (data) {
                data.verdictCls = detail.cls;
                if (data.isRunning) {
                   data.isRunning = false;
                   let finalTime = latestElapsedRef.current;
                   if (segmentStartRef.current) {
                      finalTime = initialElapsedRef.current + (Date.now() - segmentStartRef.current);
                      segmentStartRef.current = null;
                   }
                   data.elapsedMs = finalTime;
                   data.solvedTimeMs = finalTime;
                   setElapsed(finalTime);
                   setIsRunning(false);
                   setIsSolved(true);
                }
                storage.setItem(storageKey, data);
            }
        });
      }
    };
    document.addEventListener('cpbuddy-verdict', handleVerdict);
    return () => document.removeEventListener('cpbuddy-verdict', handleVerdict);
  }, [storageKey, problemId]);

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRunning(false);
    setIsSolved(false);
    setVerdictCls('');
    setElapsed(0);
    segmentStartRef.current = null;
    initialElapsedRef.current = 0;
    saveState(0, false, null, '');
  };

  const handleTogglePlay = useCallback(() => {
    if (isRunning) {
      let finalTime = latestElapsedRef.current;
      if (segmentStartRef.current) {
        finalTime = initialElapsedRef.current + (Date.now() - segmentStartRef.current);
        segmentStartRef.current = null;
      }
      setIsRunning(false);
      setElapsed(finalTime);
      saveState(finalTime, false, isSolved ? latestElapsedRef.current : null, verdictCls);
    } else {
      setIsRunning(true);
      setIsSolved(false);
      segmentStartRef.current = Date.now();
      initialElapsedRef.current = latestElapsedRef.current;
      saveState(initialElapsedRef.current, true, null, verdictCls);
    }
  }, [isRunning, isSolved, verdictCls, saveState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        const active = document.activeElement;
        if (active) {
          const tag = active.tagName.toLowerCase();
          if (tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable) {
            return;
          }
        }
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isLoaded) return null;

  let iconColor = isAmoled ? '#00b0ff' : '#1976d2';
  let textColor = isAmoled ? '#ffffff' : 'text.primary';
  
  if (!isRunning) {
    if (verdictCls === 'ok') {
      iconColor = isAmoled ? '#00e676' : '#2e7d32'; // vibrant green
      textColor = iconColor;
    } else if (verdictCls === 'fail') {
      iconColor = isAmoled ? '#ff1744' : '#d32f2f'; // vibrant red
      textColor = iconColor;
    } else if (verdictCls === 'pending' || verdictCls === 'stopped') {
      iconColor = isAmoled ? '#00b0ff' : '#1976d2'; // vibrant blue
      textColor = iconColor;
    } else {
      textColor = isAmoled ? '#aaaaaa' : 'text.secondary';
    }
  }

  return (
    <ThemeProvider theme={isAmoled ? theme : lightTheme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        gap: 0.5, 
        ml: 3,
        mt: 1,
        mb: 2,
        lineHeight: 1,
        float: 'left',
        position: 'relative',
        zIndex: 100,
        pointerEvents: 'auto'
      }}>
        <span style={{ 
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '1.2em', 
          color: textColor,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '1px',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility'
        }}>
          {formatTime(elapsed)}
        </span>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTogglePlay(); }} title="Play/Pause (`)" sx={{ p: 0.2, '&:hover': { background: 'rgba(33, 150, 243, 0.1)' }, display: 'flex', alignItems: 'center' }}>
            {isRunning ? <PauseIcon sx={{ fontSize: '1.1rem', color: iconColor }} /> : <PlayArrowIcon sx={{ fontSize: '1.1rem', color: iconColor }} />}
          </IconButton>
          <IconButton size="small" onClick={handleReset} sx={{ p: 0.2, '&:hover': { background: 'rgba(33, 150, 243, 0.1)' }, display: 'flex', alignItems: 'center' }}>
            <RestartAltIcon sx={{ fontSize: '1.1rem', color: iconColor }} />
          </IconButton>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
