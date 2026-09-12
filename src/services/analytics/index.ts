type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsProvider = {
  track: (event: string, payload?: AnalyticsPayload) => void;
  identify: (userId: string, traits?: AnalyticsPayload) => void;
  reset: () => void;
};

const consoleProvider: AnalyticsProvider = {
  track(event, payload) {
    if (__DEV__) {
      console.log('[analytics]', event, payload ?? {});
    }
  },
  identify(userId, traits) {
    if (__DEV__) {
      console.log('[analytics] identify', userId, traits ?? {});
    }
  },
  reset() {
    if (__DEV__) {
      console.log('[analytics] reset');
    }
  },
};

let provider: AnalyticsProvider = consoleProvider;

export const analytics = {
  setProvider(next: AnalyticsProvider) {
    provider = next;
  },
  track(event: string, payload?: AnalyticsPayload) {
    provider.track(event, payload);
  },
  identify(userId: string, traits?: AnalyticsPayload) {
    provider.identify(userId, traits);
  },
  reset() {
    provider.reset();
  },
};
