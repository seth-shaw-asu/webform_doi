# Webform DOI Module

This module provides JavaScript for DOI (Digital Object Identifier) lookup with automatic metadata population from the CrossRef API.

## Features

- **DOI Text Input**: A specialized text input field for entering DOIs
- **CrossRef API Integration**: Automatically fetches metadata when a valid DOI is entered
- **Auto-Population**: Populates other form fields with metadata such as:
  - `title` - Publication title
  - `author` - Authors
  - `journal_title` - Journal name
  - `volume` - Volume number
  - `issue` - Issue number
  - `page` - Page numbers
  - `publication_year` - Year
  - `abstract` - Abstract
  - `publisher` - Publisher
  - `issn` - ISSN
  - `type` - Publication type

- **Error Handling**: User-friendly error messages for invalid DOIs or API failures
- **Client-side Validation**: Basic DOI format validation before API calls

## Installation

1. Place this module in your `web/modules/custom/webform_doi` directory
2. Enable the module via Drush: `drush pm:enable webform_doi`
3. Or enable via the Drupal admin interface: Administration > Extend

## Usage

### Adding a DOI Field to Your Webform

1. Go to your webform configuration
2. In Settings > Form > Form general settings > Form attributes > Form custom attributes (YAML): add the value `doi-integration: true`
3. Add a DOI field:
  1. Click "Add element"
  2. Select "Text Fiel" from the element list
  3. Under "Advanced" > "Element Attributes" > "Element custom attributes (YAML)": add the value `data-doi-field: doi`
4. For each field you want to auto-populate:
  1. Add the element.
  2. Under "Advanced" > "Element Attributes" > "Element custom attributes (YAML)": add the value `data-doi-field: YOUR-FIELD`, replacing 'YOUR-FIELD' with the DOI metadata field source. E.g. `data-doi-field: title` for the title field.
    - Note: Fields with multiple possible values, such as data published coming from either the print or digital can be set with multiple value:
    ```yml
    data-doi-field:
      - published-print.date-parts
      - published-digital.date-parts
    ```

## How It Works

1. User enters or pastes a DOI into the text field (e.g., Nature article: `10.1038/nature12373`, PLOS ONE: `10.1371/journal.pone.0000000`).
2. The JavaScript validates the DOI format and queries the CrossRef API
3. If metadata is found, it populates other form fields automatically
4. Success or error messages are displayed to the user

## API Reference

### CrossRef API

The module uses the free CrossRef API endpoint:
- **URL**: `https://api.crossref.org/works/{DOI}`
- **Response**: Returns comprehensive publication metadata in JSON format

### DOI Format

Valid DOI format: `10.xxxx/yyyy` where:
- `10` is the prefix (DOI standard)
- `xxxx` is the registrant code
- `yyyy` is the item identifier

Examples:
- `10.1038/nature12373`
- `10.1371/journal.pone.0000000`

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Modern browsers with Fetch API support

## Troubleshooting

### DOI Not Found
- Verify the DOI is correct and exists in CrossRef's database
- Some older or non-journal publications may not be indexed

### Fields Not Populating
- Check that your form field names match the auto-detection patterns
- Use the browser console (F12) to verify the API response
- Ensure JavaScript is enabled

### API Errors
- CrossRef API is free and should be available
- Check your network connection
- Rate limiting shouldn't be an issue for typical form usage

## Development

### File Structure

```
webform_doi/
├── webform_doi.info.yml         # Module metadata
├── webform_doi.module           # Module file attaches the JavaScript to the form
├── webform_doi.libraries.yml    # Library definitions
├── js/
│   └── doi-lookup.js            # Client-side logic
├── css/
│   └── doi-lookup.css           # Styling
└── README.md                    # This file
```

### Extending the Module

To customize metadata extraction, edit `js/doi-lookup.js`:
- Modify the `fieldMappings` object to add new fields
- Update `extractXxx()` functions for custom parsing logic
- Adjust selectors in `populateField()` for different field naming schemes

## License

This module is part of the webform-doi project.

## Support

For issues or feature requests, contact your Drupal administrator or module maintainer.
