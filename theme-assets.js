const themeScript = [...document.scripts].find(script => script.src.includes('theme-assets.js'));
const assetVersion = activeTheme.assetVersion || '1';
const logoUrl = new URL(activeTheme.logo, themeScript.src);
logoUrl.searchParams.set('v', assetVersion);
document.querySelectorAll('img[data-theme-logo], .hero-mark img').forEach(image => { image.src = logoUrl; });
document.querySelectorAll('link[rel~="icon"]').forEach(icon => { icon.href = logoUrl.href; icon.type = 'image/svg+xml'; });
const logoMarkUrl = new URL(activeTheme.logoMark, themeScript.src);
logoMarkUrl.searchParams.set('v', assetVersion);
document.querySelectorAll('img[data-theme-logo-mark]').forEach(image => { image.src = logoMarkUrl.href; });

const sourceAccent = [237, 51, 38];
const themeAccent = activeTheme.accent.match(/[\da-f]{2}/gi)?.map(value => parseInt(value, 16)) || sourceAccent;
const themedImageCache = new Map();

function getThemedImage(source) {
  if (themeAccent.every((value, index) => value === sourceAccent[index])) return Promise.resolve(null);
  if (themedImageCache.has(source)) return themedImageCache.get(source);

  const result = new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const red = pixels.data[i], green = pixels.data[i + 1], blue = pixels.data[i + 2];
          const dominance = red - Math.max(green, blue);
          if (pixels.data[i + 3] === 0 || red < 58 || dominance < 18) continue;
          const amount = Math.min(1, (dominance - 18) / 70);
          const brightness = red / 255;
          pixels.data[i] = Math.round(red + (themeAccent[0] * brightness - red) * amount);
          pixels.data[i + 1] = Math.round(green + (themeAccent[1] * brightness - green) * amount);
          pixels.data[i + 2] = Math.round(blue + (themeAccent[2] * brightness - blue) * amount);
        }
        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
  themedImageCache.set(source, result);
  return result;
}

document.querySelectorAll('[data-theme-art]').forEach(async art => {
  const isImage = art instanceof HTMLImageElement;
  const background = isImage ? '' : getComputedStyle(art).backgroundImage;
  const backgroundMatch = background.match(/url\(["']?(.*?)["']?\)/);
  const source = isImage ? art.currentSrc || art.src : backgroundMatch?.[1];
  if (!source) return;
  const themedSource = await getThemedImage(source);
  if (!themedSource) return;
  if (isImage) art.src = themedSource;
  else art.style.backgroundImage = `url("${themedSource}")`;
});
