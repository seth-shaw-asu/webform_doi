(function (Drupal, once) {
  'use strict';

  /**
   * Trigger DOI lookup when a valid DOI is entered in the field.
   * The field should have the data attribute `data-doi-field="doi"` to be recognized.
   */
  Drupal.behaviors.webformDoiLookup = {
    attach: function (context, settings) {
      once('webform-doi-lookup', '[data-doi-field="doi"]', context).forEach(function (element) {
        const input = element.querySelector('input');
         // Debounce to limit API calls while typing.
        const delay = parseInt(input.dataset.delay, 10) || 500;
        input.addEventListener('input', Drupal.debounce(function (event) {
          const doi = event.target.value.trim();
          if (isDoi(doi)) {
            // Dispatch the custom 'doi_entry' event to trigger the Drupal AJAX callback.
            event.target.dispatchEvent(new Event('doi_entry', { bubbles: true }));
          }
        }, delay));
      });
    }
  };

  /**
   * Validate DOI format.
   * 
   * E.g. 10.1061/(ASCE)IS.1943-555X.0000349
   */
  function isDoi(str) {
    // Basic DOI validation - starts with 10. and contains /
    return /^10\.\d{4,}\/\S+/.test(str);
  }

})(Drupal, once);
