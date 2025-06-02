let deferredPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.querySelector('[onclick="installApp()"]');
  if (installBtn) installBtn.style.display = "none";

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // Stop automatic prompt
    deferredPrompt = e;

    if (installBtn) installBtn.style.display = "inline-block";
  });

  // iOS detection for showing install instructions
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = "standalone" in window.navigator && window.navigator.standalone;

  if (isIos && !isInStandaloneMode) {
    setTimeout(() => {
      alert("To install this app, tap the Share icon and choose 'Add to Home Screen'.");
    }, 1000);
  }
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  } else {
    alert("To install this app, use your browser menu → 'Add to Home Screen'.");
  }
}
