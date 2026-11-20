import './components/zach-ui/fonts.css';
import './components/zach-ui/graphical/styles.css';
import 'dialkit/styles.css';
import './components/zach-ui/dialkit-theme.css';
import './shell.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

import { runKit } from './kit';

// The brand kit's render.html is this same bundle with window.__KIT set: it draws layouts, not the tool.
const kit = (window as any).__KIT;
if (kit) runKit(kit);
else createRoot(document.getElementById('root')!).render(<App />);
