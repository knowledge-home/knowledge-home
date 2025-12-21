/* =========================================================
   includes.js
   - Loads partial HTML files into elements with [data-include]
   - Dispatches "includes:loaded" when done
========================================================= */
(function () {
    async function loadOne(el) {
        const url = el.getAttribute("data-include");
        if (!url) return;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            el.innerHTML = `<!-- include failed: ${url} -->`;
            return;
        }
        const html = await res.text();
        el.innerHTML = html;
    }

    async function loadAll() {
        const nodes = Array.from(document.querySelectorAll("[data-include]"));
        await Promise.all(nodes.map(loadOne));
        document.dispatchEvent(new CustomEvent("includes:loaded"));
    }

    // Run
    loadAll().catch(() => {
        document.dispatchEvent(new CustomEvent("includes:loaded"));
    });
})();
