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
  CROSSFADE_ATTR = 'data-slider-crossfade';
  AUTOPLAY_ATTR = 'data-slider-autoplay';
  AUTOPLAY_DURATION_ATTR = 'data-slider-autoplay-duration';

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
      const hasCrossfade = swiperComponent.hasAttribute(this.CROSSFADE_ATTR);

      // Autoplay configuration
      const autoplayAttr = swiperComponent.getAttribute(this.AUTOPLAY_ATTR);
      const hasAutoplay = autoplayAttr !== null && autoplayAttr !== 'false';

      let autoplayDelay = 3000;
      if (autoplayAttr && !Number.isNaN(Number.parseInt(autoplayAttr, 10))) {
        autoplayDelay = Number.parseInt(autoplayAttr, 10);
      } else {
        const durationAttr =
          swiperComponent.getAttribute(this.AUTOPLAY_DURATION_ATTR) ||
          swiperComponent.getAttribute('data-slider-duration');
        if (durationAttr && !Number.isNaN(Number.parseInt(durationAttr, 10))) {
          autoplayDelay = Number.parseInt(durationAttr, 10);
        }
      }

      const autoplayConfig = hasAutoplay
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false;

      this.swiper = new Swiper(swiperEl, {
        effect: hasCrossfade ? 'fade' : 'slide',
        loop: true,
        autoplay: autoplayConfig,
        spaceBetween: hasCrossfade ? 0 : gap,
        slidesPerView: hasCrossfade ? 1 : 'auto',
        navigation: navigationConfig,
        pagination: paginationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        fadeEffect: hasCrossfade
          ? {
              crossFade: true,
            }
          : undefined,
        a11y: {
          enabled: true,
        },
        breakpoints: hasCrossfade
          ? undefined
          : {
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

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new Slider();
});
