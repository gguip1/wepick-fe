/**
 * Simple Header Initialization Utility
 * 공용 헤더의 인증 상태를 관리합니다.
 */

import { UsersAPI } from '../api/users.js';

/**
 * Initialize header authentication state
 * @returns {Promise<void>}
 */
export async function initHeaderAuth() {
  const headerAuthLinks = document.getElementById('headerAuthLinks');
  const headerUserDropdown = document.getElementById('headerUserDropdown');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserButton = document.getElementById('headerUserButton');
  const headerDropdownMenu = document.getElementById('headerDropdownMenu');
  const headerLogoutButton = document.getElementById('headerLogoutButton');

  // Mobile elements
  const headerMobileToggle = document.getElementById('headerMobileToggle');
  const headerMobileMenu = document.getElementById('headerMobileMenu');
  const headerMobileAuthLinks = document.getElementById('headerMobileAuthLinks');
  const headerMobileUser = document.getElementById('headerMobileUser');
  const headerMobileUserName = document.getElementById('headerMobileUserName');
  const headerMobileLogoutButton = document.getElementById('headerMobileLogoutButton');

  // Setup mobile menu toggle
  setupMobileMenu();

  try {
    const response = await UsersAPI.getCurrent();

    if (response.status === 200 && response.data) {
      // User is logged in
      showLoggedInState(response.data);
    } else {
      // User is not logged in
      showLoggedOutState();
    }
  } catch (error) {
    console.error('Failed to check auth status:', error);
    showLoggedOutState();
  }

  /**
   * Show logged in state
   */
  function showLoggedInState(user) {
    // Desktop
    if (headerAuthLinks) headerAuthLinks.setAttribute('hidden', '');
    if (headerUserDropdown) headerUserDropdown.removeAttribute('hidden');
    if (headerUserName) headerUserName.textContent = user.nickname || user.email;

    // Mobile
    if (headerMobileAuthLinks) headerMobileAuthLinks.setAttribute('hidden', '');
    if (headerMobileUser) headerMobileUser.removeAttribute('hidden');
    if (headerMobileUserName) headerMobileUserName.textContent = user.nickname || user.email;

    // Setup event listeners
    setupDropdown();
    setupLogout();
  }

  /**
   * Show logged out state
   */
  function showLoggedOutState() {
    // Desktop
    if (headerAuthLinks) headerAuthLinks.removeAttribute('hidden');
    if (headerUserDropdown) headerUserDropdown.setAttribute('hidden', '');

    // Mobile
    if (headerMobileAuthLinks) headerMobileAuthLinks.removeAttribute('hidden');
    if (headerMobileUser) headerMobileUser.setAttribute('hidden', '');
  }

  /**
   * Setup dropdown menu
   */
  function setupDropdown() {
    if (!headerUserButton || !headerDropdownMenu) return;

    headerUserButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = headerDropdownMenu.hasAttribute('hidden');

      if (isHidden) {
        headerDropdownMenu.removeAttribute('hidden');
        document.addEventListener('click', closeDropdown);
      } else {
        closeDropdown();
      }
    });

    function closeDropdown() {
      if (headerDropdownMenu) {
        headerDropdownMenu.setAttribute('hidden', '');
      }
      document.removeEventListener('click', closeDropdown);
    }
  }

  /**
   * Setup logout handlers
   */
  function setupLogout() {
    const handleLogout = async (e) => {
      e.preventDefault();

      try {
        const response = await UsersAPI.signOut();

        if (response.status >= 200 && response.status < 300) {
          window.location.href = '/users/signin';
        } else {
          console.error('Logout failed:', response.error);
          alert('로그아웃에 실패했습니다.');
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    };

    if (headerLogoutButton) {
      headerLogoutButton.addEventListener('click', handleLogout);
    }

    if (headerMobileLogoutButton) {
      headerMobileLogoutButton.addEventListener('click', handleLogout);
    }
  }

  /**
   * Setup mobile menu toggle
   */
  function setupMobileMenu() {
    if (!headerMobileToggle || !headerMobileMenu) return;

    headerMobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = headerMobileMenu.hasAttribute('hidden');

      if (isHidden) {
        headerMobileMenu.removeAttribute('hidden');
        headerMobileMenu.style.display = 'block';
        document.addEventListener('click', closeMobileMenu);
      } else {
        closeMobileMenu();
      }
    });

    function closeMobileMenu() {
      if (headerMobileMenu) {
        headerMobileMenu.setAttribute('hidden', '');
        headerMobileMenu.style.display = 'none';
      }
      document.removeEventListener('click', closeMobileMenu);
    }

    // Close mobile menu on window resize to desktop size
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
          closeMobileMenu();
        }
      }, 250);
    });
  }
}
