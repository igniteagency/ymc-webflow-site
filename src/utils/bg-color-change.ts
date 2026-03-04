/**
 * Changes the background color of the page wrapper based on trigger elements.
 * This is implemented as a global script that checks for trigger elements on the page.
 * Uses global gsap and ScrollTrigger as defined in global.d.ts
 */
export const initBgColorChange = () => {
  const wrapper = document.querySelector('.page-wrapper');
  const triggers = gsap.utils.toArray<HTMLElement>('.section_bg-change');

  if (!wrapper || triggers.length === 0) return;

  if (typeof ScrollTrigger === 'undefined') {
    console.warn('ScrollTrigger is not defined. BgColorChange script skipped.');
    return;
  }

  function changeBackground() {
    wrapper.classList.toggle('background-color-secondary');
  }

  triggers.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        changeBackground();
      },
      onEnterBack: () => {
        changeBackground();
      },
    });
  });
};
