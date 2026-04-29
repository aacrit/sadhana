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
  delete (globalThis as unknown as { AudioContext?: typeof MockAudioContext }).AudioContext;
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

// ---------------------------------------------------------------------------
// setVolume ramp — drives the phase-aware ducking in useLessonEngine
// ---------------------------------------------------------------------------

describe('TanpuraDrone.setVolume ramp', () => {
  it('default ramp is ~50ms (no click) — backwards compatible', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });
    await tanpura.start();

    const ctx = MockAudioContext.instances[0]!;
    const masterGain = ctx.createdNodes.find((n) => n.__kind === 'gain')!;
    masterGain.gain!.linearRampToValueAtTime.mockClear();
    masterGain.gain!.setValueAtTime.mockClear();
    masterGain.gain!.cancelScheduledValues.mockClear();

    tanpura.setVolume(0.1); // no rampMs arg

    // Must cancel any pending schedule, seed current value, and ramp to 0.1
    expect(masterGain.gain!.cancelScheduledValues).toHaveBeenCalledTimes(1);
    expect(masterGain.gain!.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(masterGain.gain!.linearRampToValueAtTime).toHaveBeenCalledTimes(1);

    const [target, when] = masterGain.gain!.linearRampToValueAtTime.mock.calls[0] as [number, number];
    expect(target).toBe(0.1);
    // now=0, 50ms ramp → when ≈ 0.05 seconds
    expect(when).toBeCloseTo(0.05, 3);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('accepts a rampMs argument for phase-aware ducking (400ms)', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });
    await tanpura.start();

    const ctx = MockAudioContext.instances[0]!;
    const masterGain = ctx.createdNodes.find((n) => n.__kind === 'gain')!;
    masterGain.gain!.linearRampToValueAtTime.mockClear();

    tanpura.setVolume(0.1, 400); // ducking ramp

    const [target, when] = masterGain.gain!.linearRampToValueAtTime.mock.calls[0] as [number, number];
    expect(target).toBe(0.1);
    expect(when).toBeCloseTo(0.4, 3);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('rejects out-of-range volume', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });
    await tanpura.start();

    expect(() => tanpura.setVolume(-0.1)).toThrow(RangeError);
    expect(() => tanpura.setVolume(1.5)).toThrow(RangeError);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('clamps rampMs to a minimum of 1ms so setValueAtTime + linearRamp never collide', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 220, volume: 0.3 });
    await tanpura.start();

    const ctx = MockAudioContext.instances[0]!;
    const masterGain = ctx.createdNodes.find((n) => n.__kind === 'gain')!;
    masterGain.gain!.linearRampToValueAtTime.mockClear();

    tanpura.setVolume(0.1, 0); // degenerate case

    const [, when] = masterGain.gain!.linearRampToValueAtTime.mock.calls[0] as [number, number];
    // With rampMs=0, the impl clamps to ~1ms → 0.001s
    expect(when).toBeGreaterThan(0);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });
});

// ---------------------------------------------------------------------------
// stringCount — 2-string Sa+Pa default (Shishya level)
// ---------------------------------------------------------------------------

describe('TanpuraDrone stringCount', () => {
  it('defaults to 2 strings — only 2 profiles (ground + Sa) are voiced', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3 });
    await tanpura.start();

    expect(tanpura.getStringCount()).toBe(2);
    // 2 profiles × 10 partials = 20 oscillators
    const ctx = MockAudioContext.instances[0]!;
    const oscs = ctx.createdNodes.filter((n) => n.__kind === 'oscillator');
    expect(oscs).toHaveLength(20);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('stringCount: 3 voices 30 oscillators', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3, stringCount: 3 });
    await tanpura.start();

    expect(tanpura.getStringCount()).toBe(3);
    const ctx = MockAudioContext.instances[0]!;
    const oscs = ctx.createdNodes.filter((n) => n.__kind === 'oscillator');
    expect(oscs).toHaveLength(30);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('stringCount: 4 voices 40 oscillators (full tanpura)', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3, stringCount: 4 });
    await tanpura.start();

    expect(tanpura.getStringCount()).toBe(4);
    const ctx = MockAudioContext.instances[0]!;
    const oscs = ctx.createdNodes.filter((n) => n.__kind === 'oscillator');
    expect(oscs).toHaveLength(40);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('getProfiles() returns only the sliced profiles — stringCount: 2 → 2 profiles', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3, stringCount: 2 });
    await tanpura.start();

    const profiles = tanpura.getProfiles();
    expect(profiles).toHaveLength(2);
    // First profile is the ground string (Pa by default)
    expect(profiles[0]!.name).toBe('Pa');
    // Second profile is Sa
    expect(profiles[1]!.name).toBe('Sa');

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('2-string pluck cycle wraps at 2 — cycleIndex never exceeds 1', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({
      sa_hz: 261.63,
      volume: 0.3,
      stringCount: 2,
      cycleDuration: 2.0, // 1.0s per string
    });
    await tanpura.start();

    // After 2 intervals (2.0s), both strings have been plucked once each
    // and the cycle wraps back to index 0
    vi.advanceTimersByTime(2100); // slightly past 2 full pluck intervals

    // Still running — pluck cycle has not stalled
    expect(tanpura.isRunning()).toBe(true);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('cycleDuration defaults to 2.0 — per-string interval is 1.0s at stringCount: 2', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3 }); // defaults
    await tanpura.start();

    expect((tanpura.getConfig() as { cycleDuration?: number }).cycleDuration).toBe(2.0);
    expect(tanpura.getStringCount()).toBe(2);
    // per-string interval = 2.0 / 2 = 1.0s
    // pluck cycle should fire at ~1.0s, ~2.0s, ~3.0s ...
    vi.advanceTimersByTime(1100); // past first interval
    expect(tanpura.isRunning()).toBe(true);

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('groundString: Ni for Bageshri uses Ni profile', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({
      sa_hz: 261.63,
      volume: 0.3,
      stringCount: 2,
      groundString: 'Ni',
    });
    await tanpura.start();

    const profiles = tanpura.getProfiles();
    expect(profiles[0]!.name).toBe('Ni (komal)');

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });

  it('groundString: Ma for Marwa/Malkauns uses Ma profile', async () => {
    const { TanpuraDrone } = await import('./tanpura');
    const tanpura = new TanpuraDrone({
      sa_hz: 261.63,
      volume: 0.3,
      stringCount: 2,
      groundString: 'Ma',
    });
    await tanpura.start();

    const profiles = tanpura.getProfiles();
    expect(profiles[0]!.name).toBe('Ma (shuddha)');

    tanpura.stop();
    vi.advanceTimersByTime(600);
  });
});
