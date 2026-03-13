const originalFetch = global.fetch;

describe('pocketbase helpers', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.resetModules();
  });

  it('loads collection lists successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: 'stu-1' }], page: 1, perPage: 1, totalItems: 1, totalPages: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as typeof fetch;

    const { pbList } = await import('@/lib/pocketbase');
    await expect(pbList('students', { perPage: 1 })).resolves.toMatchObject({
      items: [{ id: 'stu-1' }],
    });
  });

  it('retries retryable list errors before succeeding', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('temporary error', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [{ id: 'stu-2' }], page: 1, perPage: 1, totalItems: 1, totalPages: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as typeof fetch;

    const { pbList } = await import('@/lib/pocketbase');
    const result = await pbList('students');

    expect(result.items).toEqual([{ id: 'stu-2' }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns null when a record is not found', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 })) as typeof fetch;

    const { pbGetOne } = await import('@/lib/pocketbase');

    await expect(pbGetOne('students', 'missing')).resolves.toBeNull();
  });

  it('surfaces PocketBase error details for failed list calls', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('broken filter', { status: 400 })) as typeof fetch;

    const { pbList } = await import('@/lib/pocketbase');

    await expect(pbList('students')).rejects.toThrow('PocketBase list failed: students (400) broken filter');
  });
});
