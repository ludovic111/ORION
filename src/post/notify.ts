// How an alert reaches the operator: a notification of the system (even
// when the tab is in the background) and a short tone made by the browser
// (WebAudio, no sound file). Nothing leaves the post: no push server.

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const permission = (): NotificationPermission | "unsupported" =>
  notificationsSupported() ? Notification.permission : "unsupported";

/** Ask the browser for the permission (after a click of the operator). */
export async function askPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

// What a tap on a worker notification opens, by tag (the worker only sends
// the tag back to the page).
const pending = new Map<string, () => void>();
if (typeof navigator !== "undefined" && navigator.serviceWorker)
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string; tag?: string } | null;
    if (data?.type !== "orion-notification-click" || !data.tag) return;
    pending.get(data.tag)?.();
    pending.delete(data.tag);
  });

/**
 * Show a notification. A page notification where the browser allows it
 * (desktop: a click brings the tab back); on phones, where only the service
 * worker may notify, through it.
 */
export async function showNotification(
  title: string,
  body: string,
  tag: string,
  onClick?: () => void,
): Promise<boolean> {
  if (permission() !== "granted") return false;
  const options: NotificationOptions = {
    body,
    tag,
    icon: "/icon-192.png",
    silent: true,
  };
  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
    return true;
  } catch {
    // "Illegal constructor" on Android: only the service worker notifies.
  }
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (!registration) return false;
    await registration.showNotification(title, options);
    if (onClick) {
      pending.set(tag, onClick);
      if (pending.size > 50) pending.delete(pending.keys().next().value!);
    }
    return true;
  } catch {
    return false;
  }
}

let audio: AudioContext | null = null;
/** The audio context, created or resumed during a click of the operator. */
export function unlockAudio() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    audio ??= new Ctor();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    audio = null;
  }
}

/**
 * Two short tones (urgent: three). Softer and lower with the red night
 * theme, which keeps the dark room quiet.
 */
export function playTone(urgent = false) {
  if (!audio) unlockAudio();
  const ctx = audio;
  if (!ctx || ctx.state !== "running") return false;
  const night = document.documentElement.dataset.palette === "nuit";
  const volume = night ? 0.05 : 0.12;
  const notes = urgent ? [880, 660, 880] : [740, 560];
  notes.forEach((frequency, i) => {
    const start = ctx.currentTime + i * 0.22;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = night ? frequency * 0.75 : frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
  return true;
}
