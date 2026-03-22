/**
 * General Slider component
 * To create standalone sliders on the page, add swiper script and this component script to the page
 */

class Slider {
  COMPONENT_SELECTOR = '[data-slider-el="component"]';
  NAV_PREV_BUTTON_SELECTOR = '[data-slider-el="nav-prev"]';
  NAV_NEXT_BUTTON_SELECTOR = '[data-slider-el="nav-next"]';
  PAGINATION_SELECTOR = '[data-slider-el="pagination"], .swiper-pagination';

  CUSTOM_GAP_ATTR = 'data-slider-gap';

  swiperComponents: NodeListOf<HTMLElement> | [];
  swiper: Swiper | null;

  constructor() {
    this.swiperComponents = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.initSliders();
  }

  initSliders() {
    this.swiperComponents.forEach((swiperComponent) => {
      const swiperEl = swiperComponent.querySelector('.swiper');
      if (!swiperEl) {
        console.error('`.swiper` element not found', swiperComponent);
        return;
      }

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);

      const navigationConfig =
        navPrevButtonEl && navNextButtonEl
          ? {
              nextEl: navNextButtonEl,
              prevEl: navPrevButtonEl,
              disabledClass: 'is-disabled',
            }
          : false;

      const paginationEl = swiperComponent.querySelector(this.PAGINATION_SELECTOR);
      const bulletClass =
        paginationEl?.getAttribute('data-bullet-class') || 'slider_pagination-bullet';
      const bulletActiveClass =
        paginationEl?.getAttribute('data-bullet-active-class') || 'is-active';
      const paginationConfig = paginationEl
        ? {
            el: paginationEl,
            clickable: true,
            bulletClass,
            bulletActiveClass,
          }
        : false;

      // Per-instance gap from wrapper attribute (default 32)
      const gapAttr = swiperComponent.getAttribute(this.CUSTOM_GAP_ATTR);
      const gap = gapAttr !== null && gapAttr !== undefined ? Number.parseFloat(gapAttr) : 0;

      this.swiper = new Swiper(swiperEl, {
        loop: false,
        spaceBetween: gap,
        slidesPerView: 'auto',
        navigation: navigationConfig,
        pagination: paginationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        a11y: {
          enabled: true,
        },
        breakpoints: {
          320: {
            spaceBetween: gap / 2,
          },
          600: {
            spaceBetween: gap / 1.5,
          },
          992: {
            spaceBetween: gap,
          },
        },
      });
    });
  }
}

window.loadCSS('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css');

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new Slider();
});
