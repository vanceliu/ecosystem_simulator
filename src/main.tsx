import { render } from 'preact';
import { App } from './ui/App';
import './ui/theme.css';

const root = document.getElementById('app');
if (root === null) {
  throw new Error('Missing #app root element');
}

render(<App />, root);
