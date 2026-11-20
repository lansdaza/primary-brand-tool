// The Design page's particle worker, for hosts that ship as one file. The host inlines the worker's own
// bundle as __DESIGN_WORKER_SRC__; where a page may not start workers, the same generator runs on the main
// thread behind the same message interface, so DesignScene works unchanged either way.
import { generate, type GenInput } from "./designShapes";

declare const __DESIGN_WORKER_SRC__: string | undefined;
type Job = GenInput & { job: number };
type Reply = { data: { job: number; arr: Float32Array } };

export function makeDesignWorker(): Worker {
  let real: Worker | null = null;
  let last: Job | null = null;
  const local = (data: Job) => setTimeout(() => {
    const arr = generate(data);
    shim.onmessage?.({ data: { job: data.job, arr } } as Reply as MessageEvent);
  }, 0);
  const shim = {
    onmessage: null as ((e: MessageEvent) => void) | null,
    postMessage(data: Job) {
      last = data;
      if (real) real.postMessage(data);
      else local(data);
    },
    terminate() { real?.terminate(); real = null; },
  };
  try {
    if (typeof __DESIGN_WORKER_SRC__ === "string" && __DESIGN_WORKER_SRC__) {
      const url = URL.createObjectURL(new Blob([__DESIGN_WORKER_SRC__], { type: "text/javascript" }));
      real = new Worker(url);
      real.onmessage = (e) => shim.onmessage?.(e);
      // A page that blocks workers reports it here: carry on in the page, repeating the job that was lost.
      real.onerror = () => { real?.terminate(); real = null; if (last) local(last); };
    }
  } catch { real = null; }
  return shim as unknown as Worker;
}
