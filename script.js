(function () {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeStorageKey = "stt-theme";
  // Default to the brand look (dark). Users can override via the toggle, persisted in localStorage.
  let activeTheme = localStorage.getItem(themeStorageKey) || "dark";

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

  // Booking page: keep users from accidentally selecting dates in the past.
  const dateInput = document.querySelector('input[type="date"][name="date"]');
  if (dateInput && !dateInput.min) {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  // Image dropzone: local preview only (does not upload on submit).
  const imageDropzones = [...document.querySelectorAll("[data-image-dropzone]")];
  imageDropzones.forEach((dropzone) => {
    const button = dropzone.querySelector("[data-image-dropzone-button]");
    const input = dropzone.querySelector("[data-image-dropzone-input]");
    const preview = dropzone.querySelector("[data-image-dropzone-preview]");
    const status = dropzone.querySelector("[data-image-dropzone-status]");

    if (!(button instanceof HTMLElement) || !(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) {
      return;
    }

    let activeObjectUrl = null;
    const supportedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

    const setStatus = (text) => {
      if (status) status.textContent = text;
    };

    const loadFile = (file) => {
      if (!file) return;

      const typeOk = supportedTypes.has(file.type);
      const extOk = /\.(png|jpe?g|webp|svg)$/i.test(file.name);
      if (!typeOk && !extOk) {
        setStatus("Unsupported file type. Use PNG, JPG, WEBP, or SVG.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = objectUrl;

      preview.src = objectUrl;
      preview.alt = `Preview: ${file.name}`;
      setStatus(`Previewing: ${file.name} (not uploaded)`);
    };

    const clearDragState = () => dropzone.classList.remove("is-dragover");
    const setDragState = () => dropzone.classList.add("is-dragover");

    button.addEventListener("click", () => input.click());
    input.addEventListener("change", () => loadFile(input.files && input.files[0]));

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        setDragState();
      });
    });

    ["dragleave", "dragend"].forEach((eventName) => {
      dropzone.addEventListener(eventName, () => clearDragState());
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      clearDragState();

      const files = event.dataTransfer?.files;
      if (files && files.length) loadFile(files[0]);
    });

    // Clean up object URLs when navigating away.
    window.addEventListener("pagehide", () => {
      if (activeObjectUrl) URL.revokeObjectUrl(activeObjectUrl);
      activeObjectUrl = null;
    });
  });

  // Booking page: Shore Thing runs one flagship vehicle (Cadillac Escalade), so the
  // hidden form input is hard-coded in HTML and the displayed label mirrors it. The
  // selection logic below stays in place only if the markup ever exposes a clickable
  // vehicle picker again — with the single static card it's a no-op.
  const vehicleButtons = [...document.querySelectorAll("button.vehicle-card")];
  const selectedVehicle = document.querySelector("[data-selected-vehicle]");
  const selectedVehicleInput = document.querySelector("[data-selected-vehicle-input]");

  if (vehicleButtons.length) {
    let currentVehicle = vehicleButtons.find((button) => button.classList.contains("is-selected")) || vehicleButtons[0];

    const renderVehicleSelection = () => {
      vehicleButtons.forEach((button) => {
        button.classList.toggle("is-selected", button === currentVehicle);
        button.setAttribute("aria-pressed", button === currentVehicle ? "true" : "false");
      });
    };

    const syncSelectedVehicle = () => {
      if (!currentVehicle) return;
      const vehicle = currentVehicle.dataset.vehicle || "";
      if (selectedVehicle) selectedVehicle.textContent = vehicle;
      if (selectedVehicleInput) selectedVehicleInput.value = vehicle;
    };

    vehicleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentVehicle = button;
        renderVehicleSelection();
        syncSelectedVehicle();
      });
    });

    renderVehicleSelection();
    syncSelectedVehicle();
  }
})();
