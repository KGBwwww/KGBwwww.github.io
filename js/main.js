(() => {
  // ns-hugo-imp:/Users/kgb/KGB777/themes/hugo-theme-memento/assets/js/ephemera.js
  function initEphemeraGallery(root = document) {
    const galleries = [];
    if (root.matches?.("[data-ephemera-gallery]")) {
      galleries.push(root);
    }
    galleries.push(...root.querySelectorAll?.("[data-ephemera-gallery]"));
    galleries.forEach((gallery) => {
      if (gallery.dataset.ephemeraReady === "true") return;
      const slides = Array.from(gallery.querySelectorAll("[data-ephemera-slide]"));
      const prevButton = gallery.querySelector("[data-ephemera-prev]");
      const nextButton = gallery.querySelector("[data-ephemera-next]");
      const status = gallery.querySelector("[data-ephemera-status]");
      if (slides.length === 0) return;
      let currentIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
      if (currentIndex < 0) {
        currentIndex = 0;
      }
      function render(index) {
        currentIndex = index;
        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === currentIndex;
          slide.classList.toggle("is-active", isActive);
          slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });
        if (status) {
          status.textContent = `${currentIndex + 1} / ${slides.length}`;
        }
      }
      prevButton?.addEventListener("click", () => {
        render((currentIndex - 1 + slides.length) % slides.length);
      });
      nextButton?.addEventListener("click", () => {
        render((currentIndex + 1) % slides.length);
      });
      gallery.dataset.ephemeraReady = "true";
      render(currentIndex);
    });
  }
  function initEphemeraViewer() {
    const viewer = document.getElementById("viewer");
    const list = document.querySelector(".ephemera-stream");
    if (!viewer || !list) return;
    const left = viewer.querySelector(".viewer-left");
    const right = viewer.querySelector(".viewer-right");
    const closeButton = viewer.querySelector(".viewer-close");
    function closeViewer() {
      viewer.classList.add("hidden");
      viewer.classList.remove("viewer-empty-media");
      left.innerHTML = "";
      right.innerHTML = "";
      document.body.style.overflow = "";
    }
    function renderViewerContent(ephemera) {
      const summary = ephemera.querySelector(".ephemera-summary")?.cloneNode(true);
      const content = ephemera.querySelector(".ephemera-content")?.cloneNode(true);
      left.innerHTML = "";
      right.innerHTML = "";
      if (summary) {
        left.appendChild(summary);
        initEphemeraGallery(left);
        viewer.classList.remove("viewer-empty-media");
      } else {
        viewer.classList.add("viewer-empty-media");
      }
      if (content) {
        right.appendChild(content);
      }
    }
    async function openViewer(url) {
      if (!url) {
        console.error("Ephemera card is missing data-url.");
        return;
      }
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: ${res.status}`);
        }
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const ephemera = doc.querySelector(".content");
        if (!ephemera) {
          throw new Error(`Missing .content in ${url}`);
        }
        renderViewerContent(ephemera);
        viewer.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      } catch (error) {
        console.error(error);
      }
    }
    list.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      const item = event.target.closest(".ephemera-item");
      if (!item) return;
      openViewer(item.dataset.url);
    });
    closeButton?.addEventListener("click", closeViewer);
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) {
        closeViewer();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !viewer.classList.contains("hidden")) {
        closeViewer();
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initEphemeraGallery();
      initEphemeraViewer();
    });
  } else {
    initEphemeraGallery();
    initEphemeraViewer();
  }

  // ns-hugo-imp:/Users/kgb/KGB777/themes/hugo-theme-memento/assets/js/infinite-scroll.js
  (function() {
    function initInfiniteScroll() {
      var list = document.querySelector("[data-infinite-scroll-list]");
      var sentinel = document.querySelector("[data-infinite-scroll-next]");
      if (!list || !sentinel) return;
      var loading = false;
      var observer = null;
      var scrollHandler = null;
      function getNextUrl() {
        return sentinel.getAttribute("data-next-url");
      }
      function setNextUrl(url) {
        if (url) {
          sentinel.setAttribute("data-next-url", url);
        } else {
          sentinel.removeAttribute("data-next-url");
        }
      }
      function setStatus(text) {
        var status = sentinel.querySelector("[data-infinite-scroll-status]");
        if (status) {
          status.textContent = text;
        }
      }
      function stop() {
        if (observer) {
          observer.disconnect();
        }
        if (scrollHandler) {
          window.removeEventListener("scroll", scrollHandler);
        }
        sentinel.remove();
      }
      function appendCards(doc) {
        var newCards = doc.querySelectorAll("[data-infinite-scroll-item]");
        Array.prototype.forEach.call(newCards, function(card) {
          list.appendChild(card);
        });
      }
      function loadMore() {
        if (loading) return;
        var nextUrl = getNextUrl();
        if (!nextUrl) {
          stop();
          return;
        }
        loading = true;
        setStatus("\u6B63\u5728\u52A0\u8F7D...");
        fetch(nextUrl).then(function(res) {
          if (!res.ok) {
            throw new Error("Failed to load next page: " + res.status);
          }
          return res.text();
        }).then(function(html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, "text/html");
          appendCards(doc);
          var newNext = doc.querySelector("[data-infinite-scroll-next]");
          if (newNext) {
            setNextUrl(newNext.getAttribute("data-next-url"));
            setStatus("\u52A0\u8F7D\u66F4\u591A");
          } else {
            stop();
          }
        }).catch(function(err) {
          console.error(err);
          setStatus("\u52A0\u8F7D\u5931\u8D25\uFF0C\u7A0D\u540E\u91CD\u8BD5");
        }).then(function() {
          loading = false;
        });
      }
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(function(entries) {
          if (entries.some(function(entry) {
            return entry.isIntersecting;
          })) {
            loadMore();
          }
        }, {
          rootMargin: "0px",
          threshold: 0.75
        });
        observer.observe(sentinel);
        return;
      }
      scrollHandler = function onScroll() {
        var rect = sentinel.getBoundingClientRect();
        if (rect.top < window.innerHeight - 48) {
          loadMore();
        }
      };
      window.addEventListener("scroll", scrollHandler, { passive: true });
      scrollHandler();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initInfiniteScroll);
    } else {
      initInfiniteScroll();
    }
  })();

  // <stdin>
  console.log("This site was generated by Hugo.");
  document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    hamburger.addEventListener("click", () => {
      document.getElementById("navBar").classList.toggle("show");
    });
  });
  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const toggleLeft = document.querySelector(".toggle-left");
    const sidebarLeft = document.querySelector(".sidebar-left");
    if (!toggleLeft || !sidebarLeft) {
      return;
    }
    toggleLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      body.classList.toggle("sidebar-open");
    });
    document.addEventListener("click", (e) => {
      if (!body.classList.contains("sidebar-open")) return;
      if (!sidebarLeft.contains(e.target)) {
        body.classList.remove("sidebar-open");
      }
    });
  });
})();
