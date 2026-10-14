import { createRoot } from 'react-dom/client';
import '@catatsumuri/inkstream/styles.css';
import './site.css';
import './app-integration.css';
import AppIntegrationDemo from './AppIntegrationDemo.js';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Missing #root element');
}

createRoot(root).render(<AppIntegrationDemo />);
