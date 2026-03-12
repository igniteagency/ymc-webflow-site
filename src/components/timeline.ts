import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Timeline Component
 * Handles pinning and active class toggling for timeline items
 */
export const initTimeline = () => {
  const section = document.querySelector('.section_timeline');
  const timelineItems = gsap.utils.toArray<HTMLElement>('.timeline_item');

  if (!section || timelineItems.length === 0) return;

  // Create a GSAP MatchMedia instance
  const mm = gsap.matchMedia();

  mm.add(
    {
      // Desktop
      isDesktop: '(min-width: 992px)',
      // Mobile/Tablet
      isMobile: '(max-width: 991px)',
    },
    (context) => {
      const { isDesktop } = context.conditions as gsap.Conditions;

      // 1. PINNING LOGIC (Desktop only)
      if (isDesktop) {
        const pixelsPerItem = 600; // Increase this for a longer "wait" time per item

        ScrollTrigger.create({
          trigger: section,
          start: 'center center',
          end: () => `+=${timelineItems.length * pixelsPerItem}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        });
      }

      // 2. CLASS TOGGLE LOGIC (Works for both based on viewport center)
      timelineItems.forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          // On desktop, it triggers as the pin moves the items through the center
          // On mobile, it triggers as the user scrolls the items past the center
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive) {
              // Reset all and set active
              timelineItems.forEach((el) => el.classList.remove('is-active'));
              item.classList.add('is-active');
            }
          },
          onLeaveBack: () => {
            // Keeps the first item orange when scrolling back to the very top
            if (i === 0) item.classList.add('is-active');
          },
        });
      });

      return () => {
        // Cleanup ScrollTriggers when media query changes
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    }
  );
};

// Initialize when the script is loaded
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  initTimeline();
});
