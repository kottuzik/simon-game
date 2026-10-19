import { registerSW } from 'virtual:pwa-register';

// Registers the service worker. A new version is applied only when the player taps "refresh",
// so an active game is never reloaded behind their back.
export function setupPwa(onUpdateReady: (apply: () => void) => void): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      onUpdateReady(() => {
        void updateSW(true);
      });
    },
  });
}
