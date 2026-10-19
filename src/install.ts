// Install button logic. Android/Chrome offers a real install prompt; iPhone does not,
// so there the button opens a help dialog instead.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode = 'native' | 'ios-help' | 'none';

export interface InstallEnv {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
}

export function isIos(env: InstallEnv): boolean {
  if (/iPhone|iPad|iPod/.test(env.userAgent)) return true;
  // iPadOS reports itself as a Mac but has a touch screen.
  return /Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1;
}

// Chrome, Firefox, Edge etc. on iOS cannot install the app; only Safari can.
export function isIosSafari(env: InstallEnv): boolean {
  return isIos(env) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(env.userAgent);
}

export function readEnv(): InstallEnv {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return { userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone };
}

export interface Installer {
  mode(): InstallMode;
  // Triggers the native prompt (Android only); resolves when the player answered.
  promptInstall(): Promise<void>;
}

export function createInstaller(onChange: () => void, env: InstallEnv = readEnv()): Installer {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = env.standalone;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    onChange();
  });

  return {
    mode() {
      if (installed) return 'none';
      if (deferred) return 'native';
      return isIos(env) ? 'ios-help' : 'none';
    },
    async promptInstall() {
      const event = deferred;
      if (!event) return;
      // The saved event can be used only once.
      deferred = null;
      try {
        await event.prompt();
        await event.userChoice;
      } catch {
        // The prompt failed or was blocked; nothing else to do.
      }
      onChange();
    },
  };
}
