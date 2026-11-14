(() => {
  const dialog = document.querySelector("#fieldNoteShareDialog");
  if (!dialog) return;

  const input = dialog.querySelector("[data-share-input]");
  const summaryPreview = dialog.querySelector("[data-share-summary]");
  const count = dialog.querySelector("[data-share-count]");
  const status = dialog.querySelector("[data-share-status]");
  const articleUrl = dialog.dataset.noteUrl || window.location.href;

  function updatePreview() {
    const summary = input.value.trim();
    summaryPreview.textContent = summary || "Your personal summary will appear here.";
    count.textContent = `${input.value.length} / ${input.maxLength}`;
  }

  function captionText() {
    const summary = input.value.trim();
    return `${summary ? `${summary}\n\n` : ""}Read the full note: ${articleUrl}`;
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(captionText());
      return true;
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = captionText();
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
    status.textContent = copied
      ? "Caption and article link copied. Paste them into your LinkedIn post."
      : "Copy failed. Select and copy your summary and article link manually.";
  });

  dialog.querySelector("[data-share-linkedin]").addEventListener("click", async () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    const copyPromise = copyCaption();
    const shareWindow = window.open(linkedInUrl, "_blank");
    if (shareWindow) shareWindow.opener = null;
    const copied = await copyPromise;
    status.textContent = copied
      ? "Caption copied. Paste it above the article preview in LinkedIn, then review and post."
      : "LinkedIn opened. Copy your summary and article link from this panel, then paste and post.";
  });

  updatePreview();
})();
