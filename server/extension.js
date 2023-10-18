// Import necessary dependencies
import resolveScript from './resolve.js';

/**
 * Debug function for development
 * @param {string} text - The text to debug
 */
const debug = (text) => {
  // Uncomment this line to log text during debugging
  // console.log(text);
};

/**
 * Extension methods object
 */
const extensionMethods = {
  /**
   * Resolves a missing block given a context and blockKey
   * @param {Object} ctx - The context for the operation
   * @param {string} blockKey - The block key
   * @return {Object|undefined} - Resolved block or undefined
   */
  'resolveMissingBlock': async (ctx, blockKey) => {
    // Remove 'run.' prefix from blockKey
    blockKey = blockKey.replace('run.', '');
    const result = await resolveScript.exec(ctx, [blockKey]);
    return result?.block || undefined;
  }
};

/**
 * Macros object
 */
let macros = {
  /**
   * Execute  logic for Replicate.com components
   * @param {Object} payload - The payload for the operation
   * @param {Object} ctx - The context for the operation
   * @param {Object} component - The component being operated on
   * @return {Object} - The result of the operation
   */
  "omni-core-replicate:replicate_exec": async (payload, ctx, component) => {
    if (payload.enabled === false) {
      return {};
    }

    for (let key in payload) {
      // Remove undefined or empty string keys from the payload
      if (payload[key] === '' || payload[key] === undefined) {
        delete payload[key];
      }

      // Handle input type conversions
      if (component.inputs[key].type === 'integer') {
        payload[key] = parseInt(payload[key]);
      } else if (['number', 'float'].includes(component.inputs[key].type)) {
        payload[key] = parseFloat(payload[key]);
      }
    }

    // Deep clone the replicate property from component.custom to payload._replicate
    payload._replicate = JSON.parse(JSON.stringify(component.custom.replicate));

    return await ctx.app.api2.execute(
      `${component.name}`,
      payload,
      { responseContentType: component.data.responseContentType },
      { user: ctx.userId }
    );
  }
};

/**
 * Factory function to create components
 * @return {Object} - Components object
 */
const createComponents = () => ({
  blocks: [],
  patches: [],
  macros: macros,
});

// Default export object
export default {
  extensionMethods,
  createComponents
};
