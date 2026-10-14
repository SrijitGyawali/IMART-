export function windowFps(frames: number, seconds: number): number {
  return seconds > 0 ? frames / seconds : 60;
}

export function judgeFrames(windows: number[], threshold = 50, needed = 3): boolean {
  if (windows.length < needed) return false;
  return windows.slice(-needed).every((fps) => fps < threshold);
}
