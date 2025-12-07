/**
 * Component Loader Utility
 * 헤더, 푸터 등 공통 컴포넌트를 로드하고 초기화하는 유틸리티
 *
 * components/header.js와 components/footer.js를 사용하여
 * 일관된 방식으로 컴포넌트를 로드합니다.
 */

/**
 * 헤더와 푸터를 한번에 로드하고 초기화
 * @param {string} pageId - 페이지 고유 ID (헤더 초기화에 사용)
 */
export async function loadComponents(pageId = '') {
  const { initHeader } = await import('../components/header.js');
  const { initFooter } = await import('../components/footer.js');

  await Promise.all([
    initHeader(pageId),
    initFooter()
  ]);
}

/**
 * 헤더만 로드하고 초기화
 * @param {string} pageId - 페이지 고유 ID
 */
export async function loadHeader(pageId = '') {
  const { initHeader } = await import('../components/header.js');
  await initHeader(pageId);
}

/**
 * 푸터만 로드하고 초기화
 */
export async function loadFooter() {
  const { initFooter } = await import('../components/footer.js');
  await initFooter();
}
