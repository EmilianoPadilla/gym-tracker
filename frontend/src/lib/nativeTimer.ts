import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

let permissionChecked = false;

/**
 * Asks for notification permission once, only when actually running as a
 * native app (Capacitor). No-op on the regular website/PWA.
 */
export async function ensureNotificationPermission() {
  if (!Capacitor.isNativePlatform() || permissionChecked) return;
  permissionChecked = true;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") {
      await LocalNotifications.requestPermissions();
    }
  } catch {
    // Permission dialog failing shouldn't block using the rest of the app
  }
}

/**
 * Schedules a real OS notification (with sound) to fire when the rest timer
 * ends. This is what makes the timer actually work with the phone locked -
 * the operating system fires it, not this page's JavaScript, which gets
 * paused in the background. Does nothing on the plain website/PWA, where the
 * in-page countdown + Web Audio beep (used only while the app is open and
 * active) is the best available option.
 */
export async function scheduleRestNotification(id: number, seconds: number, title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: new Date(Date.now() + seconds * 1000) },
        },
      ],
    });
  } catch {
    // Silently ignore - the in-page countdown still works while the app is open
  }
}

/** Cancels a previously scheduled notification, e.g. if the timer is stopped early. */
export async function cancelRestNotification(id: number) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    // Nothing to clean up if it was never scheduled
  }
}
