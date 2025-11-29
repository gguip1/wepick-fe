/**
 * WePick Landing Page - Gauge Animation
 */

(function () {
  // Gauge Bar 초기화
  const gauge = new GaugeBar('.gauge-bar-component', {
    percentageA: 50,
    percentageB: 50,
    animate: true,
    autoUpdate: true,
    autoUpdateInterval: 4000,
    randomRange: { min: 30, max: 70 },
  });

  // 페이지를 벗어날 때 정리
  window.addEventListener('beforeunload', () => {
    gauge.destroy();
  });
})();
