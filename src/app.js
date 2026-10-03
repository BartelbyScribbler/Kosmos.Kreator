(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'styles/v031.css';
  document.head.appendChild(css);

  const script = document.createElement('script');
  script.src = 'src/app-v031.js';
  document.body.appendChild(script);
})();
