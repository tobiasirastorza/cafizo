import { pbList } from '@/lib/pocketbase';
import { getDashboardData } from '@/app/dashboard/data';

vi.mock('@/lib/pocketbase', () => ({
  pbList: vi.fn(),
}));

const mockedPbList = vi.mocked(pbList);

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T15:00:00.000Z'));
    mockedPbList.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds dashboard stats, alerts and recent sessions for active students', async () => {
    mockedPbList
      .mockResolvedValueOnce({
        items: [
          { id: 's1', name: 'Ana', status: 'active' },
          { id: 's2', name: 'Luis', status: 'active' },
          { id: 's3', name: 'Old', status: 'inactive' },
        ],
      } as never)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'c1',
            student_id: 's1',
            completed_at: '2026-03-12T13:00:00.000Z',
            status: 'completed',
            sets: 4,
            reps: '12',
            weight: 40,
            expand: {
              student_id: { name: 'Ana' },
              routine_exercise_id: { expand: { exercise_id: { name: 'Sentadilla', muscle_group: 'Legs' } } },
            },
          },
          {
            id: 'c2',
            student_id: 's2',
            completed_at: '2026-03-11T16:00:00.000Z',
            status: 'completed',
            expand: {
              student_id: { name: 'Luis' },
              routine_exercise_id: { expand: { exercise_id: { name: 'Press banca', muscle_group: 'Chest' } } },
            },
          },
          {
            id: 'c3',
            student_id: 's1',
            completed_at: '2026-03-10T16:00:00.000Z',
            status: 'completed',
            expand: {
              student_id: { name: 'Ana' },
              routine_exercise_id: { expand: { exercise_id: { name: 'Remo', muscle_group: 'Back' } } },
            },
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        items: [
          { id: 'r1', student_id: 's1', started_at: '2026-03-01T12:00:00.000Z', expand: { student_id: { name: 'Ana' }, routine_id: { name: 'Full Body A' } } },
          { id: 'r2', student_id: 's2', started_at: '2026-03-02T12:00:00.000Z', expand: { student_id: { name: 'Luis' }, routine_id: { name: 'Upper Lower' } } },
        ],
      } as never);

    const result = await getDashboardData('en-US');

    expect(result.stats).toEqual([
      { key: 'activeClients', value: '2', delta: '' },
      { key: 'sessionsThisWeek', value: '3', delta: '' },
      { key: 'adherence', value: '50', delta: '%' },
    ]);
    expect(result.recentSessions).toHaveLength(1);
    expect(result.recentSessions[0]).toMatchObject({
      name: 'Ana',
      exerciseName: 'Sentadilla',
      sets: 4,
      reps: '12',
      weight: 40,
      isToday: true,
    });
    expect(result.alerts).toEqual([]);
    expect(result.marqueeItems.map((item) => item.name)).toEqual(['Ana', 'Luis']);
  });

  it('flags missed and stalled clients and backfills marquee items when activity is sparse', async () => {
    mockedPbList
      .mockResolvedValueOnce({
        items: [
          { id: 's1', name: 'Ana', status: 'active' },
          { id: 's2', name: 'Luis', status: 'active' },
          { id: 's3', name: 'Mora', status: 'active' },
        ],
      } as never)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'c-old',
            student_id: 's1',
            completed_at: '2026-03-01T10:00:00.000Z',
            status: 'completed',
            expand: {
              student_id: { name: 'Ana' },
              routine_exercise_id: { expand: { exercise_id: { name: 'Peso muerto', muscle_group: 'Back' } } },
            },
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        items: [
          { id: 'r1', student_id: 's1', started_at: '2026-02-20T12:00:00.000Z', expand: { student_id: { name: 'Ana' }, routine_id: { name: 'Full Body A' } } },
          { id: 'r2', student_id: 's2', started_at: '2026-03-09T12:00:00.000Z', expand: { student_id: { name: 'Luis' }, routine_id: { name: 'Upper Lower' } } },
          { id: 'r3', student_id: 's3', started_at: '2026-03-09T12:00:00.000Z', expand: { student_id: { name: 'Mora' }, routine_id: { name: 'Core' } } },
        ],
      } as never);

    const result = await getDashboardData('en-US');

    expect(result.stats).toEqual([
      { key: 'activeClients', value: '3', delta: '' },
      { key: 'sessionsThisWeek', value: '0', delta: '' },
      { key: 'adherence', value: '0', delta: '%' },
    ]);
    expect(result.alerts).toEqual([
      {
        titleKey: 'stalledProgress',
        detailKey: 'stalledProgressDetail',
        actionKey: 'reviewData',
        tone: 'accent',
        name: 'Ana',
      },
      {
        titleKey: 'missedSessions',
        detailKey: 'missedSessionsDetail',
        actionKey: 'sendAlert',
        tone: 'danger',
        name: 'Ana',
      },
    ]);
    expect(result.marqueeItems.map((item) => item.key)).toEqual([
      'missedSessions',
      'missedSessions',
      'missedSessions',
      'stalledProgress',
    ]);
  });
});
