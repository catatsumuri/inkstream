import { createRoot } from 'react-dom/client';
import App from './App.js';
import '@catatsumuri/inkstream/styles.css';
import './site.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Missing #root element');
}

createRoot(root).render(<App />);
