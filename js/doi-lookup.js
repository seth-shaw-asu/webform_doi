(function (Drupal, once, drupalSettings) {
  'use strict';

  /**
   * DOI Lookup behavior - fetches metadata from CrossRef API.
   * 
   * E.g. 10.1061/(ASCE)IS.1943-555X.0000349
   */
  Drupal.behaviors.webformDoiLookup = {
    attach: function (context, settings) {
      once('webform-doi-lookup', '[data-doi-field="doi"]', context).forEach(function (element) {
        const messages = new Drupal.Message();
        let debounceTimer;
        // Listen for input changes
        let doiInput = element.querySelector('input');
        doiInput.addEventListener('input', function () {
          // console.log('DOI input changed:', element.value);
          clearTimeout(debounceTimer);
          const doi = doiInput.value.trim();

          // Validate DOI format
          if (doi && isDoi(doi)) {
            debounceTimer = setTimeout(function () {
              fetchDoiMetadata(doi, element);
            }, 500);
          }
        });
      });
    }
  };

  /**
   * Validate DOI format.
   */
  function isDoi(str) {
    // Basic DOI validation - starts with 10. and contains /
    console.log('Validating DOI:', str);
    return /^10\.\d{4,}\/\S+/.test(str);
  }

  /**
   * Fetch metadata from CrossRef API.
   */
  function fetchDoiMetadata(doi, input) {
    console.log('Fetching metadata for DOI:', doi);
    const apiUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi);

    // Add loading state
    input.classList.add('loading');

    fetch(apiUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('DOI not found or API error: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        input.classList.remove('loading');
        
        if (data && data.message) {
          populateFields(input, data.message);
          console.log('DOI metadata fetched:', data.message);
          new Drupal.Message().add('DOI metadata loaded successfully', { type: 'status' });
        } else {
          new Drupal.Message().add('Invalid response from CrossRef API', { type: 'error' });
        }
      })
      .catch(function (error) {
        input.classList.remove('loading');
        new Drupal.Message().add('Error fetching DOI: ' + error.message, { type: 'error' });
        console.error('DOI lookup error:', error);
      });
  }

  /**
   * Populate webform fields with CrossRef metadata.
   */
  function populateFields(input, metadata) {
    const form = input.closest('form');

    // TODO: Figure out how to handle repeatable fields like authors.
    try {
      form.querySelectorAll('[data-doi-field]').forEach(function (targetInput) {
        if (targetInput.dataset.doiField == 'doi') {
         return; // Skip DOI field itself
        }
        let sourceFields = targetInput.dataset.doiField.split(' ').map(f => f.trim());
        let values = [];
        sourceFields.forEach(function (fieldName) {
          let value = '';
          let fieldPath = fieldName.split('.'); // Handle nested fields like 'published-print.date-parts'
          if (metadata.hasOwnProperty(fieldPath[0])) {
            if (fieldPath.length > 1) {
              // Handle date parts which are arrays of arrays (e.g. "published-print": { "date-parts": [[2020, 5, 20]] })
              if (fieldPath[1] == 'date-parts' && Array.isArray(metadata[fieldPath[0]][fieldPath[1]])) {
                metadata[fieldPath[0]][fieldPath[1]][0].forEach(function(part, index) {
                  if (index > 0) {
                    value += '-';
                  }
                  value += String(part).padStart(2, '0'); // Pad month and day with leading zeros
                });
              } else {
              value = metadata[fieldPath[0]][fieldPath[1]];
              }
            } else {
              value = metadata[fieldPath[0]];
            }
            values.push(value);
          }
        });
        // Multiple vs single value handling.
        if (targetInput.classList.contains('form-type-webform-multiple')) {
          // TODO: figure out how to add more input fields if there are more values than existing inputs.
          let targetInputs = targetInput.querySelectorAll('input');
          values.forEach(function (val, index) {
            if (index < targetInputs.length) {
              targetInputs[index].value = val;
            }
          });
        } else {
          targetInput.querySelector('input').value = values[0] ?? '';
        }
        
      });
    } catch (e) {
      console.error('Error parsing target fields:', e);
    }
  }

})(Drupal, once, drupalSettings);
