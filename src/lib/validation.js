const sanitizeHtml = require('sanitize-html');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
function isValidObjectId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Sanitizes HTML content for todo titles
 * @param {string} content - The content to sanitize
 * @returns {string} - Sanitized content
 */
function sanitizeTodoTitle(content) {
  if (typeof content !== 'string') {
    return '';
  }
  
  return sanitizeHtml(content.trim(), {
    allowedTags: ['a'],
    allowedAttributes: {
      'a': ['href']
    }
  });
}

/**
 * Validates todo creation input
 * @param {object} body - Request body
 * @returns {object} - Validation result with success/error
 */
function validateTodoInput(body) {
  const { title: titleIn, done } = body;
  
  // Validate required fields
  if (!titleIn || typeof titleIn !== 'string') {
    return {
      success: false,
      error: 'Title is required and must be a string'
    };
  }
  
  // Validate done field if provided
  if (done !== undefined && typeof done !== 'boolean') {
    return {
      success: false,
      error: 'Done field must be a boolean'
    };
  }
  
  const title = sanitizeTodoTitle(titleIn);
  
  // Check if title is empty after sanitization
  if (!title) {
    return {
      success: false,
      error: 'Title cannot be empty after sanitization'
    };
  }
  
  return {
    success: true,
    data: {
      title,
      done: done || false
    }
  };
}

/**
 * Validates and filters update data for todos
 * @param {object} body - Request body
 * @returns {object} - Validation result with success/error
 */
function validateTodoUpdateInput(body) {
  const allowedFields = ['title', 'done'];
  const updateData = {};
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'title') {
        if (typeof body[field] !== 'string') {
          return {
            success: false,
            error: 'Title must be a string'
          };
        }
        const sanitized = sanitizeTodoTitle(body[field]);
        if (!sanitized) {
          return {
            success: false,
            error: 'Title cannot be empty after sanitization'
          };
        }
        updateData[field] = sanitized;
      } else if (field === 'done') {
        if (typeof body[field] !== 'boolean') {
          return {
            success: false,
            error: 'Done field must be a boolean'
          };
        }
        updateData[field] = body[field];
      }
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: 'No valid fields to update'
    };
  }
  
  return {
    success: true,
    data: updateData
  };
}

module.exports = {
  isValidObjectId,
  sanitizeTodoTitle,
  validateTodoInput,
  validateTodoUpdateInput
};