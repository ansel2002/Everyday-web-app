// Apply a saved theme override before first paint, so there is no flash.
// A separate file (not inline) so the Content Security Policy can forbid inline scripts.
try {
  var t = localStorage.getItem('everyday.theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
