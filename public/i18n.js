(() => {
  const SUPPORTED = ["id", "en"];
  const FALLBACK = "id";
  const dictionaries = {};
  let currentLang = FALLBACK;
  let domReady = document.readyState !== "loading";
  let pendingApply = !domReady;

  const htmlLangMap = {
    id: "id",
    en: "en"
  };

  const normalizeLang = (lang) => {
    if (!lang || typeof lang !== "string") return null;
    const lower = lang.toLowerCase();
    if (SUPPORTED.includes(lower)) return lower;
    const base = lower.split("-")[0];
    return SUPPORTED.includes(base) ? base : null;
  };

  const getFromQuery = () => normalizeLang(new URLSearchParams(window.location.search).get("lang"));

  const getFromStorage = () => {
    try {
      return normalizeLang(window.localStorage.getItem("lang"));
    } catch (error) {
      console.warn("[i18n] Unable to access localStorage:", error);
      return null;
    }
  };

  const getFromNavigator = () => {
    const list = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language || navigator.userLanguage];
    for (const lang of list) {
      const normalized = normalizeLang(lang);
      if (normalized) return normalized;
    }
    return null;
  };

  const loadLanguage = async (lang) => {
    if (dictionaries[lang]) return dictionaries[lang];
    try {
      const response = await fetch(`/locales/${lang}.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      dictionaries[lang] = data;
      return data;
    } catch (error) {
      console.error(`[i18n] Failed to load locale "${lang}":`, error);
      if (lang !== FALLBACK) {
        await loadLanguage(FALLBACK);
        return dictionaries[FALLBACK];
      }
      dictionaries[lang] = {};
      return dictionaries[lang];
    }
  };

  const resolveKey = (dict, key) => key.split(".").reduce((acc, part) => (acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined), dict);

  const replaceTokens = (value, replacements = {}) =>
    typeof value === "string"
      ? value.replace(/{{\s*([\w]+)\s*}}/g, (match, token) =>
          Object.prototype.hasOwnProperty.call(replacements, token) ? String(replacements[token]) : ""
        )
      : value;

  const translate = (key, replacements) => {
    if (!key) return "";
    const langDict = dictionaries[currentLang] || {};
    const fallbackDict = dictionaries[FALLBACK] || {};
    let value = resolveKey(langDict, key);
    if (value === undefined) {
      value = resolveKey(fallbackDict, key);
    }
    if (value === undefined) {
      return key;
    }
    return replaceTokens(value, replacements);
  };

  const applyTranslations = (root = document) => {
    const elements = root.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;

      const applyAttr = el.getAttribute("data-i18n-attr");
      if (applyAttr) {
        applyAttr
          .split(",")
          .map((attr) => attr.trim())
          .filter(Boolean)
          .forEach((attrName) => {
            const attrValue = translate(`${key}.${attrName}`);
            if (attrValue !== undefined) {
              el.setAttribute(attrName, attrValue);
            }
          });
      }

      const skipText = el.hasAttribute("data-i18n-skip-text");
      if (!skipText) {
        const textValue = translate(key);
        if (textValue !== undefined) {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (el.type === "button" || el.type === "submit" || el.type === "reset") {
              el.value = textValue;
            }
          } else if (el instanceof HTMLSelectElement) {
            // noop: options handle their own text
          } else {
            el.textContent = textValue;
          }
        }
      }
    });

    const htmlElements = root.querySelectorAll("[data-i18n-html]");
    htmlElements.forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (!key) return;
      const htmlValue = translate(key);
      if (htmlValue !== undefined) {
        el.innerHTML = htmlValue;
      }
    });

    const resolvedLang = htmlLangMap[currentLang] || FALLBACK;
    document.documentElement.setAttribute("lang", resolvedLang);
  };

  const updateUrlLang = (lang) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      console.warn("[i18n] Failed to update URL:", error);
    }
  };

  const storeLang = (lang) => {
    try {
      window.localStorage.setItem("lang", lang);
    } catch (error) {
      console.warn("[i18n] Unable to store lang preference:", error);
    }
  };

  const updateLanguageButtons = () => {
    if (!domReady) return;
    const buttons = document.querySelectorAll("[data-setlang]");
    buttons.forEach((btn) => {
      const btnLang = normalizeLang(btn.getAttribute("data-setlang"));
      if (!btnLang) return;
      const isActive = btnLang === currentLang;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) {
        btn.setAttribute("data-active-lang", "true");
      } else {
        btn.removeAttribute("data-active-lang");
      }
    });
  };

  const bindLanguageButtons = () => {
    if (!domReady) return;
    document.querySelectorAll("[data-setlang]").forEach((btn) => {
      if (btn.dataset.i18nLangBound === "true") return;
      btn.dataset.i18nLangBound = "true";
      btn.addEventListener("click", (event) => {
        const target = normalizeLang(btn.getAttribute("data-setlang"));
        if (!target || target === currentLang) return;
        event.preventDefault();
        setLanguage(target);
      });
    });
    updateLanguageButtons();
  };

  const dispatchLangChange = () => {
    const detail = { lang: currentLang };
    document.dispatchEvent(new CustomEvent("i18n:lang-changed", { detail }));
  };

  const setLanguage = async (lang, options = {}) => {
    const normalized = normalizeLang(lang) || FALLBACK;
    await loadLanguage(FALLBACK);
    await loadLanguage(normalized);
    currentLang = normalized;

    const resolvedLang = htmlLangMap[currentLang] || FALLBACK;
    document.documentElement.setAttribute("lang", resolvedLang);

    if (!options.skipStore) {
      storeLang(currentLang);
    }
    if (!options.skipUrl) {
      updateUrlLang(currentLang);
    }

    if (domReady) {
      applyTranslations();
      updateLanguageButtons();
    } else {
      pendingApply = true;
    }

    dispatchLangChange();
    return currentLang;
  };

  window.__ = (key, replacements) => translate(key, replacements);
  window.__lang = () => currentLang;
  window.__applyTranslations = (root) => {
    applyTranslations(root || document);
    updateLanguageButtons();
  };
  window.__setLanguage = (lang, options) => setLanguage(lang, options);

  document.addEventListener("DOMContentLoaded", () => {
    domReady = true;
    if (pendingApply) {
      applyTranslations();
    }
    bindLanguageButtons();
    updateLanguageButtons();
    pendingApply = false;
  });

  (async () => {
    const queryLang = getFromQuery();
    const storedLang = getFromStorage();
    const navigatorLang = getFromNavigator();
    const initialLang = queryLang || storedLang || navigatorLang || FALLBACK;
    await loadLanguage(FALLBACK);
    await loadLanguage(initialLang);
    const skipUrl = Boolean(queryLang);
    await setLanguage(initialLang, { skipUrl });
  })();
})();
