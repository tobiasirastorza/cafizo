import { renderHook, act } from '@testing-library/react';
import { useWorkoutsTracker, type WorkoutEntry } from '@/hooks/useWorkoutsTracker';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const t = (key: string) => key;
const toast = { success: vi.fn(), error: vi.fn() };

function createEntry(overrides: Partial<WorkoutEntry> = {}): WorkoutEntry {
  return {
    routineExerciseId: 'routine-ex-1',
    dayIndex: 2,
    dayLabel: 'Day 2',
    orderIndex: 2,
    exerciseName: 'Sentadilla',
    muscleGroup: 'Legs',
    targetSets: '3',
    targetReps: '10',
    lastStatus: null,
    ...overrides,
  };
}

describe('useWorkoutsTracker', () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('groups entries by day and saves a completed workout log', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(new Response('', { status: 200 }));
    const { result } = renderHook(() =>
      useWorkoutsTracker({
        studentId: 'student-1',
        currentWeekKey: '2026-03-08',
        entries: [
          createEntry({ routineExerciseId: 'routine-ex-2', orderIndex: 1 }),
          createEntry({ routineExerciseId: 'routine-ex-1', orderIndex: 2 }),
        ],
        t,
        toast,
      }),
    );

    expect(result.current.byDay).toHaveLength(1);
    expect(result.current.byDay[0]?.items.map((item) => item.routineExerciseId)).toEqual([
      'routine-ex-2',
      'routine-ex-1',
    ]);

    act(() => {
      result.current.openLogModal(createEntry());
      result.current.setSets('4');
      result.current.setReps('12');
      result.current.setWeight('30');
      result.current.setCompletedAt('2026-03-12T09:30');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] ?? [];
    expect(request).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      student_id: 'student-1',
      routine_exercise_id: 'routine-ex-1',
      week_key: '2026-03-08',
      status: 'completed',
      sets: 4,
      reps: '12',
      weight: 30,
    });
    expect(toast.success).toHaveBeenCalledWith('actions.saveSuccess');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('clears training values when a workout is marked as skipped', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(new Response('', { status: 200 }));
    const entry = createEntry({
      lastStatus: 'skipped',
      lastSets: 4,
      lastReps: '12',
      lastWeight: 30,
    });

    const { result } = renderHook(() =>
      useWorkoutsTracker({
        studentId: 'student-1',
        currentWeekKey: '2026-03-08',
        entries: [entry],
        t,
        toast,
      }),
    );

    act(() => {
      result.current.openLogModal(entry);
    });

    expect(result.current.sets).toBe('');
    expect(result.current.reps).toBe('');
    expect(result.current.weight).toBe('');

    act(() => {
      result.current.setSets('5');
      result.current.setReps('15');
      result.current.setWeight('50');
      result.current.setStatus('skipped');
      result.current.setCompletedAt('2026-03-12T09:30');
    });

    await act(async () => {
      await result.current.submit();
    });

    const [, request] = fetchMock.mock.calls[0] ?? [];
    expect(JSON.parse(String(request?.body))).toEqual({
      student_id: 'student-1',
      routine_exercise_id: 'routine-ex-1',
      completed_at: '2026-03-12T12:30:00.000Z',
      week_key: '2026-03-08',
      status: 'skipped',
    });
  });

  it('surfaces an error and skips the request when the completion date is invalid', async () => {
    const fetchMock = vi.mocked(fetch);
    const { result } = renderHook(() =>
      useWorkoutsTracker({
        studentId: 'student-1',
        currentWeekKey: '2026-03-08',
        entries: [createEntry()],
        t,
        toast,
      }),
    );

    act(() => {
      result.current.openLogModal(createEntry());
      result.current.setCompletedAt('not-a-date');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe('errors.invalidCompletionDate');
    expect(toast.error).toHaveBeenCalledWith('errors.invalidCompletionDate');
  });
});
