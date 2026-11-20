import { generate, type GenInput } from "./designShapes";

self.onmessage = (e: MessageEvent<GenInput & { job: number }>) => {
  const arr = generate(e.data);
  (self as unknown as Worker).postMessage({ job: e.data.job, arr }, [arr.buffer]);
};
