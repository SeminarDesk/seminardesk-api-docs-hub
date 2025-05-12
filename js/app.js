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
    return SwaggerUIBundle({
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
        },
        onComplete: function () {
            // This callback is triggered when Swagger UI has finished rendering
            // Dispatch a custom event that we can listen for in initPage
            const event = new CustomEvent('swaggerUIComplete');
            document.dispatchEvent(event);
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

    // Check cache first
    if (apiCache[apiType][version]) {
        return apiCache[apiType][version];
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        let spec;
        if (apiType === 'webhooks') {
            const yamlText = await response.text();
            try {
                spec = jsyaml.load(yamlText);
            } catch (e) {
                console.error('Invalid YAML format');
                return null;
            }
        } else {
            try {
                spec = await response.json();
            } catch (e) {
                console.error('Invalid JSON format');
                return null;
            }
        }

        // Validate spec
        if (!spec || typeof spec !== 'object') {
            console.error('Invalid specification format');
            return null;
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

        // Check if this is a user-initiated version change (not during page initialization)
        const isUserInitiated = e.isTrusted || window._isManualVersionChange;

        // Update URL with version parameter while preserving other parameters
        const url = new URL(window.location.href);
        url.searchParams.set('version', version);

        // Only remove hash fragment when explicitly switching versions via the dropdown
        // not during the initial page load
        if (isUserInitiated) {
            url.hash = ''; // Remove hash fragment when switching versions
        }

        window.history.pushState({version: version}, '', url.toString());

        // Show loading state
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';

        try {
            const spec = await fetchApiSpec(apiType, version);
            // Initialize Swagger UI and store the instance
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

    // Handle browser history navigation (back/forward buttons)
    window.addEventListener('popstate', () => {
        const version = new URLSearchParams(window.location.search).get('version') || 'v1';
        const versionSelect = document.getElementById('version-select');
        if (versionSelect && versionSelect.value !== version) {
            versionSelect.value = version;
            versionSelect.dispatchEvent(new Event('change'));
        }
    });

    // Load initial version
    document.getElementById('version-select').value = new URLSearchParams(window.location.search).get('version') || 'v1';

    // Store the hash fragment before triggering the change event
    const originalHash = window.location.hash;

    // Flag to prevent infinite loops during initialization
    let initialLoadComplete = false;

    // Trigger initial load - mark this as not a user-initiated change
    window._isManualVersionChange = false;
    document.getElementById('version-select').dispatchEvent(new Event('change'));
    window._isManualVersionChange = true;

    // After the Swagger UI is initialized, restore the hash fragment if it exists
    if (originalHash) {
        // Function to handle hash restoration and scrolling
        const handleHashRestoration = () => {
            // Only restore hash if we haven't already processed it
            if (!initialLoadComplete) {
                initialLoadComplete = true;

                // Set the hash which should trigger Swagger UI's built-in deep linking
                window.location.hash = originalHash;

                // If Swagger UI's deep linking doesn't scroll properly, we'll do it manually
                // Find the element referenced by the hash and scroll to it
                const hashId = originalHash.substring(1); // Remove the # symbol

                // Add a small delay to ensure the DOM is fully updated after setting the hash
                setTimeout(() => {
                    // Try multiple selectors to find the element
                    // Swagger UI might create elements with different IDs or classes
                    const element = document.getElementById(hashId) ||
                        document.querySelector(`[id="${hashId}"]`) ||
                        document.querySelector(`a[href="${originalHash}"]`) ||
                        document.querySelector(`div[id*="${hashId}"]`) ||
                        document.querySelector(`div[data-tag="${hashId.split('/')[1]}"]`) ||
                        document.querySelector(`.opblock-tag-section[data-tag="${hashId.split('/')[1]}"]`);

                    if (element) {
                        // Try multiple scrolling methods
                        element.scrollIntoView({behavior: 'smooth', block: 'start'});

                        // If the above doesn't work, try a more direct approach
                        const elementRect = element.getBoundingClientRect();
                        const absoluteElementTop = elementRect.top + window.pageYOffset;
                        window.scrollTo({
                            top: absoluteElementTop - 50, // Add some offset for header
                            behavior: 'smooth'
                        });
                    } else {
                        // Try to find and expand the operation tag section first
                        const tagName = hashId.split('/')[1];
                        if (tagName) {
                            const tagSection = document.querySelector(`div[data-tag="${tagName}"]`) ||
                                document.querySelector(`.opblock-tag-section[data-tag="${tagName}"]`);

                            if (tagSection) {
                                // Try to expand the section if it's collapsed
                                const tagButton = tagSection.querySelector('.opblock-tag');
                                if (tagButton) {
                                    tagButton.click();
                                }

                                // Scroll to the tag section
                                tagSection.scrollIntoView({behavior: 'smooth', block: 'start'});

                                // Then try to find the operation after expanding
                                setTimeout(() => {
                                    const operation = document.getElementById(hashId) ||
                                        document.querySelector(`[id="${hashId}"]`) ||
                                        document.querySelector(`div[id*="${hashId}"]`);

                                    if (operation) {
                                        operation.scrollIntoView({behavior: 'smooth', block: 'start'});
                                    }
                                }, 500);
                            }
                        }
                    }
                }, 100);
            }
        };

        // Listen for the custom event dispatched by Swagger UI's onComplete callback
        document.addEventListener('swaggerUIComplete', handleHashRestoration, {once: true});

        // Fallback: If for some reason the event doesn't trigger within 2 seconds,
        // handle the hash restoration anyway
        setTimeout(() => {
            if (!initialLoadComplete) {
                handleHashRestoration();
            }
        }, 2000);
    } else {
        initialLoadComplete = true;
    }
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
