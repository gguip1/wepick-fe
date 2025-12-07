import { initDropdown } from '/js/ui/dropdown.js';
import { loadHeader as loadHeaderComponent } from '/js/utils/component-loader.js';

async function loadHeader() {
    const placeholder = document.querySelector('[data-component="app-header"]');
    if (!placeholder) return { pageTitle: null };

    const pageTitle = placeholder.getAttribute('data-page-title') ?? null;

    try {
        await loadHeaderComponent();
    } catch (error) {
        console.error('Header load error:', error);
        return { pageTitle };
    }

    return { pageTitle };
}

function wireHeaderInteractions() {
    initDropdown('.profile-btn', '.profile-dropdown');

    const backBtn = document.querySelector('.back-btn');
    const logoutBtn = document.querySelector('.logout-btn');

    backBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        if (history.length > 1) {
            history.back();
        } else {
            window.location.href = '/posts';
        }
    });

    logoutBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/users/signin';
    });
}

function applyPageTitle(pageTitle) {
    if (!pageTitle) return;
    const heading = document.querySelector('header .title');
    if (heading) heading.textContent = pageTitle;
}

document.addEventListener('DOMContentLoaded', async () => {
    const { pageTitle } = await loadHeader();
    applyPageTitle(pageTitle);
    wireHeaderInteractions();
});
