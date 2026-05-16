import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

export type PomodoroPhase = 'idle' | 'work' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  totalCycles: number;
  soundEnabled: boolean;
  autoStartBreak: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  totalCycles: 4,
  soundEnabled: true,
  autoStartBreak: true,
};

const STORAGE_KEY = 'pomodoro-settings';

function loadSettings(): PomodoroSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        // migrate old field names
        breakMinutes: parsed.breakMinutes ?? parsed.shortBreakMinutes ?? DEFAULT_SETTINGS.breakMinutes,
        totalCycles: parsed.totalCycles ?? parsed.pomodorosBeforeLongBreak ?? DEFAULT_SETTINGS.totalCycles,
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: PomodoroSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function getPhaseSeconds(phase: PomodoroPhase, s: PomodoroSettings): number {
  switch (phase) {
    case 'work': return s.workMinutes * 60;
    case 'short_break': return s.breakMinutes * 60;
    case 'long_break': return s.longBreakMinutes * 60;
    default: return 0;
  }
}

function nextBreakPhase(cycleCount: number, s: PomodoroSettings): PomodoroPhase {
  return cycleCount % s.totalCycles === 0 ? 'long_break' : 'short_break';
}

interface PendingSession {
  activityId: string;
  durationMinutes: number;
  startTime: string;
}

export function usePomodoro(userId: string | undefined) {
  const supabase = createClient();
  const qc = useQueryClient();

  const [settings, setSettingsState] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<PomodoroPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs so completion logic always reads fresh state without extra effect deps
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const cycleCountRef = useRef(cycleCount);
  cycleCountRef.current = cycleCount;
  const selectedActivityIdRef = useRef(selectedActivityId);
  selectedActivityIdRef.current = selectedActivityId;
  const sessionStartTimeRef = useRef(sessionStartTime);
  sessionStartTimeRef.current = sessionStartTime;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  // Timer tick — only runs while isRunning
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const playSound = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkI+Hf3V2goqOjomDe3d5g4uQj4mDe3Z5goqPjoiDe3Z5goqOjYiCe3V4gYmNjIeBeXR3gImNjIeBeXR3gImMjIeAeHN2f4iMi4aAeHN2f4iMi4aAeHN2f4iMi4aAd3J1foeLi4aAd3J1foeLi4aAd3J1foeLi4aAd3J1foeKioWAd3J1foeKioWAd3J1foeKioWAd3J1foeJiYR/dnF0fYaJiYR/dnF0fYaJiYR/dnF0fYaJiIN+dXFzfIWIiIN+dXFzfIWIiIN+dXFzfIWIh4J9dG9ye4OGh4J9dG9ye4OGh4J9dG9ye4OGhoF8c25xeYKFhYF7cm1weYGFhYF7cm1weYGFhIF7c21veICDhIF7c21veICDhIF7c21veICDg4B6cmtudn+Bgn96cWpsdX6AgX55cGlrdH2AgH14b2hqc3yAfn13bmdpcnuAfXx2bWZocXp/fHt1bGRncHl+e3p0a2Nmb3h9enlya2FkbnZ8eHhxa19jbHV7d3dwal5ianR6dnZval1haHN5dXVual1gZ3J4dHRtal1gZ3J3c3Nsal1fZnF2cnJsal1eZW91cXFsal1dZW10cG9saV1cZG1zb25saF1bY2xycW1rZ11aYmtxcGxrZl1ZYWpwb2tqZlxYYGlwbmpqZVxXYGlvbmppZVtWX2hubWloZFpVXmdtbGhnY1lUXWZs');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const registerSession = useMutation({
    mutationFn: async ({
      activityId, durationMinutes, startTime, mood, productivityLevel, notes, bookTitle,
    }: {
      activityId: string;
      durationMinutes: number;
      startTime: string;
      mood: number;
      productivityLevel: number;
      notes?: string;
      bookTitle?: string;
    }) => {
      const formattedTime = startTime
        ? new Date(startTime).toLocaleTimeString('en-GB', { hour12: false })
        : null;
      const { data, error } = await supabase.from('sessions').insert({
        activity_id: activityId,
        duration_minutes: durationMinutes,
        session_date: new Date().toISOString().split('T')[0],
        start_time: formattedTime,
        mood,
        productivity_level: productivityLevel,
        notes: notes?.trim() || undefined,
        book_title: bookTitle?.trim() || undefined,
      }).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', userId] });
      qc.invalidateQueries({ queryKey: ['weekly-summary', userId] });
      qc.invalidateQueries({ queryKey: ['habit-progress', userId] });
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  // Stored in a ref so the completion effect has no stale-closure risk
  const handleCompletionRef = useRef<() => void>(() => {});
  handleCompletionRef.current = () => {
    playSound();
    const currentPhase = phaseRef.current;
    const s = settingsRef.current;
    const currentCycles = cycleCountRef.current;
    const activityId = selectedActivityIdRef.current;
    const startTime = sessionStartTimeRef.current;
    const uid = userIdRef.current;

    if (currentPhase === 'work') {
      const newCycles = currentCycles + 1;
      setCycleCount(newCycles);
      setTotalFocusMinutes(prev => prev + s.workMinutes);

      if (activityId && uid) {
        setPendingSession({ activityId, durationMinutes: s.workMinutes, startTime });
      }

      const next = nextBreakPhase(newCycles, s);
      if (s.autoStartBreak) {
        setPhase(next);
        setSecondsLeft(getPhaseSeconds(next, s));
        setIsRunning(true);
        setSessionStartTime('');
      } else {
        setPhase('idle');
        setSecondsLeft(0);
      }
    } else {
      setPhase('idle');
      setSecondsLeft(0);
    }
  };

  // Detect timer completion (secondsLeft hits 0 while a phase is active)
  useEffect(() => {
    if (secondsLeft === 0 && phase !== 'idle') {
      setIsRunning(false);
      handleCompletionRef.current();
    }
  }, [secondsLeft, phase]);

  const start = useCallback(() => {
    if (!selectedActivityId) return;
    if (phase === 'idle') {
      const secs = settingsRef.current.workMinutes * 60;
      setPhase('work');
      setSecondsLeft(secs);
      setSessionStartTime(new Date().toISOString());
    }
    setIsRunning(true);
  }, [phase, selectedActivityId]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(0);
    setSessionStartTime('');
    setPendingSession(null);
  }, []);

  const skip = useCallback(() => {
    if (phase === 'idle') return;
    setIsRunning(false);
    setSecondsLeft(0);
    // The secondsLeft effect will detect secondsLeft=0 & phase!='idle' and call handleCompletionRef
  }, [phase]);

  const updateSettings = useCallback((partial: Partial<PomodoroSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const selectActivity = useCallback((id: string) => {
    setSelectedActivityId(id);
  }, []);

  const submitNotes = useCallback(({
    sessionId: _sessionId,
    notes,
    mood,
    productivity,
    bookTitle,
  }: {
    sessionId: string;
    notes: string;
    mood: number;
    productivity: number;
    bookTitle?: string;
  }) => {
    if (!pendingSession) return;
    registerSession.mutate({
      activityId: pendingSession.activityId,
      durationMinutes: pendingSession.durationMinutes,
      startTime: pendingSession.startTime,
      mood,
      productivityLevel: productivity,
      notes,
      bookTitle,
    });
    setPendingSession(null);
  }, [pendingSession, registerSession]);

  const skipNotes = useCallback(() => {
    if (!pendingSession) return;
    registerSession.mutate({
      activityId: pendingSession.activityId,
      durationMinutes: pendingSession.durationMinutes,
      startTime: pendingSession.startTime,
      mood: 3,
      productivityLevel: 3,
    });
    setPendingSession(null);
  }, [pendingSession, registerSession]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalPhaseSeconds = getPhaseSeconds(phase, settings);
  const progress = totalPhaseSeconds > 0 ? ((totalPhaseSeconds - secondsLeft) / totalPhaseSeconds) * 100 : 0;

  return {
    phase,
    displayTime,
    progress,
    cycleCount,
    totalFocusTime: totalFocusMinutes * 60,
    selectedActivityId,
    selectActivity,
    settings,
    updateSettings,
    start,
    pause,
    reset,
    skip,
    isRunning,
    sessionCompleted: pendingSession !== null,
    completedSessionId: pendingSession?.startTime ?? null,
    submitNotes,
    skipNotes,
  };
}
