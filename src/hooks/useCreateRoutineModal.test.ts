vi.hoisted(() => {
  process.env.NEXT_PUBLIC_DEFAULT_TRAINER_ID = 'trainer-1';
});

import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useCreateRoutineModal } from '@/hooks/useCreateRoutineModal';

const t = (key: string, values?: Record<string, string | number>) => {
  if (values) return `${key}:${JSON.stringify(values)}`;
  return key;
};

describe('useCreateRoutineModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows free mode routines with more than 7 days', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'routine-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useCreateRoutineModal({ t }));

    act(() => result.current.setMode('free'));
    act(() => result.current.setName('My Free Routine'));

    // Add 9 days (start with 1, add 8 more)
    for (let i = 0; i < 8; i++) {
      act(() => result.current.addDay());
    }

    expect(result.current.days).toHaveLength(9);
    expect(result.current.canAddDay).toBe(true);

    // Fill every day with a valid exercise
    for (let i = 0; i < 9; i++) {
      act(() =>
        result.current.updateExercise(i, 0, {
          exercise_id: `ex-${i}`,
          sets: '3',
          reps: '10',
        }),
      );
    }

    await act(async () => {
      await result.current.submit();
    });

    // Should NOT show any validation error
    expect(toast.error).not.toHaveBeenCalled();
    // Should have called fetch (routine + 9 exercises = 10 calls)
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(toast.success).toHaveBeenCalledWith('create.success.created');
  });

  it('blocks weekly mode routines with more than 7 days via toast', async () => {
    const { result } = renderHook(() => useCreateRoutineModal({ t }));

    act(() => result.current.setName('Weekly Routine'));

    // Switch to free mode, add 8 days, switch back to weekly
    act(() => result.current.setMode('free'));
    for (let i = 0; i < 7; i++) {
      act(() => result.current.addDay());
    }
    expect(result.current.days).toHaveLength(8);
    act(() => result.current.setMode('weekly'));

    // Fill exercises so validation reaches the day count check
    for (let i = 0; i < 8; i++) {
      act(() =>
        result.current.updateExercise(i, 0, {
          exercise_id: `ex-${i}`,
          sets: '3',
          reps: '10',
        }),
      );
    }

    await act(async () => {
      await result.current.submit();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('create.maxDaysHint'),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows name required error as toast', async () => {
    const { result } = renderHook(() => useCreateRoutineModal({ t }));

    await act(async () => {
      await result.current.submit();
    });

    expect(toast.error).toHaveBeenCalledWith('create.errors.nameRequired');
    expect(result.current.errorField).toBe('name');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('free mode allows up to 31 days', () => {
    const { result } = renderHook(() => useCreateRoutineModal({ t }));

    act(() => result.current.setMode('free'));
    expect(result.current.maxDays).toBe(31);
    expect(result.current.canAddDay).toBe(true);

    // Add up to 30 more days (31 total)
    for (let i = 0; i < 30; i++) {
      act(() => result.current.addDay());
    }
    expect(result.current.days).toHaveLength(31);
    expect(result.current.canAddDay).toBe(false);

    // Attempting to add another should be a no-op
    act(() => result.current.addDay());
    expect(result.current.days).toHaveLength(31);
  });
});
