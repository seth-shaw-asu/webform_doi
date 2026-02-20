(function (Drupal, once, drupalSettings) {
  'use strict';

  /**
   * DOI Lookup behavior - fetches metadata from CrossRef API.
   * 
   * E.g. 10.1061/(ASCE)IS.1943-555X.0000349
   */
  Drupal.behaviors.webformDoiLookup = {
    attach: function (context, settings) {
      once('webform-doi-lookup', 'input#edit-doi', context).forEach(function (element) {
        let debounceTimer;
        // Listen for input changes
        element.addEventListener('input', function () {
          // console.log('DOI input changed:', element.value);
          clearTimeout(debounceTimer);
          const doi = element.value.trim();

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
          displaySuccess(input, 'DOI metadata loaded successfully');
        } else {
          displayError(input, 'Invalid response from CrossRef API');
        }
      })
      .catch(function (error) {
        input.classList.remove('loading');
        displayError(input, 'Error fetching DOI: ' + error.message);
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
      form.querySelectorAll('input[data-doi-field], textarea[data-doi-field], select[data-doi-field]').forEach(function (targetInput) {
        if (targetInput.dataset.doiField == 'doi') {
         return; // Skip DOI field itself
        }
        let sourceFields = targetInput.dataset.doiField.split(' ').map(f => f.trim());
        console.log('Attempting to populate field:', targetInput.name, 'from metadata field:', sourceFields);
        let value = '';
        sourceFields.forEach(function (fieldName) {
          let fieldPath = fieldName.split('.'); // Handle nested fields like 'published-print.date-parts'
          if (metadata.hasOwnProperty(fieldPath[0])) {
            if (fieldPath.length > 1) {
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
            console.log('Populating field:', targetInput.name, 'with value:', value);
            targetInput.value = value;
            return; // Stop after finding the first valid field
          }
        });
        
      });
    } catch (e) {
      console.error('Error parsing target fields:', e);
    }
  }

  /**
   * Display success message.
   */
  function displaySuccess(input, message) {
      let messageElement = document.createElement('div');
      messageElement.classList.add('messages', 'messages--status');
      messageElement.innerHTML = '<em class="placeholder">' + message + '</em>';
      input.after(messageElement);
  }

  /**
   * Display error message.
   */
  function displayError(input, message) {
    let messageElement = document.createElement('div');
      messageElement.classList.add('messages','messages--error');
      messageElement.innerHTML = '<em class="placeholder">' + message + '</em>';
      input.after(messageElement);

    // Ensure error messages don't auto-hide
    // Users need to know what went wrong
  }

})(Drupal, once, drupalSettings);
