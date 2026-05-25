// SSR stub for Lovable preview. The actual app is a SPA (Tauri build uses
// only the client bundle), so this handler returns the static index.html
// shell and lets the client mount the router.
export default {
  fetch() {
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>XML Log Viewer</title></head><body><div id="root"></div><script type="module" src="/src/tauri-entry.tsx"></script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  },
};
