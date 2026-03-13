import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import useExercises from '@/hooks/useExercises';
import { useExercisesManager } from '@/hooks/useExercisesManager';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useExercises', () => ({
  default: vi.fn(),
}));

const mockedUseExercises = vi.mocked(useExercises);
const t = (key: string) => key;

describe('useExercisesManager', () => {
  beforeEach(() => {
    mockedUseExercises.mockReturnValue({
      items: [
        { id: '1', name: 'Sentadilla', muscle_group: 'Legs', exercise_type: 'strength' },
        { id: '2', name: 'Press banca', muscle_group: 'Chest', exercise_type: 'strength' },
      ],
      isLoading: false,
      error: null,
      createExercise: vi.fn().mockResolvedValue(undefined),
      updateExercise: vi.fn().mockResolvedValue(undefined),
      deleteExercise: vi.fn().mockResolvedValue(undefined),
    });
    vi.clearAllMocks();
  });

  it('creates an exercise with trimmed values and closes the modal', async () => {
    const createExercise = vi.fn().mockResolvedValue(undefined);
    mockedUseExercises.mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      createExercise,
      updateExercise: vi.fn(),
      deleteExercise: vi.fn(),
    });

    const { result } = renderHook(() => useExercisesManager(t));

    act(() => {
      result.current.openModal();
      result.current.setDraft({
        name: '  Peso muerto  ',
        muscle_group: '  Back  ',
        exercise_type: '  strength  ',
      });
    });

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(createExercise).toHaveBeenCalledWith({
      name: 'Peso muerto',
      muscle_group: 'Back',
      exercise_type: 'strength',
    });
    expect(result.current.showModal).toBe(false);
    expect(result.current.draft).toEqual({ name: '', muscle_group: '', exercise_type: '' });
    expect(toast.success).toHaveBeenCalledWith('actions.created');
  });

  it('blocks create when the name is missing', async () => {
    const createExercise = vi.fn().mockResolvedValue(undefined);
    mockedUseExercises.mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      createExercise,
      updateExercise: vi.fn(),
      deleteExercise: vi.fn(),
    });

    const { result } = renderHook(() => useExercisesManager(t));

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(createExercise).not.toHaveBeenCalled();
    expect(result.current.formError).toBe('errors.nameRequired');
  });

  it('filters exercises by the selected muscle group', () => {
    const { result } = renderHook(() => useExercisesManager(t));

    act(() => {
      result.current.setActiveFilter('legs');
    });

    expect(result.current.filteredItems).toEqual([
      { id: '1', name: 'Sentadilla', muscle_group: 'Legs', exercise_type: 'strength' },
    ]);
  });
});
