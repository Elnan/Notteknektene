/**
 * Season Name Utilities
 * 
 * Handles sanitization and validation of season names for Firebase compatibility
 */

/**
 * Sanitize a season name to be Firebase-compatible
 * @param {string} seasonName - The original season name
 * @returns {string} - Sanitized season name safe for Firebase document IDs
 */
export const sanitizeSeasonName = (seasonName) => {
  if (!seasonName || typeof seasonName !== 'string') {
    throw new Error('Season name must be a non-empty string');
  }

  return seasonName
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();
};

/**
 * Validate if a season name is Firebase-compatible
 * @param {string} seasonName - The season name to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidSeasonName = (seasonName) => {
  if (!seasonName || typeof seasonName !== 'string') {
    return false;
  }

  // Firebase document IDs must:
  // - Be non-empty
  // - Not start with '__' (reserved)
  // - Not contain spaces or special characters except - and _
  // - Be between 1-1500 characters
  const sanitized = sanitizeSeasonName(seasonName);
  
  return (
    sanitized.length > 0 &&
    sanitized.length <= 1500 &&
    !sanitized.startsWith('__') &&
    /^[a-zA-Z0-9_-]+$/.test(sanitized)
  );
};

/**
 * Generate a unique season name if the original is invalid
 * @param {string} originalName - The original season name
 * @param {Array} existingSeasons - Array of existing season names
 * @returns {string} - A valid, unique season name
 */
export const generateValidSeasonName = (originalName, existingSeasons = []) => {
  let baseName = sanitizeSeasonName(originalName);
  
  // If sanitization resulted in empty string, use a default
  if (!baseName) {
    baseName = 'season';
  }
  
  // Check if the name is already taken
  let finalName = baseName;
  let counter = 1;
  
  while (existingSeasons.includes(finalName)) {
    finalName = `${baseName}-${counter}`;
    counter++;
  }
  
  return finalName;
};

/**
 * Get a display name for a season (reverses sanitization for UI)
 * @param {string} sanitizedName - The sanitized season name
 * @returns {string} - A more readable display name
 */
export const getDisplayName = (sanitizedName) => {
  return sanitizedName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
