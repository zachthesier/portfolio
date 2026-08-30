if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const toggle = document.querySelector(".theme-toggle");
const root = document.documentElement;

let lenisInstance = null;

if (
  window.Lenis &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  window.matchMedia("(min-width: 1025px)").matches
) {
  lenisInstance = new Lenis();
  const raf = (time) => {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

const getScrollY = () => (lenisInstance ? lenisInstance.scroll : window.scrollY);

function applyStoredTheme() {
  if (root.hasAttribute("data-theme")) return;
  const stored = localStorage.getItem("theme");
  if (stored) {
    root.setAttribute("data-theme", stored);
  }
}

applyStoredTheme();

toggle?.addEventListener("click", () => {
  const current =
    root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

const menuIconBtn = document.querySelector(".menu-icon-btn");
const menuOverlay = document.querySelector(".site-menu-overlay");

if (menuIconBtn && menuOverlay) {
  const closeMenu = () => {
    menuIconBtn.classList.remove("is-open");
    menuOverlay.classList.remove("is-open");
    menuIconBtn.setAttribute("aria-expanded", "false");
    menuIconBtn.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
    lenisInstance?.start();
  };

  const openMenu = () => {
    menuIconBtn.classList.add("is-open");
    menuOverlay.classList.add("is-open");
    menuIconBtn.setAttribute("aria-expanded", "true");
    menuIconBtn.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    lenisInstance?.stop();
  };

  menuIconBtn.addEventListener("click", () => {
    if (menuOverlay.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuOverlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOverlay.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

const photoTriggerLink = document.querySelector(".site-menu-link-photos");
const photoStack = document.querySelector(".site-menu-photo-stack");

if (photoTriggerLink && photoStack) {
  photoTriggerLink.addEventListener("mouseover", () => {
    photoStack.classList.add("is-visible");
  });

  photoTriggerLink.addEventListener("mouseout", () => {
    photoStack.classList.remove("is-visible");
  });
}

const aboutTriggerLink = document.querySelector(".site-menu-link-about");
const aboutPreview = document.querySelector(".site-menu-about-preview");

if (aboutTriggerLink && aboutPreview) {
  aboutTriggerLink.addEventListener("mouseover", () => {
    aboutPreview.classList.add("is-visible");
  });

  aboutTriggerLink.addEventListener("mouseout", () => {
    aboutPreview.classList.remove("is-visible");
  });
}

// Reveal-footer effect: the footer sits fixed behind the page content, and
// the content reserves exactly the footer's own height at its bottom edge —
// like a card sliding up to expose the card underneath it.
const pageContent = document.querySelector(".page-content");
const siteFooter = document.querySelector(".site-footer");

if (pageContent && siteFooter) {
  const syncFooterSpacing = () => {
    pageContent.style.marginBottom = `${siteFooter.offsetHeight}px`;
  };

  syncFooterSpacing();
  window.addEventListener("resize", syncFooterSpacing);
}

const caseHeaderText = document.querySelector(".case-header-text");
const heroImageWrap = document.querySelector(".case-hero-image-wrap");
const heroImage = heroImageWrap?.querySelector("img");

if (caseHeaderText && heroImageWrap) {
  const WIPE_BUFFER = 150;
  const ROTATE_FROM = -5;
  const ROTATE_TO = 2;
  const isDesktopHero = window.matchMedia("(min-width: 1025px)").matches;

  const updateScrollEffects = () => {
    const imageRect = heroImageWrap.getBoundingClientRect();
    const textBottom = caseHeaderText.getBoundingClientRect().bottom;
    caseHeaderText.style.visibility = imageRect.bottom <= textBottom + WIPE_BUFFER ? "hidden" : "visible";

    if (heroImage && isDesktopHero) {
      // Distance from the top of the document down to the image's bottom edge —
      // constant regardless of scroll position, so this doubles as the scrollY
      // value at which the bottom edge reaches the top of the viewport.
      const scrollYAtImageExit = imageRect.bottom + window.scrollY;
      const progress =
        scrollYAtImageExit > 0 ? Math.min(Math.max(window.scrollY / scrollYAtImageExit, 0), 1) : 1;
      const rotation = ROTATE_FROM + progress * (ROTATE_TO - ROTATE_FROM);
      heroImage.style.transform = `rotate(${rotation}deg)`;
    }

    requestAnimationFrame(updateScrollEffects);
  };

  requestAnimationFrame(updateScrollEffects);
}

const arcContainer = document.querySelector(".home-projects-arc");
const isDesktopArcLayout = !!arcContainer && window.matchMedia("(min-width: 1025px)").matches;
let hoveredArcCard = null;
let hoverEffectTimeoutId = null;
let hoverEffectArmed = false;
let isScrolling = false;
let scrollSnapshotY = null;
let scrollSnapshotTime = 0;

const HOVER_EFFECT_DELAY = 400;
const HOVER_SCALE_AMOUNT = 1.05;
const HOVER_SCALE_DURATION = 350;
const SCROLL_SAMPLE_INTERVAL = 150;
const SCROLL_STOP_THRESHOLD = 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const getCurrentCardScale = (card) => {
  if (card._scaleAnimStart === undefined) return 1;
  const t = Math.min((performance.now() - card._scaleAnimStart) / HOVER_SCALE_DURATION, 1);
  return card._scaleAnimFrom + easeOutCubic(t) * (card._scaleAnimTarget - card._scaleAnimFrom);
};

const startCardScaleAnim = (card, target) => {
  card._scaleAnimFrom = getCurrentCardScale(card);
  card._scaleAnimStart = performance.now();
  card._scaleAnimTarget = target;
};

const applyHoverScaleTarget = () => {
  if (!hoveredArcCard) return;
  const targetScale = hoverEffectArmed && !isScrolling ? HOVER_SCALE_AMOUNT : 1;
  if (hoveredArcCard._scaleAnimTarget !== targetScale) {
    startCardScaleAnim(hoveredArcCard, targetScale);
  }
};

const PROJECTS = [
  {
    title: "Discover",
    image: "images/projects/covers/discover.png",
    href: "projects/discover.html",
    tagline: "Designed a 0 → 1 Exposure and Inventory solution, bringing in $1.5M in revenue",
  },
  {
    title: "Vivint",
    image: "images/projects/covers/vivint.png",
    href: null,
    tagline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
  {
    title: "Seed",
    image: "images/projects/covers/seed.png",
    href: null,
    tagline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
  {
    title: "Meta",
    image: "images/projects/covers/meta.png",
    href: null,
    tagline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
  {
    title: "Square",
    image: "images/projects/covers/square.png",
    href: null,
    tagline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
];

if (isDesktopArcLayout) {
  const ROTATE_FROM = 12;
  const ROTATE_TO = -2;
  const THETA_START = (110 * Math.PI) / 180;
  const THETA_END = (-30 * Math.PI) / 180;
  const ELLIPSE_CX_RATIO = 0.654;
  const ELLIPSE_RX_RATIO = 0.05;
  const BUFFER_VIEWPORTS = 2;

  const CARDS_PER_GROUP = PROJECTS.length;

  const scrollToY = (y) => {
    if (lenisInstance) {
      lenisInstance.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo(0, y);
    }
  };

  const createCard = (project) => {
    const el = document.createElement(project.href ? "a" : "div");
    el.className = "home-card";
    if (project.href) {
      el.href = project.href;
    }
    const img = document.createElement("img");
    img.src = project.image;
    img.alt = project.title;
    el.appendChild(img);
    return el;
  };

  const createGroup = () => {
    const fragment = document.createDocumentFragment();
    PROJECTS.forEach((project) => {
      fragment.appendChild(createCard(project));
    });
    return fragment;
  };

  const GROUPS_PER_TRIGGER = 3;

  const createGroups = (count) => {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      fragment.appendChild(createGroup());
    }
    return fragment;
  };

  const appendGroup = () => {
    arcContainer.appendChild(createGroups(GROUPS_PER_TRIGGER));
  };

  const prependGroup = () => {
    const firstCard = arcContainer.firstElementChild;
    const beforeTop = firstCard.getBoundingClientRect().top;
    arcContainer.insertBefore(createGroups(GROUPS_PER_TRIGGER), firstCard);
    const afterTop = firstCard.getBoundingClientRect().top;
    scrollToY(getScrollY() + (afterTop - beforeTop));
  };

  const initialCards = arcContainer.querySelectorAll(".home-card");
  const middleFirstCard = initialCards[CARDS_PER_GROUP];
  const initialRect = middleFirstCard.getBoundingClientRect();
  const initialDocTop = initialRect.top + getScrollY();
  const desiredViewportTop = (window.innerHeight - initialRect.height) / 2;
  scrollToY(initialDocTop - desiredViewportTop);

  const ENTRANCE_DISSOLVE_DURATION = 900;
  const ENTRANCE_DISSOLVE_EASING = "ease-out";
  const CARDS_FADE_DELAY = 1500;
  const TEXT_FADE_DELAY = CARDS_FADE_DELAY + 500;
  const NAV_FADE_DELAY = TEXT_FADE_DELAY + 800;

  // Fades a group of elements in together, `delay` after entrance kicks off.
  const fadeInEntrance = (elements, delay) => {
    const els = elements.filter(Boolean);
    if (!els.length) return;

    els.forEach((el) => {
      el.style.transition = "none";
      el.style.opacity = "0";
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.forEach((el) => {
          el.style.transition = `opacity ${ENTRANCE_DISSOLVE_DURATION}ms ${ENTRANCE_DISSOLVE_EASING}`;
        });

        setTimeout(() => {
          els.forEach((el) => {
            el.style.opacity = "1";
          });

          setTimeout(() => {
            els.forEach((el) => {
              el.style.opacity = "";
              el.style.transition = "";
            });
          }, ENTRANCE_DISSOLVE_DURATION);
        }, delay);
      });
    });
  };

  fadeInEntrance(Array.from(arcContainer.querySelectorAll(".home-card")), CARDS_FADE_DELAY);
  fadeInEntrance([document.querySelector(".home-intro-text-arc")], TEXT_FADE_DELAY);
  fadeInEntrance([document.querySelector(".site-nav")], NAV_FADE_DELAY);

  document.body.classList.remove("entrance-pending");

  const updateArcCards = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw * ELLIPSE_CX_RATIO;
    const rx = vw * ELLIPSE_RX_RATIO;
    const naturalCenterX = vw / 2;

    const cards = arcContainer.querySelectorAll(".home-card");

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);

      const rotation = ROTATE_FROM + progress * (ROTATE_TO - ROTATE_FROM);
      const theta = THETA_START + progress * (THETA_END - THETA_START);
      const targetX = cx + rx * Math.cos(theta);
      const translateX = targetX - naturalCenterX;
      const scale = getCurrentCardScale(card);

      card.style.transform = `translateX(${translateX}px) rotate(${rotation}deg) scale(${scale})`;
    });

    const lastCard = cards[cards.length - 1];
    const firstCard = cards[0];

    if (lastCard.getBoundingClientRect().top < vh * BUFFER_VIEWPORTS) {
      appendGroup();
    }

    if (firstCard.getBoundingClientRect().bottom > -vh * BUFFER_VIEWPORTS) {
      prependGroup();
    }

    const settledScrollY = getScrollY();
    const now = performance.now();
    if (scrollSnapshotY === null) {
      scrollSnapshotY = settledScrollY;
      scrollSnapshotTime = now;
    } else if (now - scrollSnapshotTime >= SCROLL_SAMPLE_INTERVAL) {
      const moved = Math.abs(settledScrollY - scrollSnapshotY);
      const nowScrolling = moved > SCROLL_STOP_THRESHOLD;
      if (nowScrolling !== isScrolling) {
        isScrolling = nowScrolling;
        applyHoverScaleTarget();
      }
      scrollSnapshotY = settledScrollY;
      scrollSnapshotTime = now;
    }

    requestAnimationFrame(updateArcCards);
  };

  requestAnimationFrame(updateArcCards);
}

const workListMobile = document.querySelector(".work-list-mobile");

if (workListMobile && arcContainer) {
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "work-list-items";

  PROJECTS.forEach((project, index) => {
    if (index > 0) {
      itemsContainer.appendChild(document.createElement("hr")).className = "work-list-divider";
    }

    const item = document.createElement(project.href ? "a" : "div");
    item.className = "work-list-item";
    if (project.href) {
      item.href = project.href;
    }

    const text = document.createElement("div");
    text.className = "work-list-item-text";

    const heading = document.createElement("h2");
    heading.textContent = project.title;
    text.appendChild(heading);

    const tagline = document.createElement("p");
    tagline.textContent = project.tagline;
    text.appendChild(tagline);

    item.appendChild(text);

    const card = document.createElement("div");
    card.className = "work-list-card";
    const img = document.createElement("img");
    img.src = project.image;
    img.alt = project.title;
    card.appendChild(img);
    item.appendChild(card);

    itemsContainer.appendChild(item);
  });

  workListMobile.appendChild(itemsContainer);

  const taglineBlock = workListMobile.querySelector(".work-list-tagline");
  const firstItemText = itemsContainer.querySelector(".work-list-item-text");
  const firstCard = itemsContainer.querySelector(".work-list-card");

  if (taglineBlock && firstItemText && firstCard) {
    const adjustTaglineHeight = () => {
      const itemTextHeight = firstItemText.getBoundingClientRect().height;
      const cardMarginTop = parseFloat(getComputedStyle(firstCard).marginTop);
      const cardHeight = firstCard.getBoundingClientRect().height;
      const requiredHeight = Math.max(
        200,
        window.innerHeight - itemTextHeight - cardMarginTop - cardHeight / 2
      );
      taglineBlock.style.minHeight = `${requiredHeight}px`;
    };

    adjustTaglineHeight();
    window.addEventListener("resize", adjustTaglineHeight);
  }
}

const introTextArc = document.querySelector(".home-intro-text-arc");
const hoverTextArc = document.querySelector(".home-hover-text-arc");
const cardCursor = document.querySelector(".home-card-cursor");
const cardCursorDot = document.querySelector(".home-card-cursor-dot");

if (introTextArc && hoverTextArc && isDesktopArcLayout) {
  const introTopAlignRect = introTextArc.getBoundingClientRect();
  hoverTextArc.style.top = `${introTopAlignRect.top}px`;
  hoverTextArc.style.bottom = "auto";

  const CROSSFADE_DELAY = 300;
  let crossfadeTimeoutId = null;

  const clearPendingCrossfade = () => {
    if (crossfadeTimeoutId) {
      clearTimeout(crossfadeTimeoutId);
      crossfadeTimeoutId = null;
    }
  };

  const hoverTextArcHeading = hoverTextArc.querySelector("h2");
  const hoverTextArcBody = hoverTextArc.querySelector("p");

  arcContainer.addEventListener("mouseover", (event) => {
    const hoveredCard = event.target.closest(".home-card");
    if (hoveredCard) {
      const img = hoveredCard.querySelector("img");
      const project = PROJECTS.find((p) => p.title === img.alt);

      clearPendingCrossfade();
      introTextArc.style.opacity = "0";
      hoverTextArc.style.opacity = "0";
      crossfadeTimeoutId = setTimeout(() => {
        if (project) {
          hoverTextArcHeading.textContent = project.title;
          hoverTextArcBody.textContent = project.tagline;
        }
        hoverTextArc.style.opacity = "1";
      }, CROSSFADE_DELAY);
    }
  });

  arcContainer.addEventListener("mouseout", (event) => {
    if (event.target.closest(".home-card")) {
      clearPendingCrossfade();
      hoverTextArc.style.opacity = "0";
      crossfadeTimeoutId = setTimeout(() => {
        introTextArc.style.opacity = "1";
      }, CROSSFADE_DELAY);
    }
  });

  arcContainer.addEventListener("mouseover", (event) => {
    const hoveredCard = event.target.closest(".home-card");
    if (hoveredCard) {
      hoveredArcCard = hoveredCard;
      hoverEffectArmed = false;
      arcContainer.querySelectorAll(".home-card").forEach((card) => {
        card.style.opacity = card === hoveredCard ? "1" : "0.5";
      });

      if (hoverEffectTimeoutId) {
        clearTimeout(hoverEffectTimeoutId);
      }
      hoverEffectTimeoutId = setTimeout(() => {
        if (hoveredArcCard === hoveredCard) {
          hoverEffectArmed = true;
          applyHoverScaleTarget();
          if (cardCursorDot) {
            cardCursorDot.classList.add("is-visible");
          }
        }
      }, HOVER_EFFECT_DELAY);
    }
  });

  arcContainer.addEventListener("mouseout", (event) => {
    const unhoveredCard = event.target.closest(".home-card");
    if (unhoveredCard) {
      hoveredArcCard = null;
      hoverEffectArmed = false;
      arcContainer.querySelectorAll(".home-card").forEach((card) => {
        card.style.opacity = "1";
      });

      if (hoverEffectTimeoutId) {
        clearTimeout(hoverEffectTimeoutId);
        hoverEffectTimeoutId = null;
      }
      startCardScaleAnim(unhoveredCard, 1);
      if (cardCursorDot) {
        cardCursorDot.classList.remove("is-visible");
      }
    }
  });

  arcContainer.addEventListener("mousemove", (event) => {
    if (cardCursor && event.target.closest(".home-card")) {
      cardCursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    }
  });
}

const homeIntroText = document.querySelector(".home-intro-text");
const firstHomeCard = document.querySelector(".home-card");

if (homeIntroText && firstHomeCard) {
  const WIPE_BUFFER = 150;

  const updateHomeIntroWipe = () => {
    const cardRect = firstHomeCard.getBoundingClientRect();
    const textBottom = homeIntroText.getBoundingClientRect().bottom;
    homeIntroText.style.visibility = cardRect.bottom <= textBottom + WIPE_BUFFER ? "hidden" : "visible";
    requestAnimationFrame(updateHomeIntroWipe);
  };

  requestAnimationFrame(updateHomeIntroWipe);
}
