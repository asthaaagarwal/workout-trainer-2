// Check for app updates by comparing version
let currentVersion: string | null = null;

export const initVersionCheck = (intervalMinutes: number = 5) => {
  // Fetch initial version
  fetchVersion().then(version => {
    currentVersion = version;
    console.log('App version:', version);
  });

  // Check for updates periodically
  setInterval(async () => {
    await checkForUpdate();
  }, intervalMinutes * 60 * 1000);

  // Also check when app becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkForUpdate();
    }
  });

  // Check on window focus
  window.addEventListener('focus', () => {
    checkForUpdate();
  });
};

const fetchVersion = async (): Promise<string | null> => {
  try {
    // Use base URL from vite config
    const base = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${base}version.json?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.version;
    }
  } catch (error) {
    console.error('Failed to fetch version:', error);
  }
  return null;
};

const checkForUpdate = async () => {
  const newVersion = await fetchVersion();

  if (newVersion && currentVersion && newVersion !== currentVersion) {
    console.log('New version available:', newVersion);

    // Optional: Show notification before reload
    const shouldReload = confirm('A new version of the app is available. Would you like to reload now?');

    if (shouldReload) {
      // Force reload, bypassing cache
      window.location.reload();
    } else {
      // Update current version so we don't ask again until next update
      currentVersion = newVersion;
    }
  }
};

// Force reload function that can be called manually
export const forceReload = () => {
  // Clear all caches if service worker exists
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }

  // Reload with cache bypass
  window.location.reload();
};