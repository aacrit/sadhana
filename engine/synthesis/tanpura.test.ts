/**
 * tanpura.test.ts — Stop/start lifecycle safety
 *
 * These tests validate that TanpuraDrone.stop() correctly detaches the
 * running graph and that a subsequent start() within the 600ms fade window
 * is isolated from the previous graph's scheduled teardown. They run in
 * the `node` vitest environment, so Web Audio API types are provided via
 * lightweight mocks on globalThis.
 *
 * @module engine/synthesis/tanpura.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Web Audio API mocks
// ---------------------------------------------------------------------------

interface MockParam {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  setTargetAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
}

interface MockNode {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start?: ReturnType<typeof vi.fn>;
  stop?: ReturnType<typeof vi.fn>;
  gain?: MockParam;
  frequency?: { value: number };
  type?: string;
  __kind: 'gain' | 'oscillator';
}

function makeParam(initial: number = 0): MockParam {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];
  public currentTime = 0;
  public state: 'running' | 'closed' | 'suspended' = 'running';
  public destination = { __kind: 'destination' };
  public createdNodes: MockNode[] = [];

  constructor() {
    MockAudioContext.instances.push(this);
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async close(): Promise<void> {
    this.state = 'closed';
  }

  createGain(): MockNode {
    const node: MockNode = {
      __kind: 'gain',
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: makeParam(1),
    };
    this.createdNodes.push(node);
    return node;
  }

  createOscillator(): MockNode {
    const node: MockNode = {
      __kind: 'oscillator',
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
      type: 'sine',
    };
    this.createdNodes.push(node);
    return node;
  }
}

beforeEach(() => {
  MockAudioContext.instances = [];
  (globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
    MockAudioContext;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { AudioContext?: typeof MockAudioContext }).AudioContext;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TanpuraDrone stop/start lifecycle', () => {
  it('stop() schedules a cleanup that disconnects all nodes and closes the owned AudioContext', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });

    await tanpura.start();

    expect(MockAudioContext.instances).toHaveLength(1);
    const ctx = MockAudioContext.instances[0]!;
    expect(ctx.state).toBe('running');
    const gainNodes = ctx.createdNodes.filter((n) => n.__kind === 'gain');
    const oscNodes = ctx.createdNodes.filter((n) => n.__kind === 'oscillator');
    expect(oscNodes.length).toBeGreaterThan(0);

    tanpura.stop();

    // After stop(), running must be false immediately.
    expect(tanpura.isRunning()).toBe(false);

    // Fade window still open — teardown has not happened yet.
    for (const osc of oscNodes) {
      expect(osc.stop).not.toHaveBeenCalled();
    }
    expect(ctx.state).toBe('running');

    // Advance past the 600ms scheduled teardown.
    vi.advanceTimersByTime(600);

    // Every oscillator stopped and disconnected.
    for (const osc of oscNodes) {
      expect(osc.stop).toHaveBeenCalledTimes(1);
      expect(osc.disconnect).toHaveBeenCalled();
    }
    // Every gain disconnected.
    for (const gain of gainNodes) {
      expect(gain.disconnect).toHaveBeenCalled();
    }
    // The owned AudioContext is closed by TanpuraDrone (it created it).
    expect(ctx.state).toBe('closed');
  });

  it('double stop() is a no-op on the second call', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });

    await tanpura.start();
    const ctx = MockAudioContext.instances[0]!;
    const oscNodes = ctx.createdNodes.filter((n) => n.__kind === 'oscillator');

    tanpura.stop();
    tanpura.stop(); // second call — must not schedule a second teardown

    vi.advanceTimersByTime(600);

    // Each oscillator stopped exactly once, not twice.
    for (const osc of oscNodes) {
      expect(osc.stop).toHaveBeenCalledTimes(1);
    }
  });

  it('start() within the fade window builds a fresh graph; the stale cleanup only tears down the old graph', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });

    // First lifecycle
    await tanpura.start();
    const firstCtx = MockAudioContext.instances[0]!;
    const firstOscs = firstCtx.createdNodes.filter((n) => n.__kind === 'oscillator');

    tanpura.stop();

    // Before the 600ms cleanup fires, start() again — simulating a rapid
    // toggle. The new graph must be independent.
    await tanpura.start();

    expect(MockAudioContext.instances).toHaveLength(2);
    const secondCtx = MockAudioContext.instances[1]!;
    const secondOscs = secondCtx.createdNodes.filter((n) => n.__kind === 'oscillator');

    expect(tanpura.isRunning()).toBe(true);

    // Fire the first stop()'s scheduled teardown.
    vi.advanceTimersByTime(600);

    // Old graph cleaned up.
    for (const osc of firstOscs) {
      expect(osc.stop).toHaveBeenCalledTimes(1);
    }
    expect(firstCtx.state).toBe('closed');

    // New graph untouched by the stale timer.
    for (const osc of secondOscs) {
      expect(osc.stop).not.toHaveBeenCalled();
    }
    expect(secondCtx.state).toBe('running');
    expect(tanpura.isRunning()).toBe(true);
  });
});
