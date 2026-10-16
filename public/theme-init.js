// Runs before the page paints: applies the saved dark/light choice so there
// is no flash of the wrong theme. The in-app toggle lives in ThemeToggle.tsx.
(function () {
  try {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // Storage can be blocked (private mode); default to light.
  }
})();
