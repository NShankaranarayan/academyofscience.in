const themeScript = [...document.scripts].find(script => script.src.includes('theme-assets.js'));
const logoUrl = new URL(activeTheme.logo, themeScript.src);
logoUrl.searchParams.set('v', '3');
document.querySelectorAll('img[data-theme-logo], .hero-mark img').forEach(image => { image.src = logoUrl; });
document.querySelectorAll('link[rel~="icon"]').forEach(icon => { icon.href = logoUrl.href; icon.type = 'image/svg+xml'; });
