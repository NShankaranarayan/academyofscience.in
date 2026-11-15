(() => {
  let instagramEmbedLoader;

  function loadInstagramEmbed() {
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
      return Promise.resolve();
    }
    if (instagramEmbedLoader) return instagramEmbedLoader;

    instagramEmbedLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => {
        if (!window.instgrm?.Embeds?.process) {
          reject(new Error("Instagram embed did not initialize."));
          return;
        }
        window.instgrm.Embeds.process();
        resolve();
      };
      script.onerror = () => reject(new Error("Instagram embed failed to load."));
      document.head.append(script);
    });
    return instagramEmbedLoader;
  }

  document.querySelectorAll(".video-poster[data-video-embed]").forEach((poster) => {
    poster.addEventListener("click", (event) => {
      let embedUrl;
      try {
        embedUrl = new URL(poster.dataset.videoEmbed);
      } catch {
        return;
      }
      const provider = poster.dataset.videoProvider;
      if (provider === "youtube") {
        if (embedUrl.origin !== "https://www.youtube-nocookie.com" || !/^\/embed\/[A-Za-z0-9_-]{11}$/.test(embedUrl.pathname)) return;
        event.preventDefault();
        embedUrl.searchParams.set("autoplay", "1");
        const player = document.createElement("iframe");
        player.src = embedUrl.href;
        player.title = poster.dataset.videoTitle || "Video summary";
        player.loading = "lazy";
        player.referrerPolicy = "strict-origin-when-cross-origin";
        player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        player.setAttribute("allowfullscreen", "");

        const frame = document.createElement("div");
        frame.className = "video-player";
        frame.append(player);
        poster.replaceWith(frame);
        return;
      }

      if (provider !== "instagram" || embedUrl.origin !== "https://www.instagram.com" || !/^\/(?:p|reel|tv)\/[A-Za-z0-9_-]{5,32}\/$/.test(embedUrl.pathname)) return;
      event.preventDefault();
      const frame = document.createElement("div");
      frame.className = "video-player instagram-video-player";
      const quote = document.createElement("blockquote");
      quote.className = "instagram-media";
      quote.dataset.instgrmPermalink = embedUrl.href;
      quote.dataset.instgrmVersion = "14";
      quote.dataset.instgrmCaptioned = "";
      quote.setAttribute("aria-label", poster.dataset.videoTitle || "Instagram video summary");
      const postLink = document.createElement("a");
      postLink.href = embedUrl.href;
      postLink.target = "_blank";
      postLink.rel = "noopener noreferrer";
      postLink.textContent = "View this public post on Instagram";
      quote.append(postLink);
      const fallback = document.createElement("a");
      fallback.href = embedUrl.href;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.textContent = "Open this video on Instagram ↗";
      frame.append(quote, fallback);
      poster.replaceWith(frame);
      loadInstagramEmbed().catch(() => {
        frame.classList.add("instagram-video-error");
      });
    });
  });
})();
