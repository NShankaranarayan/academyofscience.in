(() => {
  const dialog = document.querySelector("#fieldNoteShareDialog");
  if (!dialog) return;

  const input = dialog.querySelector("[data-share-input]");
  const summaryPreview = dialog.querySelector("[data-share-summary]");
  const count = dialog.querySelector("[data-share-count]");
  const status = dialog.querySelector("[data-share-status]");
  const articleTitle = dialog.dataset.noteTitle || "Field Note";
  const articleUrl = dialog.dataset.noteUrl || window.location.href;
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
    return `${summary ? `${summary}\n\n` : ""}Read the full note: ${articleUrl}`;
  }

  async function copyCaption() {
    const value = captionText();
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

  function drawShareCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 627;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#090a0a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#292c2a";
    context.lineWidth = 2;
    context.strokeRect(16, 16, 1168, 595);
    context.fillStyle = accent;
    context.fillRect(16, 16, 8, 595);

    context.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillStyle = accentBright;
    context.fillText(`FIELD NOTE  /  ${articleCategory.toUpperCase()}`, 72, 76);
    context.textAlign = "right";
    context.fillStyle = "#898b86";
    context.fillText(`${articleNumber.padStart(2, "0")}  /  ACADEMY OF SCIENCE`, 1124, 76);
    context.textAlign = "left";
    context.strokeStyle = "#343735";
    context.beginPath();
    context.moveTo(72, 104);
    context.lineTo(1124, 104);
    context.stroke();

    context.fillStyle = "#f2efe8";
    context.font = `700 ${articleTitle.length > 42 ? 48 : 58}px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    const titleLines = wrapText(context, articleTitle, 72, 190, 790, 66, 2);

    context.fillStyle = "#aaa9a2";
    context.font = "400 24px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    const summaryTop = 190 + titleLines * 66 + 8;
    wrapText(context, input.value.trim() || "Your short take will appear here.", 76, summaryTop, 760, 36, 4);

    const centerX = 1000;
    const centerY = 344;
    context.strokeStyle = accentLine;
    context.lineWidth = 1;
    [106, 145, 182].forEach((radius, index) => {
      context.beginPath();
      context.setLineDash(index === 1 ? [5, 8] : []);
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();
    });
    context.setLineDash([]);
    context.strokeStyle = "rgba(255,255,255,.14)";
    context.beginPath();
    context.moveTo(centerX - 196, centerY);
    context.lineTo(centerX + 196, centerY);
    context.moveTo(centerX, centerY - 196);
    context.lineTo(centerX, centerY + 196);
    context.stroke();
    context.fillStyle = accent;
    context.beginPath();
    context.arc(centerX + 105, centerY - 106, 7, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.8;
    context.beginPath();
    context.arc(centerX - 144, centerY + 62, 4, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = "#343735";
    context.beginPath();
    context.moveTo(72, 548);
    context.lineTo(1124, 548);
    context.stroke();
    context.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillStyle = "#efede6";
    context.fillText("ACADEMY OF SCIENCE", 72, 584);
    context.textAlign = "right";
    context.fillStyle = accentBright;
    context.fillText("ACADEMYOFSCIENCE.IN", 1124, 584);
    context.textAlign = "left";
    return canvas;
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

  dialog.querySelector("[data-copy-caption]").addEventListener("click", async () => {
    const copied = await copyCaption();
    status.textContent = copied ? "Caption and article link copied. Paste them into your LinkedIn post." : "Copy failed. Select and copy your summary and article link manually.";
  });

  dialog.querySelector("[data-share-linkedin]").addEventListener("click", async () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    const shareWindow = window.open(linkedInUrl, "_blank");
    if (shareWindow) shareWindow.opener = null;
    const copied = await copyCaption();
    status.textContent = copied
      ? "Your caption and link are copied. Paste them into the LinkedIn composer."
      : "LinkedIn opened. Copy your summary and article link from this panel and paste them into the post.";
  });

  dialog.querySelector("[data-download-card]").addEventListener("click", () => {
    const canvas = drawShareCard();
    if (!canvas) {
      status.textContent = "Could not prepare the image on this browser.";
      return;
    }
    canvas.toBlob(blob => {
      if (!blob) {
        status.textContent = "Could not prepare the image on this browser.";
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${dialog.dataset.noteTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-field-note.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      status.textContent = "Card image downloaded. Add it as a LinkedIn image post and paste the caption with the article link.";
    }, "image/png");
  });

  updatePreview();
})();
