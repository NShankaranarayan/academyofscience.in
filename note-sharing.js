(() => {
  const dialog = document.querySelector("#fieldNoteShareDialog");
  if (!dialog) return;

  const shareSection = document.querySelector(".article-share");
  const input = dialog.querySelector("[data-share-input]");
  const summaryPreview = dialog.querySelector("[data-share-summary]");
  const count = dialog.querySelector("[data-share-count]");
  const status = dialog.querySelector("[data-share-status]");
  const articleTitle = dialog.dataset.noteTitle || "Field Note";
  const articleUrl = shareSection?.dataset.noteUrl || dialog.dataset.noteUrl || window.location.href;
  const articleCategory = dialog.dataset.noteCategory || "Field Note";
  const articleNumber = dialog.dataset.noteNumber || "01";
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#D4AA60";
  const accentBright = getComputedStyle(document.documentElement).getPropertyValue("--accent-bright").trim() || accent;
  const accentRgb = accent.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  const accentLine = accentRgb ? `rgba(${parseInt(accentRgb[1], 16)},${parseInt(accentRgb[2], 16)},${parseInt(accentRgb[3], 16)},.22)` : "rgba(212,170,96,.22)";

  function updatePreview() {
    const value = input.value.trim();
    summaryPreview.textContent = value || "Your short take will appear here.";
    count.textContent = `${input.value.length} / ${input.maxLength}`;
  }

  function captionText() {
    const summary = input.value.trim();
    return `${summary ? `${summary}\n\n` : ""}Read the full work: ${articleUrl}`;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = value;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.append(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      return copied;
    }
  }

  function copyCaption() {
    return copyText(captionText());
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) {
      let last = visible[visible.length - 1];
      while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      visible[visible.length - 1] = `${last.trimEnd()}…`;
    }
    visible.forEach((textLine, index) => context.fillText(textLine, x, y + index * lineHeight));
    return visible.length;
  }

  function drawShareCard(format = "linkedin") {
    const canvas = document.createElement("canvas");
    const dimensions = format === "instagram-post" ? [1080, 1350] : format === "instagram-story" ? [1080, 1920] : [1200, 627];
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#090a0a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#292c2a";
    const pad = format === "linkedin" ? 16 : 36;
    context.lineWidth = format === "linkedin" ? 2 : 3;
    context.strokeRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);
    context.fillStyle = accent;
    context.fillRect(pad, pad, format === "linkedin" ? 8 : 12, canvas.height - pad * 2);

    const portrait = format !== "linkedin";
    const marginX = portrait ? 92 : 72;
    const rightX = canvas.width - marginX;
    const topY = portrait ? (format === "instagram-story" ? 190 : 132) : 76;
    context.font = `600 ${portrait ? 20 : 16}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.fillStyle = accentBright;
    context.fillText(`PORTFOLIO  /  ${articleCategory.toUpperCase()}`, marginX, topY);
    context.textAlign = "right";
    context.fillStyle = "#898b86";
    context.fillText(`${articleNumber.padStart(2, "0")}  /  ACADEMY OF SCIENCE`, rightX, topY);
    context.textAlign = "left";
    context.strokeStyle = "#343735";
    context.beginPath();
    const ruleY = topY + (portrait ? 40 : 28);
    context.moveTo(marginX, ruleY);
    context.lineTo(rightX, ruleY);
    context.stroke();

    context.fillStyle = "#f2efe8";
    const titleFont = portrait ? (format === "instagram-story" ? 76 : 72) : articleTitle.length > 42 ? 48 : 58;
    const titleWidth = portrait ? canvas.width - marginX * 2 : 790;
    const titleY = portrait ? ruleY + (format === "instagram-story" ? 170 : 125) : 190;
    const titleLeading = portrait ? titleFont * 1.13 : 66;
    context.font = `700 ${titleFont}px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    const titleLines = wrapText(context, articleTitle, marginX, titleY, titleWidth, titleLeading, portrait ? 3 : 2);

    context.fillStyle = "#aaa9a2";
    const summaryFont = portrait ? 31 : 24;
    context.font = `400 ${summaryFont}px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    const summaryTop = (portrait ? titleY : 190) + titleLines * titleLeading + (portrait ? 42 : 8);
    wrapText(context, input.value.trim() || "A note from the Academy of Science portfolio.", marginX + 4, summaryTop, portrait ? titleWidth - 8 : 760, portrait ? 44 : 36, portrait ? 4 : 4);

    const centerX = portrait ? canvas.width / 2 : 1000;
    const centerY = portrait ? Math.round(canvas.height * (format === "instagram-story" ? .71 : .73)) : 344;
    context.strokeStyle = accentLine;
    context.lineWidth = 1;
    const orbitScale = portrait ? (format === "instagram-story" ? 1.25 : .9) : 1;
    [106, 145, 182].map(radius => radius * orbitScale).forEach((radius, index) => {
      context.beginPath();
      context.setLineDash(index === 1 ? [5, 8] : []);
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();
    });
    context.setLineDash([]);
    context.strokeStyle = "rgba(255,255,255,.14)";
    context.beginPath();
    const crossSize = 196 * orbitScale;
    context.moveTo(centerX - crossSize, centerY);
    context.lineTo(centerX + crossSize, centerY);
    context.moveTo(centerX, centerY - crossSize);
    context.lineTo(centerX, centerY + crossSize);
    context.stroke();
    context.fillStyle = accent;
    context.beginPath();
    context.arc(centerX + 105 * orbitScale, centerY - 106 * orbitScale, 7 * orbitScale, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.8;
    context.beginPath();
    context.arc(centerX - 144 * orbitScale, centerY + 62 * orbitScale, 4 * orbitScale, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = "#343735";
    context.beginPath();
    const footerRuleY = portrait ? canvas.height - (format === "instagram-story" ? 190 : 150) : 548;
    context.moveTo(marginX, footerRuleY);
    context.lineTo(rightX, footerRuleY);
    context.stroke();
    context.font = `600 ${portrait ? 18 : 14}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.fillStyle = "#efede6";
    context.fillText("ACADEMY OF SCIENCE", marginX, footerRuleY + (portrait ? 48 : 36));
    context.textAlign = "right";
    context.fillStyle = accentBright;
    context.fillText("ACADEMYOFSCIENCE.IN", rightX, footerRuleY + (portrait ? 48 : 36));
    context.textAlign = "left";
    return canvas;
  }

  function downloadCard() {
    const format = dialog.querySelector("[data-share-format]").value;
    const canvas = drawShareCard(format);
    if (!canvas) return false;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${dialog.dataset.noteTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${format}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    return true;
  }

  document.querySelector("[data-open-share]").addEventListener("click", () => {
    updatePreview();
    dialog.showModal();
    input.focus();
  });
  dialog.querySelector("[data-close-share]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  input.addEventListener("input", updatePreview);

  const formatSelect = dialog.querySelector("[data-share-format]");
  formatSelect.addEventListener("change", () => {
    dialog.querySelector("[data-share-card]").dataset.format = formatSelect.value;
  });

  const inlineStatus = shareSection.querySelector("[data-inline-share-status]");
  shareSection.querySelector("[data-copy-url]").addEventListener("click", async () => {
    const copied = await copyText(articleUrl);
    inlineStatus.textContent = copied ? "Article URL copied." : "Copy failed. Copy the page address from your browser.";
  });

  const nativeShare = shareSection.querySelector("[data-native-share]");
  if (navigator.share) {
    nativeShare.hidden = false;
    nativeShare.addEventListener("click", async () => {
      try {
        await navigator.share({ title: articleTitle, text: `${articleTitle} — Academy of Science`, url: articleUrl });
      } catch (error) {
        if (error.name !== "AbortError") inlineStatus.textContent = "Could not open the device share menu.";
      }
    });
  }

  dialog.querySelector("[data-copy-caption]").addEventListener("click", async () => {
    const copied = await copyCaption();
    status.textContent = copied ? "Caption and article link copied. Paste them into your LinkedIn post." : "Copy failed. Select and copy your summary and article link manually.";
  });

  dialog.querySelector("[data-download-card]").addEventListener("click", () => {
    status.textContent = downloadCard()
      ? "Image downloaded. Upload it to your LinkedIn post or Instagram app."
      : "Could not prepare the image on this browser.";
  });

  updatePreview();
})();
