import { shouldHydrateApp } from './constants/site';
import './index.css';

if (
  shouldHydrateApp(
    window.location.hostname,
    window.location.pathname,
    Boolean(document.head.querySelector('link[rel="canonical"]')),
  )
) {
  const [{ createRoot }, { default: App }, { registerSW }] = await Promise.all([
    import('react-dom/client'),
    import('./App'),
    import('virtual:pwa-register'),
  ]);

  registerSW({ immediate: true });
  createRoot(document.getElementById('root')!).render(<App />);
}
