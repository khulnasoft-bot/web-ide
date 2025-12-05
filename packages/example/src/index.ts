import { createApp } from 'vue';
import App from './components/App.vue';

const root = document.getElementById('main');
const url = new URL(window.location.href);
const autostart = url.searchParams.get('autostart') === 'true';

if (autostart) {
  url.searchParams.delete('autostart');
  window.history.replaceState({}, '', url);
}

if (!root) {
  throw new Error('#main element not found!');
}

createApp(App, { autostart }).mount(root);
