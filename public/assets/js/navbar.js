(function () {
  const navs = document.querySelectorAll('[data-nav-root]');
  if (!navs.length) return;

  const ensureLayerStyles = () => {
    if (document.getElementById('nav-layer-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-layer-styles';
    style.textContent = `
      [data-nav-root] {
        z-index: 1300 !important;
      }
      [data-dropdown-menu] {
        z-index: 1310 !important;
      }
      [data-mobile-backdrop] {
        position: fixed !important;
        inset: 0 !important;
        z-index: 1400 !important;
        background: rgba(0, 0, 0, 0.55) !important;
        backdrop-filter: blur(1px);
      }
      [data-mobile-menu] {
        position: fixed !important;
        top: clamp(0.75rem, 3vw, 1.5rem) !important;
        right: clamp(0.75rem, 4vw, 1.75rem) !important;
        left: auto !important;
        bottom: auto !important;
        width: min(360px, calc(100vw - 2.5rem)) !important;
        max-height: calc(100vh - 2.5rem) !important;
        border-radius: 1.25rem !important;
        border: 1px solid rgba(15, 23, 42, 0.08) !important;
        z-index: 1410 !important;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15) !important;
      }
      @media (max-width: 420px) {
        [data-mobile-menu] {
          width: calc(100vw - 1.25rem) !important;
          right: 0.5rem !important;
        }
      }
    `;
    document.head?.appendChild(style);
  };
  ensureLayerStyles();

  const CLOSE_CLASS = 'hidden';

  navs.forEach((nav) => {
    const dropdownButtons = nav.querySelectorAll('[data-dropdown-toggle]');

    dropdownButtons.forEach((btn) => {
      const targetId = btn.getAttribute('data-dropdown-toggle');
      if (!targetId) return;
      const menu = document.getElementById(targetId);
      if (!menu) return;
      const caret = btn.querySelector('[data-dropdown-caret]');
      menu.setAttribute('data-dropdown-menu', 'true');

      menu.style.zIndex = '1310';

      const closeDropdown = () => {
        if (menu.classList.contains(CLOSE_CLASS)) return;
        menu.classList.add(CLOSE_CLASS);
        btn.setAttribute('aria-expanded', 'false');
        caret?.classList.remove('rotate-180');
      };

      const openDropdown = () => {
        menu.classList.remove(CLOSE_CLASS);
        btn.setAttribute('aria-expanded', 'true');
        caret?.classList.add('rotate-180');
      };

      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !btn.contains(event.target)) {
          closeDropdown();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeDropdown();
      });
    });

    const mobileToggle = nav.querySelector('[data-mobile-toggle]');
    const mobileMenuId = mobileToggle?.getAttribute('aria-controls');
    const mobileMenu =
      (mobileMenuId ? document.getElementById(mobileMenuId) : null) ||
      nav.querySelector('[data-mobile-menu]') ||
      document.querySelector('[data-mobile-menu]');
    const mobileBackdrop =
      nav.querySelector('[data-mobile-backdrop]') ||
      document.querySelector('[data-mobile-backdrop]');
    const mobileIcons = nav.querySelectorAll('[data-mobile-icon]');

    mobileMenu?.setAttribute('data-nav-compact', 'true');
    mobileBackdrop?.setAttribute('data-nav-compact', 'true');

    mobileMenu?.style && (mobileMenu.style.zIndex = '1410');
    mobileBackdrop?.style && (mobileBackdrop.style.zIndex = '1400');

    const isCompactMenu =
      mobileMenu?.getAttribute('data-nav-compact') === 'true';

    const setMobileIcons = (isOpen) => {
      mobileIcons.forEach((icon) => {
        const type = icon.getAttribute('data-mobile-icon');
        if (type === 'open') {
          icon.classList.toggle(CLOSE_CLASS, isOpen);
        } else if (type === 'close') {
          icon.classList.toggle(CLOSE_CLASS, !isOpen);
        }
      });
    };

    const updateOverlayPosition = () => {
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        0;
      if (isCompactMenu) return;
      const topValue = `${scrollY}px`;
      if (mobileMenu) {
        mobileMenu.style.top = topValue;
        mobileMenu.style.bottom = 'auto';
        mobileMenu.style.height = '100vh';
      }
      if (mobileBackdrop) {
        mobileBackdrop.style.top = topValue;
        mobileBackdrop.style.bottom = 'auto';
        mobileBackdrop.style.height = '100vh';
      }
    };

    const resetOverlayPosition = () => {
      if (isCompactMenu) return;
      if (mobileMenu) {
        mobileMenu.style.removeProperty('top');
        mobileMenu.style.removeProperty('bottom');
        mobileMenu.style.removeProperty('height');
      }
      if (mobileBackdrop) {
        mobileBackdrop.style.removeProperty('top');
        mobileBackdrop.style.removeProperty('bottom');
        mobileBackdrop.style.removeProperty('height');
      }
    };

    const closeMobileMenu = () => {
      mobileMenu?.classList.add(CLOSE_CLASS);
      mobileBackdrop?.classList.add(CLOSE_CLASS);
      document.body.classList.remove('overflow-hidden');
      resetOverlayPosition();
      mobileToggle?.setAttribute('aria-expanded', 'false');
      setMobileIcons(false);
    };

    const openMobileMenu = () => {
      if (!mobileMenu) {
        mobileToggle?.setAttribute('aria-expanded', 'false');
        setMobileIcons(false);
        return false;
      }
      updateOverlayPosition();
      mobileMenu.classList.remove(CLOSE_CLASS);
      mobileBackdrop?.classList.remove(CLOSE_CLASS);
      document.body.classList.add('overflow-hidden');
      mobileToggle?.setAttribute('aria-expanded', 'true');
      setMobileIcons(true);
      return true;
    };

    mobileToggle?.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMobileMenu();
      } else if (!openMobileMenu()) {
        closeMobileMenu();
      }
    });

    mobileBackdrop?.addEventListener('click', closeMobileMenu);

    const closeMobileElements = [
      ...nav.querySelectorAll('[data-close-mobile]'),
      ...(mobileMenu ? mobileMenu.querySelectorAll('[data-close-mobile]') : []),
    ];

    closeMobileElements.forEach((el) => {
      el.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    });
  });
})();
