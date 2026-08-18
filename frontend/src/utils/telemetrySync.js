// Telemetry & Real-Time Sync manager for FoodIQ Enterprise Dashboards
// Dual-channel sync: BroadcastChannel for cross-tab updates + WebSockets fallback

const channel = typeof window !== 'undefined' ? new BroadcastChannel('foodiq-telemetry-channel') : null;

export const publishTelemetry = (type, payload) => {
  const event = { type, payload, timestamp: Date.now() };
  
  // 1. Broadcast locally (instant cross-tab sync)
  if (channel) {
    channel.postMessage(event);
  }

  // 2. Dispatch custom local event for current tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('foodiq-telemetry', { detail: event }));
  }
};

export const subscribeTelemetry = (callback) => {
  if (!channel || typeof window === 'undefined') return () => {};

  const handleMessage = (e) => {
    callback(e.data);
  };

  const handleLocal = (e) => {
    callback(e.detail);
  };

  channel.addEventListener('message', handleMessage);
  window.addEventListener('foodiq-telemetry', handleLocal);

  return () => {
    channel.removeEventListener('message', handleMessage);
    window.removeEventListener('foodiq-telemetry', handleLocal);
  };
};
