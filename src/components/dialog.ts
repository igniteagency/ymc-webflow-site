/**
 * Popups with dialog HTML element
 * Set `data-dialog-id="{unique-number}"` attribute on the dialog element to target it
 * Set `data-dialog-lock-scroll` attribute on the dialog element to lock page scroll while it is open
 * Set `data-dialog-open="{unique-number}"` attribute on open trigger element(s) to open the dialog
 * Set `data-dialog-close="{unique-number}"` attribute on close trigger element(s) to close the dialog. Close triggers should be inside the dialog element
 * If a single dialog and its triggers live inside `[data-dialog-container]`, the ID can be omitted and will be assigned automatically
 *
 * TODO: make it work with the new `command` and `commandfor` libraries with fallback polyfill script
 */
class Dialog {
  private readonly DATA_CONTAINER = 'data-dialog-container';
  private readonly DATA_ATTR = 'data-dialog-id';
  private readonly DATA_ATTR_LOCK_SCROLL = 'data-dialog-lock-scroll';
  private readonly DATA_ATTR_OPEN = 'data-dialog-open';
  private readonly DATA_ATTR_CLOSE = 'data-dialog-close';
  private readonly DATA_COMPONENT_SELECTOR = `dialog[${this.DATA_ATTR}]`;
  private initializedIds = new Set<string>();
  private generatedIdCount = 0;
  private bodyScrollLockState: {
    bodyOverflow: string;
    bodyPaddingRight: string;
    htmlOverflow: string;
  } | null = null;

  constructor() {
    this.init();
    this.handleBackdropClick();
  }

  private init() {
    this.normalizeContainerScopedDialogs();

    const dialogList = document.querySelectorAll<HTMLDialogElement>(this.DATA_COMPONENT_SELECTOR);

    dialogList.forEach((dialogEl) => {
      const id = dialogEl.getAttribute(this.DATA_ATTR);
      if (!id) {
        console.error('No ID found for dialog component', dialogEl);
        return;
      }

      if (this.initializedIds.has(id)) {
        console.warn(`Duplicate dialog ID "${id}" found. Skipping initialization.`, dialogEl);
        return;
      }

      this.initializedIds.add(id);

      const openTriggersList = document.querySelectorAll(`[${this.DATA_ATTR_OPEN}="${id}"]`);
      const closeTriggersList = dialogEl.querySelectorAll(`[${this.DATA_ATTR_CLOSE}="${id}"]`);

      openTriggersList.forEach((openTriggerEl) => {
        openTriggerEl.addEventListener('click', () => {
          this.openDialog(dialogEl);
        });
      });

      closeTriggersList.forEach((closeTriggerEl) => {
        closeTriggerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeDialog(dialogEl);
        });
      });

      // Handle native close event (e.g. when user presses Esc key)
      dialogEl.addEventListener('close', (event) => {
        this.closeDialog(dialogEl, true);
      });
    });
  }

  private normalizeContainerScopedDialogs() {
    const containerList = document.querySelectorAll<HTMLElement>(`[${this.DATA_CONTAINER}]`);

    containerList.forEach((containerEl) => {
      const dialogList = containerEl.querySelectorAll<HTMLDialogElement>('dialog');
      if (dialogList.length !== 1) return;

      const dialogEl = dialogList[0];
      const dialogId = dialogEl.getAttribute(this.DATA_ATTR) || this.createDialogId();

      dialogEl.setAttribute(this.DATA_ATTR, dialogId);
      this.populateContainerTriggerIds(containerEl, this.DATA_ATTR_OPEN, dialogId);
      this.populateContainerTriggerIds(containerEl, this.DATA_ATTR_CLOSE, dialogId);
    });
  }

  private populateContainerTriggerIds(
    containerEl: HTMLElement,
    attributeName: string,
    dialogId: string,
  ) {
    const triggerList = containerEl.querySelectorAll<HTMLElement>(`[${attributeName}]`);

    triggerList.forEach((triggerEl) => {
      if (triggerEl.getAttribute(attributeName) === '') {
        triggerEl.setAttribute(attributeName, dialogId);
      }
    });
  }

  private createDialogId() {
    let dialogId = '';

    do {
      this.generatedIdCount += 1;
      dialogId = `dialog-${this.generatedIdCount}`;
    } while (document.querySelector(`[${this.DATA_ATTR}="${dialogId}"]`));

    return dialogId;
  }

  private openDialog(dialogEl: HTMLDialogElement) {
    dialogEl.showModal();
    this.updateBodyScrollLock();

    // new custom event
    const dialogOpenEvent = new CustomEvent('dialogOpen', {
      detail: { dialogId: dialogEl.getAttribute(this.DATA_ATTR) },
    });
    dialogEl.dispatchEvent(dialogOpenEvent);
  }

  private closeDialog(dialogEl: HTMLDialogElement, isAutoClosing = false) {
    if (!isAutoClosing) {
      dialogEl.close();
    }

    this.updateBodyScrollLock();

    // new custom event
    const dialogCloseEvent = new CustomEvent('dialogClose', {
      detail: { dialogId: dialogEl.getAttribute(this.DATA_ATTR) },
    });
    dialogEl.dispatchEvent(dialogCloseEvent);
  }

  private updateBodyScrollLock() {
    const hasLockingDialogOpen = Array.from(
      document.querySelectorAll<HTMLDialogElement>(
        `${this.DATA_COMPONENT_SELECTOR}[${this.DATA_ATTR_LOCK_SCROLL}]`,
      ),
    ).some((dialogEl) => dialogEl.open);

    if (hasLockingDialogOpen) {
      this.lockBodyScroll();
      return;
    }

    this.unlockBodyScroll();
  }

  private lockBodyScroll() {
    if (this.bodyScrollLockState) return;

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    this.bodyScrollLockState = {
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
    };

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private unlockBodyScroll() {
    if (!this.bodyScrollLockState) return;

    const { body, documentElement } = document;
    const { bodyOverflow, bodyPaddingRight, htmlOverflow } = this.bodyScrollLockState;

    documentElement.style.overflow = htmlOverflow;
    body.style.overflow = bodyOverflow;
    body.style.paddingRight = bodyPaddingRight;

    this.bodyScrollLockState = null;
  }

  /**
   * Handles backdrop click to close dialog
   * Only closes if the click was directly on the dialog element (backdrop) and not its children
   */
  private handleBackdropClick() {
    const dialogEl = document.querySelectorAll<HTMLDialogElement>('dialog');
    dialogEl.forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        const dialogEl = event.target as HTMLDialogElement;
        if (!(dialogEl instanceof HTMLDialogElement)) return;

        // Check if click was directly on the dialog element (backdrop)
        const rect = dialogEl.getBoundingClientRect();
        const clickedInDialog =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (!clickedInDialog && event.target === dialogEl) {
          this.closeDialog(dialogEl);
        }
      });
    });
  }
}

export default Dialog;
