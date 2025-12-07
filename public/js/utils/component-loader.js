/**
 * Component Loader Utility
 * 헤더, 푸터 등 공통 컴포넌트를 로드하는 유틸리티
 */

/**
 * 헤더 HTML 로드
 */
export async function loadHeader() {
  const headerContainer = document.getElementById('headerContainer');
  if (!headerContainer) return;

  try {
    const response = await fetch('/components/header.html');
    const html = await response.text();
    headerContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load header:', error);
  }
}

/**
 * 푸터 HTML 로드
 */
export async function loadFooter() {
  const footerContainer = document.querySelector('footer');
  if (!footerContainer) return;

  try {
    const response = await fetch('/components/footer.html');
    const html = await response.text();
    footerContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load footer:', error);
  }
}

/**
 * 헤더와 푸터를 한번에 로드
 */
export async function loadComponents() {
  await Promise.all([
    loadHeader(),
    loadFooter()
  ]);
}
