// 全域請求閥門（單例）。同時最多 2 個請求，兩次出隊最少相隔 1200ms 以避免觸發速率限制。
let inflight = 0;
const queue: Array<() => void> = [];
const MAX = 2; // 允許最多 2 個並發請求
const MIN_INTERVAL = 1200; // 請求之間的最短間隔 (50 RPM)
let lastDequeue = 0;

export async function withGlobalLimit<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      const now = Date.now();
      const wait = Math.max(0, MIN_INTERVAL - (now - lastDequeue));
      
      setTimeout(async () => {
        inflight++;
        lastDequeue = Date.now();
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          inflight--;
          if (queue.length > 0) {
            // Dequeue and run the next task.
            const nextRun = queue.shift();
            if (nextRun) {
                nextRun();
            }
          }
        }
      }, wait);
    };

    if (inflight < MAX) {
        run();
    } else {
        queue.push(run);
    }
  });
}