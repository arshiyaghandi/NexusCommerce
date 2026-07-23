const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdYqmAtAAAAAIWq3-GSTEhzfbD0dL0Y0o7a2rSB';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => number;
      reset: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}

function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
}

export function renderRecaptcha(container: HTMLElement, callback: (token: string) => void): Promise<number> {
  return loadRecaptchaScript().then(() => {
    return new Promise<number>((resolve) => {
      window.grecaptcha.ready(() => {
        const widgetId = window.grecaptcha.render(container, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback,
        });
        resolve(widgetId);
      });
    });
  });
}

export function resetRecaptcha(widgetId: number): void {
  window.grecaptcha.reset(widgetId);
}
