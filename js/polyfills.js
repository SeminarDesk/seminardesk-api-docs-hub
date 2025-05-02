// Polyfills for modern JavaScript features
// This file provides compatibility for older browsers that don't support ES6+ features

(function() {
  // Check if the browser needs polyfills
  var needsPolyfills = !window.Promise || !window.fetch || !window.Symbol || 
                       typeof Object.assign !== 'function' || 
                       !Array.prototype.includes;

  if (needsPolyfills) {
    console.log('Loading polyfills for older browsers');

    // Create script element for Cloudflare's polyfill CDN
    // Using Cloudflare CDN for security reasons instead of polyfill.io
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/core-js/3.32.2/minified.min.js';
    script.integrity = 'sha512-H5jPxTuFzKTUeN3GIKYHtPrYgL5/AKWIwkXwwerHbvJ6iYKrKzWremotaZeqQZA0Zes9VH/Ck4QNQ+9qLYddjg==';
    script.crossOrigin = 'anonymous';
    script.async = false; // Load synchronously to ensure polyfills are available before app code

    // Insert the script at the beginning of the head
    document.head.insertBefore(script, document.head.firstChild);
  }
})();
