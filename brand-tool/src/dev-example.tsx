import './components/zach-ui/fonts.css';
import './components/zach-ui/graphical/styles.css';
import 'dialkit/styles.css';
import './components/zach-ui/dialkit-theme.css';
import './components/zach-ui/layout.css';
import { createRoot } from 'react-dom/client';
import { FoundationExample } from './components/zach-ui/FoundationExample';
createRoot(document.getElementById('root')!).render(<FoundationExample />);
