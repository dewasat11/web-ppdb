(() => {
  const SUPPORTED = ["id","en"]; const FALLBACK = "id";

  function norm(l){ return (l||"").toLowerCase().slice(0,2); }
  function initialLang(){
    const q = new URLSearchParams(location.search).get("lang");
    const cand = [norm(q), norm(localStorage.getItem("lang")), norm(navigator.language), FALLBACK]
      .find(x => SUPPORTED.includes(x));
    return cand || FALLBACK;
  }

  async function loadDict(lang){
    const res = await fetch(`/locales/${lang}.json?v=${Date.now()}`, { cache: "no-store" });
    if(!res.ok) throw new Error("i18n load failed: "+lang);
    return res.json();
  }

  function applyDict(dict){
    // text nodes
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      if (k in dict) {
        if (el.tagName.toLowerCase()==="title") document.title = dict[k];
        else el.textContent = dict[k];
      }
      const attrs = (el.dataset.i18nAttr||"").split(",").map(s=>s.trim()).filter(Boolean);
      for (const a of attrs) {
        const ak = `${k}.${a}`;
        if (ak in dict) el.setAttribute(a, dict[ak]);
      }
    });

    // rich HTML
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const k = el.dataset.i18nHtml;
      if (k in dict) el.innerHTML = dict[k];
    });
  }

  async function setLang(lang){
    const L = SUPPORTED.includes(lang) ? lang : FALLBACK;
    document.documentElement.lang = L;
    localStorage.setItem("lang", L);
    const dict = await loadDict(L);
    applyDict(dict);
  }

  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-setlang]");
    if (!btn) return;
    e.preventDefault();
    const L = btn.dataset.setlang;
    const url = new URL(location.href);
    url.searchParams.set("lang", L);
    history.replaceState({}, "", url);
    setLang(L);
  });

  // expose untuk tes console
  window.i18nSetLang = setLang;

  setLang(initialLang());
})();
