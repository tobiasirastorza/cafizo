import { renderHook, act } from '@testing-library/react';
import { useRoutineCardActions } from '@/hooks/useRoutineCardActions';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('useRoutineCardActions', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('window', window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deletes linked routine exercises before deleting the routine itself', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [{ id: 're-1' }, { id: 're-2' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const toast = { success: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() =>
      useRoutineCardActions({ routineId: 'routine-1', t: (key) => key, toast }),
    );

    await act(async () => {
      await result.current.removeRoutine();
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/collections/routine_exercises/records/re-1');
    expect(fetchMock.mock.calls[2]?.[0]).toContain('/collections/routine_exercises/records/re-2');
    expect(fetchMock.mock.calls[3]?.[0]).toContain('/collections/routines/records/routine-1');
    expect(toast.success).toHaveBeenCalledWith('actions.deleteSuccess');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleting).toBe(false);
  });

  it('does nothing when the user cancels deletion', async () => {
    const fetchMock = vi.mocked(fetch);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const toast = { success: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() =>
      useRoutineCardActions({ routineId: 'routine-1', t: (key) => key, toast }),
    );

    await act(async () => {
      await result.current.removeRoutine();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
