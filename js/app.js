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
    // Validate inputs
    if (!spec || typeof spec !== 'object') {
        console.error('Invalid specification provided');
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content safely
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Sanitize apiType
    const safeApiType = String(apiType).toLowerCase();

    // Check if SwaggerUIBundle is defined
    if (typeof SwaggerUIBundle === 'undefined') {
        console.error('SwaggerUIBundle is not defined. Make sure Swagger UI is properly loaded.');
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.textContent = 'Failed to load specification: SwaggerUIBundle is not defined';
            errorElement.style.display = 'block';
        }
        return;
    }

    // Initialize Swagger UI with conditional settings based on API type
    const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: `#${containerId}`,
        deepLinking: true,
        displayRequestDuration: true,
        filter: safeApiType !== 'webhooks',
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: safeApiType === 'webhooks' ? 1 : -1,
        docExpansion: safeApiType === 'webhooks' ? "full" : "list",
        defaultModelExpandDepth: safeApiType === 'webhooks' ? 5 : 1,
        showExtensions: safeApiType === 'webhooks',
        syntaxHighlight: {
            theme: "monokai"
        }
    });
}

// Fetch API specification
async function fetchApiSpec(apiType, version) {
    // Validate inputs
    if (!apiType || !version || !API_URLS[apiType] || !API_URLS[apiType][version]) {
        throw new Error('Invalid API type or version');
    }

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
            try {
                spec = jsyaml.load(yamlText);
            } catch (e) {
                throw new Error('Invalid YAML format');
            }
        } else {
            try {
                spec = await response.json();
            } catch (e) {
                throw new Error('Invalid JSON format');
            }
        }

        // Validate spec
        if (!spec || typeof spec !== 'object') {
            throw new Error('Invalid specification format');
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
    const swaggerUI = document.getElementById('swagger-ui');
    if (swaggerUI && swaggerUI.parentNode) {
        swaggerUI.parentNode.insertBefore(loadingDiv, swaggerUI);
    }
}

// Add error message container
function addErrorContainer() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error';
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'none';
    const swaggerUI = document.getElementById('swagger-ui');
    if (swaggerUI && swaggerUI.parentNode) {
        swaggerUI.parentNode.insertBefore(errorDiv, swaggerUI);
    }
}

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

// Initialize Private API page
function initPrivateApi() {
    initPage('private');
}

// Initialize Public API page
function initPublicApi() {
    initPage('public');
}

// Initialize Webhooks page
function initWebhooks() {
    initPage('webhooks');
}

// Initialize mobile menu
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('expanded');
        const isExpanded = nav.classList.contains('expanded');
        menuToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
}

// Initialize common elements and page based on current path
document.addEventListener('DOMContentLoaded', () => {
    // Add common UI elements
    addLoadingIndicator();
    addErrorContainer();
    addBackToTopButton();
    initBackToTop();
    initMobileMenu();

    // Initialize page based on current path
    const path = window.location.pathname;

    if (path.includes('private-api')) {
        initPrivateApi();
    } else if (path.includes('public-api')) {
        initPublicApi();
    } else if (path.includes('webhooks')) {
        initWebhooks();
    }
});
