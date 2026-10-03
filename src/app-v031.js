// Kosmos.Kreator v0.3.1 runtime bootstrap.
(async () => {
  'use strict';
  const chunks = ['v031-0.txt','v031-1.txt','v031-2.txt','v031-3.txt','v031-4.txt'];
  const parts = await Promise.all(chunks.map(async (name) => {
    const response = await fetch(`src/runtime/${name}`);
    if (!response.ok) throw new Error(`Could not load ${name}`);
    return response.text();
  }));
  const payload = parts.join('');
  if (!('DecompressionStream' in window)) {
    document.body.innerHTML = '<p style="padding:2rem;color:white;background:#03050d;font-family:system-ui">Kosmos.Kreator needs a modern browser with DecompressionStream support.</p>';
    return;
  }
  const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const source = await new Response(stream).text();
  (0, eval)(source);
})().catch((error) => {
  console.error(error);
  alert('Kosmos.Kreator could not start.');
});
