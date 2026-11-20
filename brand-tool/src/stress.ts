// Test-only entry: exposes the engine so a test page can draw every layout with worst-case content.
import * as E from './engine/index.js';
(window as any).__E = E;
