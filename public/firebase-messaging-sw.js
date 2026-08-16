importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBFh8FpnyyBLOuhDjSU1dsrrQtz7iPT8gs",
  authDomain: "kkgs-portal.firebaseapp.com",
  projectId: "kkgs-portal",
  messagingSenderId: "804735192941",
  appId: "1:804735192941:web:66569ceb0dd0ba2faa9464",
});

const messaging = firebase.messaging();

// Fires when a push arrives while the app is closed / not focused
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? "KKGS Portal", {
    body: body ?? "",
    icon: "/icon-192.png", // add an icon at this path, or swap the value
    data: payload.data,
  });
});

// Clicking the notification focuses/opens the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(clients.openWindow(url));
});