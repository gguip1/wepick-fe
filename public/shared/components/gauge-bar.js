/**
 * Gauge Bar Component - Reusable VS Progress Bar
 *
 * Usage:
 * const gauge = new GaugeBar('.gauge-bar-component', {
 *   percentageA: 50,
 *   percentageB: 50,
 *   animate: true,
 *   autoUpdate: false
 * });
 *
 * // Update manually
 * gauge.update(60, 40);
 *
 * // Auto-update with random values
 * gauge.startAutoUpdate(4000); // every 4 seconds
 * gauge.stopAutoUpdate();
 */

class GaugeBar {
  constructor(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error(`GaugeBar: Container not found: ${selector}`);
      return;
    }

    this.options = {
      percentageA: options.percentageA ?? 50,
      percentageB: options.percentageB ?? 50,
      animate: options.animate !== false,
      autoUpdate: options.autoUpdate || false,
      autoUpdateInterval: options.autoUpdateInterval || 4000,
      randomRange: options.randomRange || { min: 30, max: 70 },
    };

    this.elements = {
      percentageA: this.container.querySelector('[data-option="a"]'),
      percentageB: this.container.querySelector('[data-option="b"]'),
      barFill: this.container.querySelector('[data-fill="a"]'),
    };

    this.autoUpdateTimer = null;

    this.init();
  }

  init() {
    this.update(this.options.percentageA, this.options.percentageB);

    if (this.options.autoUpdate) {
      this.startAutoUpdate();
    }
  }

  update(percentageA, percentageB) {
    if (!this.elements.percentageA || !this.elements.percentageB || !this.elements.barFill) {
      return;
    }

    // Update text
    this.elements.percentageA.textContent = `${percentageA}%`;
    this.elements.percentageB.textContent = `${percentageB}%`;

    // Update bar width
    this.elements.barFill.style.width = `${percentageA}%`;

    // Animate if enabled
    if (this.options.animate) {
      this.elements.percentageA.classList.add('animate');
      this.elements.percentageB.classList.add('animate');

      setTimeout(() => {
        this.elements.percentageA.classList.remove('animate');
        this.elements.percentageB.classList.remove('animate');
      }, 500);
    }
  }

  generateRandomPercentage() {
    const { min, max } = this.options.randomRange;
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    const complement = 100 - random;
    return { a: random, b: complement };
  }

  startAutoUpdate(interval) {
    if (interval) {
      this.options.autoUpdateInterval = interval;
    }

    // First update after 3 seconds
    setTimeout(() => {
      const { a, b } = this.generateRandomPercentage();
      this.update(a, b);

      // Then update at regular intervals
      this.autoUpdateTimer = setInterval(() => {
        const { a, b } = this.generateRandomPercentage();
        this.update(a, b);
      }, this.options.autoUpdateInterval);
    }, 3000);
  }

  stopAutoUpdate() {
    if (this.autoUpdateTimer) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
  }

  destroy() {
    this.stopAutoUpdate();
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GaugeBar;
}

// Export as ES6 module
export { GaugeBar };
