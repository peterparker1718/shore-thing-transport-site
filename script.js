(function () {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeStorageKey = "stt-theme";
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
  let activeTheme = localStorage.getItem(themeStorageKey) || (prefersDark ? "dark" : "light");

  function renderThemeIcon(theme) {
    return theme === "dark"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>';
  }

  function setTheme(theme, { persist = true } = {}) {
    activeTheme = theme;
    root.setAttribute("data-theme", theme);
    if (persist) localStorage.setItem(themeStorageKey, theme);
    if (!themeToggle) return;
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
    themeToggle.innerHTML = renderThemeIcon(theme);
  }

  setTheme(activeTheme, { persist: false });

  themeToggle?.addEventListener("click", () => {
    setTheme(activeTheme === "dark" ? "light" : "dark");
  });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  function setNavOpen(open) {
    root.setAttribute("data-nav-open", open ? "true" : "false");
    navToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle?.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  setNavOpen(false);

  navToggle?.addEventListener("click", () => {
    const open = root.getAttribute("data-nav-open") === "true";
    setNavOpen(!open);
  });

  navLinks?.addEventListener("click", (event) => {
    const link = event.target?.closest?.("a");
    if (!link) return;
    setNavOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setNavOpen(false);
  });

  // Booking page: show success message on redirect (book.html?success=1).
  const successBanner = document.querySelector("[data-success-message]");
  if (successBanner) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") successBanner.hidden = false;
  }

  const vehicleButtons = [...document.querySelectorAll(".vehicle-card")];
  const selectedVehicle = document.querySelector("[data-selected-vehicle]");
  const selectedVehicleInput = document.querySelector("[data-selected-vehicle-input]");
  const estimate = document.querySelector("[data-estimate]");
  const milesInput = document.querySelector("[data-mile-input]");

  let currentVehicle = vehicleButtons.find((button) => button.classList.contains("is-selected")) || vehicleButtons[0];

  function updateEstimate() {
    if (!currentVehicle || !selectedVehicle || !estimate || !milesInput) return;
    const base = Number(currentVehicle.dataset.base || 0);
    const mileRate = Number(currentVehicle.dataset.mile || 0);
    const miles = Math.max(1, Number(milesInput.value || 1));
    const total = base + mileRate * miles;
    selectedVehicle.textContent = currentVehicle.dataset.vehicle;
    if (selectedVehicleInput) selectedVehicleInput.value = currentVehicle.dataset.vehicle;
    estimate.textContent = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(total);
  }

  vehicleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      vehicleButtons.forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      currentVehicle = button;
      updateEstimate();
    });
  });

  milesInput?.addEventListener("input", updateEstimate);
  updateEstimate();
})();
