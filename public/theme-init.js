(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "light") {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {}
})();
