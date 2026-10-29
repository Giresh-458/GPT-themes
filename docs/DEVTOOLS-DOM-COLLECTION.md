# Collecting the DOM evidence needed for safe ChatGPT styling

1. Open a normal ChatGPT conversation in Chrome.
2. Open DevTools (F12) and select Elements.
3. Use the element picker to select the actual sidebar, message container, composer outer panel, composer editor, and attachment/send controls individually.
4. For each selected element, switch to Console and run the safe ancestor/style report from the project task instructions. Review its output before sharing.
5. In Elements → Computed, verify background, opacity, position, overflow, backdrop-filter, and pseudo-elements.
6. Check selector match counts on the actual page before committing to a CSS selector.
7. Repeat on an initial page, a populated conversation, normal composer, open menu, and image-generation mode.
8. Compare Console errors with the extension disabled and enabled.

Do not share authentication tokens, cookies, private messages, names, or unrelated page markup. A small set of selected outerHTML snippets with sensitive text removed is preferable to dumping the whole document.
