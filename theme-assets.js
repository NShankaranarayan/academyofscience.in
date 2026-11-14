const themeScript = [...document.scripts].find(script => script.src.includes('theme-assets.js'));
const logoUrl = new URL(activeTheme.logo, themeScript.src);
logoUrl.searchParams.set('v', '4');
document.querySelectorAll('img[data-theme-logo], .hero-mark img').forEach(image => { image.src = logoUrl; });
document.querySelectorAll('link[rel~="icon"]').forEach(icon => { icon.href = logoUrl.href; icon.type = 'image/svg+xml'; });
const logoMarkUrl = new URL(activeTheme.logoMark, themeScript.src);
logoMarkUrl.searchParams.set('v', '1');
document.querySelectorAll('img[data-theme-logo-mark]').forEach(image => { image.src = logoMarkUrl.href; });
