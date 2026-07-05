import { useCallback, useEffect, useRef, useState } from 'react';

type Options<T> = {
  initial: T;
  max?: number;
  isEqual?: (a: T, b: T) => boolean;
  autoTrack?: boolean;
};

const shallowSerialize = <T,>(v: T) => JSON.stringify(v);

export function useHistoryState<T>(opts: Options<T>) {
  const { initial, max = 10, autoTrack = true, isEqual } = opts;
  const [state, setState] = useState<T>(initial);
  const [history, setHistory] = useState<T[]>([initial]);
  const [cursor, setCursor] = useState(0);

  const serialize = useRef(shallowSerialize(initial));

  const eq = useCallback((a: T, b: T) => {
    if (isEqual) return isEqual(a, b);
    return shallowSerialize(a) === shallowSerialize(b);
  }, [isEqual]);

  const push = useCallback((next: T) => {
    setHistory(prev => {
      const head = prev.slice(0, cursor + 1);
      if (eq(head[head.length - 1], next)) return prev;
      
      const appended = [...head, next];
      const trimmed = appended.length > max ? appended.slice(appended.length - max) : appended;
      
      setCursor(trimmed.length - 1);
      return trimmed;
    });
    setState(next);
    serialize.current = shallowSerialize(next);
  }, [cursor, eq, max]);

  const undo = useCallback(() => {
    setCursor(c => {
      const nextCursor = Math.max(0, c - 1);
      const nextState = history[nextCursor];
      setState(nextState);
      serialize.current = shallowSerialize(nextState);
      return nextCursor;
    });
  }, [history]);

  const redo = useCallback(() => {
    setCursor(c => {
      const nextCursor = Math.min(history.length - 1, c + 1);
      const nextState = history[nextCursor];
      setState(nextState);
      serialize.current = shallowSerialize(nextState);
      return nextCursor;
    });
  }, [history]);

  const reset = useCallback((newState: T) => {
    setState(newState);
    setHistory([newState]);
    setCursor(0);
    serialize.current = shallowSerialize(newState);
  }, []);

  useEffect(() => {
    if (!autoTrack) return;
    const now = shallowSerialize(state);
    if (now !== serialize.current) {
      push(state);
    }
  }, [state, autoTrack, push]);

  const canUndo = cursor > 0;
  const canRedo = cursor < history.length - 1;
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            if (canRedo) redo();
        } else {
            if (canUndo) undo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canUndo, canRedo, undo, redo]);

  return {
    state,
    setState,
    push,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history,
    cursor,
  };
}