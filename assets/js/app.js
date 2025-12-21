/* =========================================================
   App JS
   - Active nav link (after includes load)
   - Multiple mega menus (centered via CSS position:fixed)
   - Mega backdrop + body scroll lock (readability)
   - Mobile drawer
   - Reveal on scroll
   - Force page load at top on navigation
   - Dynamic aurora mouse drift
   - Back to top (#top) smooth scroll fix (works on all pages)
========================================================= */

(function () {
  const path = location.pathname.split("/").pop() || "index.html";

  function setActiveNav() {
    document.querySelectorAll("[data-nav]").forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", href === path);
    });
  }

  // Force top on navigation between pages
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    const sameSite = !href.startsWith("http") && !href.startsWith("#") && href.endsWith(".html");
    if (sameSite) sessionStorage.setItem("forceTop", "1");
  });

  window.addEventListener("pageshow", () => {
    const force = sessionStorage.getItem("forceTop");
    if (force) {
      sessionStorage.removeItem("forceTop");
      window.scrollTo(0, 0);
    }
  });

  // Mega menus (supports multiple) + backdrop
  function initMegaMenus() {
    const btns = Array.from(document.querySelectorAll("[data-mega-btn]"));
    const megas = Array.from(document.querySelectorAll("[data-mega]"));
    const backdrop = document.getElementById("megaBackdrop");

    if (!btns.length || !megas.length) return;

    const setBackdrop = (open) => {
      if (!backdrop) return;
      backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    const closeAll = () => {
      megas.forEach((m) => m.classList.remove("open"));
      btns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      setBackdrop(false);
    };

    const openById = (id) => {
      closeAll();
      const m = document.getElementById(id);
      const b = btns.find((x) => x.getAttribute("data-mega-target") === id);
      if (m) m.classList.add("open");
      if (b) b.setAttribute("aria-expanded", "true");
      setBackdrop(true);
    };

    btns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = btn.getAttribute("data-mega-target");
        const m = id ? document.getElementById(id) : null;
        if (!m) return;

        const isOpen = m.classList.contains("open");
        if (isOpen) closeAll();
        else openById(id);
      });
    });

    // prevent clicks inside mega from closing it
    megas.forEach((m) => m.addEventListener("click", (e) => e.stopPropagation()));

    // click backdrop closes
    if (backdrop) backdrop.addEventListener("click", closeAll);

    // click outside closes
    document.addEventListener("click", closeAll);

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    // premium: close on scroll
    window.addEventListener(
      "scroll",
      () => {
        const anyOpen = megas.some((m) => m.classList.contains("open"));
        if (anyOpen) closeAll();
      },
      { passive: true }
    );
  }

  // Mobile drawer
  function initDrawer() {
    const drawer = document.querySelector("[data-drawer]");
    const openBtn = document.querySelector("[data-drawer-open]");
    const closeBtn = document.querySelector("[data-drawer-close]");

    if (!drawer || !openBtn || !closeBtn) return;

    const open = () => {
      drawer.classList.add("open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      drawer.classList.remove("open");
      document.body.style.overflow = "";
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);

    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Close drawer when clicking a link
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }

  // Reveal on scroll
  function initReveal() {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add("show");
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  // Dynamic aurora drift (updates CSS vars --mx/--my)
  function initAuroraDrift() {
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty("--mx", x.toFixed(2) + "%");
        document.documentElement.style.setProperty("--my", y.toFixed(2) + "%");
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
  }

  /* =========================
     Back to top (#top) fix
     - Works on all pages
     - Does not interfere with forceTop nav logic
  ========================= */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#top"]');
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "#top");
  });

  function initAll() {
    setActiveNav();
    initMegaMenus();
    initDrawer();
    initReveal();
    initAuroraDrift();
  }

  // If header/footer are included dynamically, init AFTER includes load
  document.addEventListener("includes:loaded", initAll);

  // Fallback (if someone forgets includes.js)
  if (!document.querySelector("[data-include]")) initAll();

  /* =========================================================
     FormSubmit AJAX + flash message (supports multiple forms)
     - contact form:   #contactForm  -> #formFlash
     - volunteer form: #volunteerForm -> #volunteerFlash
  ========================================================= */
  (function bindForms() {
    const attachOne = (formId, flashId) => {
      const form = document.getElementById(formId);
      if (!form) return;

      // Prevent double-binding if includes:loaded fires multiple times
      if (form.dataset.bound === "1") return;
      form.dataset.bound = "1";

      const flash = document.getElementById(flashId);

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (flash) {
          flash.textContent = "Submitting…";
          flash.className = "form-flash show";
        }

        try {
          const res = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { "Accept": "application/json" }
          });

          if (res.ok) {
            form.reset();
            if (flash) flash.textContent = "✅ Submitted successfully.";
          } else {
            if (flash) flash.textContent = "⚠️ Something went wrong. Please try again.";
          }
        } catch (err) {
          if (flash) flash.textContent = "⚠️ Network error. Please try again later.";
        }

        if (flash) setTimeout(() => flash.classList.remove("show"), 4500);
      });
    };

    const attachAll = () => {
      attachOne("contactForm", "formFlash");
      attachOne("volunteerForm", "volunteerFlash");
    };

    // try now
    attachAll();
    // try again after includes load (partials injected)
    document.addEventListener("includes:loaded", attachAll);
  })();
})();
