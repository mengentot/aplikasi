/**
 * Preload script for AI CMD Studio.
 * This runs before the renderer page loads, with full Node.js API access,
 * but in a separate context for security.
 */

window.addEventListener('DOMContentLoaded', () => {
  console.log('AI CMD Studio Desktop loaded via Electron wrapper!');
});
