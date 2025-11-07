(function () {
  const navs = document.querySelectorAll('[data-nav-root]');
  if (!navs.length) return;

  const CLOSE_CLASS = 'hidden';

  navs.forEach((nav) => {
    const dropdownButtons = nav.querySelectorAll('[data-dropdown-toggle]');

    dropdownButtons.forEach((btn) => {
      const targetId = btn.getAttribute('data-dropdown-toggle');
      if (!targetId) return;
      const menu = document.getElementById(targetId);
      if (!menu) return;
      const caret = btn.querySelector('[data-dropdown-caret]');

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

    const closeMobileMenu = () => {
      mobileMenu?.classList.add(CLOSE_CLASS);
      mobileBackdrop?.classList.add(CLOSE_CLASS);
      document.body.classList.remove('overflow-hidden');
      mobileToggle?.setAttribute('aria-expanded', 'false');
      setMobileIcons(false);
    };

    const openMobileMenu = () => {
      if (!mobileMenu) {
        mobileToggle?.setAttribute('aria-expanded', 'false');
        setMobileIcons(false);
        return false;
      }
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
