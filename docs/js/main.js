document.addEventListener('DOMContentLoaded', function() {
    // Add a class to the body to indicate that JS is active and animations can be applied.
    document.body.classList.add('js-animations-active');
    
    function initializeLightbox() {
        const lightbox = document.getElementById('lightbox');
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (!lightbox || galleryItems.length === 0) return;

        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxSize = document.getElementById('lightbox-size');
        const lightboxMaterials = document.getElementById('lightbox-materials');
        const lightboxDescription = document.getElementById('lightbox-description');
        const closeLightbox = document.querySelector('.close-lightbox');
        const inquireBtn = document.querySelector('.inquire-btn');

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                lightboxImg.src = item.dataset.img;
                lightboxImg.alt = item.dataset.title;
                lightboxTitle.textContent = item.dataset.title;
                lightboxSize.textContent = `Size: ${item.dataset.size}`;
                lightboxMaterials.textContent = `Materials: ${item.dataset.materials}`;
                lightboxDescription.textContent = item.dataset.description;
                
                lightbox.style.display = 'flex';
            });
        });

        function close() {
            lightbox.style.display = 'none';
        }

        // Close with X button
        if (closeLightbox) closeLightbox.addEventListener('click', close);
        
        // Close with ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                close();
            }
        });
        
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) close();
            });
        }

        if (inquireBtn) {
            inquireBtn.addEventListener('click', () => {
                // Get the artwork details to include in the inquiry
                const artworkTitle = lightboxTitle.textContent || 'this artwork';
                const artworkSize = lightboxSize.textContent.replace('Size: ', '') || '';
                
                // Create a pre-filled message template
                const message = `I'm interested in "${artworkTitle}" (${artworkSize}). Please provide more information about availability and pricing.`;
                
                // Store the message in localStorage to access it on the contact page
                localStorage.setItem('inquiryMessage', message);
                
                // Navigate to the contact page
                window.location.href = 'contact.html';
            });
        }
    }

    function initializeAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Function to detect system theme preference
        function getSystemThemePreference() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // Check if user has set a theme preference, otherwise use system preference
        const userPreference = localStorage.getItem('theme');
        const currentTheme = userPreference || getSystemThemePreference();
        
        // Apply the current theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Listen for system theme changes
        if (!userPreference && window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
            });
        }
        
        // Add click event to toggle theme
        themeToggle.addEventListener('click', function() {
            let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Store user preference
        });
    }
    
    // --- Page Specific Logic ---
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        // This is the Gallery page
        fetch('js/artworks.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(artwork => {
                    const item = document.createElement('div');
                    item.className = `gallery-item ${artwork.layout || ''}`;
                    item.dataset.title = artwork.title;
                    item.dataset.size = artwork.size;
                    item.dataset.materials = artwork.materials;
                    item.dataset.description = artwork.description;
                    item.dataset.img = artwork.image;

                    const unavailableDot = !artwork.available ? '<span class="unavailable-dot"></span>' : '';

                    item.innerHTML = `
                        <img src="${artwork.image}" alt="${artwork.title}">
                        <div class="gallery-item-info">
                            <h3>${artwork.title} ${unavailableDot}</h3>
                            <p>${artwork.size}</p>
                        </div>
                    `;
                    galleryGrid.appendChild(item);
                });
                initializeLightbox(); // Init lightbox after images are loaded
            })
            .catch(error => console.error('Error fetching artworks:', error));
    }

    function initializeImageOverlays() {
        // We've replaced the image overlay with responsive text content cards
        // This function remains for backwards compatibility but doesn't do anything
    }

    // --- Global Initializers ---
    initializeThemeToggle();
    initializeAnimations();
    initializeImageOverlays();
});

// Add event listener for images to ensure they're properly loaded
document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.classList.add('image-loaded');
    }
}, true);