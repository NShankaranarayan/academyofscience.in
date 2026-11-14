/* Generated from themes/active.json; run python3 scripts/build_theme.py after changing themes. */
const activeTheme = {"theme":"gold","accent":"#D4AA60","accentBright":"#D4AA60","darkBackground":"#090A0A","headerFooter":"#000000","paper":"#F2EFE8","paperSecondary":"#E8E3D9","logo":"assets/logo-gold.svg","logoMark":"assets/logo-mark-gold.svg","assetVersion":"dcda7e55ac87"};
document.documentElement.dataset.theme = activeTheme.theme;
for (const [key, value] of Object.entries(activeTheme)) { if (key !== 'theme' && key !== 'assetVersion') document.documentElement.style.setProperty('--' + key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), value); }
