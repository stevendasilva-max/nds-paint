(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothScrollTo(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    var behavior = prefersReducedMotion ? "auto" : "smooth";
    target.scrollIntoView({ behavior: behavior, block: "start" });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    var href = a.getAttribute("href");
    if (href.length > 1 && document.querySelector(href)) {
      e.preventDefault();
      smoothScrollTo(href);
      closeNav();
    }
  });

  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".nav");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  var navBackdrop = document.getElementById("navBackdrop");

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (navBackdrop) {
      navBackdrop.hidden = !open;
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  function closeNav() {
    setNavOpen(false);
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      setNavOpen(open);
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener("click", closeNav);
  }

  if (navMenu) {
    navMenu.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    var menuCta = navMenu.querySelector(".nav__menu-cta a");
    if (menuCta) menuCta.addEventListener("click", closeNav);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (typeof closeLightbox === "function" && lightbox && !lightbox.hidden) {
      closeLightbox();
      return;
    }
    if (nav && nav.classList.contains("is-open")) {
      closeNav();
      if (navToggle) navToggle.focus();
    }
  });

  var scrollTicking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!header) return;
      if (!scrollTicking) {
        window.requestAnimationFrame(function () {
          header.classList.toggle("is-scrolled", window.scrollY > 12);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var gallery = document.getElementById("gallery");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var galleryItems = [];
  var currentIndex = 0;
  var lastFocus = null;

  function collectGallery() {
    galleryItems = [];
    if (!gallery) return;
    gallery.querySelectorAll(".gallery__item img").forEach(function (img) {
      galleryItems.push({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
      });
    });
  }

  collectGallery();

  function openLightbox(index) {
    if (!lightbox || !lightboxImg || !galleryItems.length) return;
    lastFocus = document.activeElement;
    currentIndex = ((index % galleryItems.length) + galleryItems.length) % galleryItems.length;
    var item = galleryItems[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxPrev.disabled = galleryItems.length < 2;
    lightboxNext.disabled = galleryItems.length < 2;
    setTimeout(function () {
      var closeBtn = lightbox.querySelector(".lightbox__close");
      if (closeBtn) closeBtn.focus();
    }, 10);
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function showPrev() {
    openLightbox(currentIndex - 1);
  }

  function showNext() {
    openLightbox(currentIndex + 1);
  }

  if (gallery) {
    gallery.querySelectorAll(".gallery__item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-lightbox-index"), 10);
        if (!isNaN(idx)) openLightbox(idx);
      });
    });
  }

  lightbox &&
    lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });

  if (lightboxPrev) lightboxPrev.addEventListener("click", showPrev);
  if (lightboxNext) lightboxNext.addEventListener("click", showNext);

  function getLightboxFocusables() {
    if (!lightbox) return [];
    return Array.prototype.slice
      .call(lightbox.querySelectorAll(".lightbox__close, .lightbox__nav"))
      .filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
  }

  lightbox &&
    lightbox.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key !== "Tab") return;
      var focusables = getLightboxFocusables();
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

  var form = document.getElementById("contactForm");
  var formSuccess = document.getElementById("formSuccess");
  var formFields = document.getElementById("formFields");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (formFields) formFields.hidden = true;
      if (formSuccess) {
        formSuccess.hidden = false;
      }
      form.reset();
    });
  }
})();
