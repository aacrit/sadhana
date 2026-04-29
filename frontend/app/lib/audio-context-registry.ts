/**
 * Global registry for live AudioContext instances (audit #1).
 *
 * The audio layer creates contexts in three places — pipeline.ts (voice
 * input), tanpura.ts (drone synthesis), lesson-audio.ts (tabla theka).
 * For background-resume to work the resumer needs to know about all of
 * them. This module is the lightweight bridge: every context creator
 * calls `registerAudioContext(ctx)` after construction, and the resumer
 * walks the registry on visibilitychange.
 *
 * Cleanup: contexts are auto-removed when their state becomes 'closed',
 * so callers do NOT need to explicitly unregister.
 */

const registry = new Set<AudioContext>();

export function registerAudioContext(ctx: AudioContext): void {
  if (!ctx) return;
  registry.add(ctx);
  // Auto-cleanup once the context is closed
  ctx.addEventListener?.('statechange', () => {
    if (ctx.state === 'closed') registry.delete(ctx);
  });
}

export function unregisterAudioContext(ctx: AudioContext): void {
  registry.delete(ctx);
}

export function getRegisteredContexts(): readonly AudioContext[] {
  // Return a snapshot — callers may iterate while the set mutates.
  return Array.from(registry).filter((c) => c.state !== 'closed');
}
