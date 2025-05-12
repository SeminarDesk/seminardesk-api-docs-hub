# SeminarDesk API Documentation Hub

Static documentation site for SeminarDesk's APIs. Built with HTML, CSS, and JavaScript, using Swagger UI for API specification rendering.

## Development Process

This project was developed using AI pair programming with [Cursor](https://cursor.sh/), leveraging Claude 3.5 Sonnet for:
- Architecture and component design
- Implementation of layouts
- Integration of Swagger UI
- UI components
- Documentation

## Project Structure
```
seminardesk-api-docs-hub/
├── css/
│   └── styles.css      # Global styles
├── js/
│   └── app.js          # API spec loading and UI initialization
├── icons/
│   ├── arrow-up.svg    # Back to top button icon
│   ├── chevron-down.svg # Version selector icon
│   └── external-link.svg # External link indicator
├── index.html          # Landing page
├── private-api.html    # Private API documentation
├── public-api.html     # Public API documentation
└── webhooks.html       # Webhooks documentation
```

## API Specifications

API specifications are fetched from GitHub repositories:

```
Private API:
v1:     github.com/SeminarDesk/private-api-specs/main/private-api.json
v1-next: github.com/SeminarDesk/private-api-specs/next/private-api.json

Public API:
v1:     github.com/SeminarDesk/public-api-specs/main/public-api.json
v1-next: github.com/SeminarDesk/public-api-specs/next/public-api.json

Webhooks:
v1:     github.com/SeminarDesk/webhook-specs/main/webhooks.yaml
v1-next: github.com/SeminarDesk/webhook-specs/next/webhooks.yaml
```

## Technical Details

- **Framework**: None - pure HTML/CSS/JS
- **API Spec Format**: OpenAPI 3.0
- **Dependencies**:
  - Swagger UI v5.21.0 (via cdnjs.cloudflare.com)
  - js-yaml v4.1.0 (via cdnjs.cloudflare.com)

## Development

### Setup
1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Install dependencies:
   ```
   npm install
   ```

### Running the Development Server
To start the development server:
```
npm start
```

This will:
- Start a local server on port 3000
- Open your default browser to http://localhost:3000
- Disable caching to ensure you always see the latest changes

## Deployment
Deploy directly to any static hosting service. No build process required. 
