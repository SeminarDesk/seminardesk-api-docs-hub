// Get base URL for assets
function getBaseUrl() {
    // No need for base path when using custom domain
    return '';
}

// Cache for storing API specifications
const apiCache = {
    private: {
        v1: null,
        'v1-next': null
    },
    public: {
        v1: null,
        'v1-next': null
    },
    webhooks: {
        v1: null,
        'v1-next': null
    }
};

// API specification URLs
const API_URLS = {
    private: {
        v1: 'https://raw.githubusercontent.com/SeminarDesk/private-api-specs/main/private-api.json',
        'v1-next': 'https://raw.githubusercontent.com/SeminarDesk/private-api-specs/next/private-api.json'
    },
    public: {
        v1: 'https://raw.githubusercontent.com/SeminarDesk/public-api-specs/main/public-api.json',
        'v1-next': 'https://raw.githubusercontent.com/SeminarDesk/public-api-specs/next/public-api.json'
    },
    webhooks: {
        v1: 'https://raw.githubusercontent.com/SeminarDesk/webhook-specs/main/webhooks.yaml',
        'v1-next': 'https://raw.githubusercontent.com/SeminarDesk/webhook-specs/next/webhooks.yaml'
    }
};

// Initialize Swagger UI
function initSwaggerUI(spec, containerId, apiType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Initialize Swagger UI with conditional settings based on API type
    const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: `#${containerId}`,
        deepLinking: true,
        displayRequestDuration: true,
        filter: apiType !== 'webhooks',
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: apiType === 'webhooks' ? 1 : -1,
        docExpansion: apiType === 'webhooks' ? "full" : "list",
        defaultModelExpandDepth: apiType === 'webhooks' ? 5 : 1,
        showExtensions: apiType === 'webhooks',
        syntaxHighlight: {
            theme: "monokai"
        }
    });
}

// Fetch API specification
async function fetchApiSpec(apiType, version) {
    const url = API_URLS[apiType][version];
    const cacheKey = `${apiType}-${version}`;

    // Check cache first
    if (apiCache[apiType][version]) {
        return apiCache[apiType][version];
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let spec;
        if (apiType === 'webhooks') {
            const yamlText = await response.text();
            spec = jsyaml.load(yamlText);
        } else {
            spec = await response.json();
        }

        // Cache the result
        apiCache[apiType][version] = spec;
        return spec;
    } catch (error) {
        console.error(`Error fetching ${apiType} ${version}:`, error);
        throw error;
    }
}

// Handle version selection
function handleVersionSelect(apiType) {
    const versionSelect = document.getElementById('version-select');
    if (!versionSelect) return;

    versionSelect.addEventListener('change', async (e) => {
        const version = e.target.value;
        const containerId = 'swagger-ui';
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');

        // Show loading state
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';

        try {
            const spec = await fetchApiSpec(apiType, version);
            initSwaggerUI(spec, containerId, apiType);
        } catch (error) {
            errorElement.textContent = `Failed to load ${apiType} specification: ${error.message}`;
            errorElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    });
}

// Initialize page
function initPage(apiType) {
    // Set up version selector
    handleVersionSelect(apiType);

    // Set active navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Load initial version
    const version = new URLSearchParams(window.location.search).get('version') || 'v1';
    document.getElementById('version-select').value = version;

    // Trigger initial load
    document.getElementById('version-select').dispatchEvent(new Event('change'));
}

// Add loading indicator
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.className = 'loading';
    loadingDiv.style.display = 'none';
    loadingDiv.innerHTML = '<p>Loading API specification...</p>';
    document.getElementById('swagger-ui').parentNode.insertBefore(loadingDiv, document.getElementById('swagger-ui'));
}

// Add error message container
function addErrorContainer() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error';
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'none';
    document.getElementById('swagger-ui').parentNode.insertBefore(errorDiv, document.getElementById('swagger-ui'));
}

// Initialize common elements
document.addEventListener('DOMContentLoaded', () => {
    addLoadingIndicator();
    addErrorContainer();
    addBackToTopButton();
    initBackToTop();
});

// Add back to top button
function addBackToTopButton() {
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Scroll to top');
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 4l8 8h-6v8h-4v-8H4z"/>
    </svg>`;
    document.body.appendChild(button);
}

// Initialize back to top functionality
function initBackToTop() {
    const button = document.querySelector('.back-to-top');
    if (!button) return;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    });

    // Smooth scroll to top
    button.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
} 