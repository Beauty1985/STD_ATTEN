import confetti from 'canvas-confetti';

/**
 * Requests browser Web Push Notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Dispatches a native browser Push Notification
 */
export function sendAttendancePushNotification(
  title: string,
  body: string,
  icon?: string
) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/check-circle-2.svg',
        badge: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/check-circle-2.svg',
      });
    }
  } catch (err) {
    console.warn('Failed to send browser notification', err);
  }
}

/**
 * Synthesizes a pleasant audio chime upon successful check-in
 */
export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone chord chime (C5 to G5)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (err) {
    // Silent fail if audio context blocked
  }
}

/**
 * Fires celebratory confetti
 */
export function triggerSuccessConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#D9232A', '#F2A900', '#10B981', '#3B82F6']
  });
}
