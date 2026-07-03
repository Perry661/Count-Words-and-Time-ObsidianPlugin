export class StatsTimer {
  private intervalId: number | null = null;

  start(callback: () => void, intervalMs = 1000): void {
    this.stop();
    this.intervalId = window.setInterval(callback, intervalMs);
  }

  stop(): void {
    if (this.intervalId === null) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
