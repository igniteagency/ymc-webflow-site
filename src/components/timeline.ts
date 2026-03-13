import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Timeline Component
 * Handles pinning and active class toggling for timeline items
 */
export const initTimeline = () => {
  const sections = document.querySelectorAll<HTMLElement>('.section_timeline');

  if (sections.length === 0) return;

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

      sections.forEach((section) => {
        const timelineItems = gsap.utils.toArray<HTMLElement>('.timeline_item', section);
        if (timelineItems.length === 0) return;

        // 1. DESKTOP LOGIC (Horizontal row - uses progress)
        if (isDesktop) {
          const pixelsPerItem = 600;

          ScrollTrigger.create({
            trigger: section,
            start: 'center center',
            end: () => `+=${timelineItems.length * pixelsPerItem}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Calculate active index based on scroll progress
              // We use a small buffer at the very end to ensure the last item stays active
              const progress = self.progress;
              const index = Math.min(
                Math.floor(progress * timelineItems.length),
                timelineItems.length - 1
              );

              timelineItems.forEach((item, i) => {
                item.classList.toggle('is-active', i === index);
              });
            },
            onLeaveBack: () => {
              // Ensure first item is active when scrolling back above the section
              timelineItems.forEach((item, i) => {
                item.classList.toggle('is-active', i === 0);
              });
            },
          });
        }

        // 2. MOBILE LOGIC (Vertical stack - uses individual triggers)
        if (!isDesktop) {
          timelineItems.forEach((item, i) => {
            ScrollTrigger.create({
              trigger: item,
              start: 'top center',
              end: 'bottom center',
              onToggle: (self) => {
                if (self.isActive) {
                  timelineItems.forEach((el) => el.classList.remove('is-active'));
                  item.classList.add('is-active');
                }
              },
              onLeaveBack: () => {
                if (i === 0) item.classList.add('is-active');
              },
            });
          });
        }
      });
    }
  );
};

// Initialize when the script is loaded
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  initTimeline();
});
