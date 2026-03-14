/* SHARED UTILITIES - Eliminates code duplication across app.js and batch.js */

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitizes user input by trimming and removing dangerous characters
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, "");
}

/**
 * Displays toast notifications to users
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (info, error, success)
 */
export function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast visible";
    toast.textContent = message;
    
    if (type === "error") {
        toast.style.background = "#dc2626";
    } else if (type === "success") {
        toast.style.background = "#16a34a";
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

/**
 * Validates form inputs with comprehensive error messages
 * @param {Object} field - Field configuration
 * @param {string} value - Input value to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateField(field, value) {
    const { name, required, minLength, maxLength, pattern } = field;
    
    if (required && (!value || !value.trim())) {
        return {
            isValid: false,
            message: `Please enter ${name}`
        };
    }
    
    if (value && value.length < minLength) {
        return {
            isValid: false,
            message: `${name} must be at least ${minLength} characters`
        };
    }
    
    if (value && value.length > maxLength) {
        return {
            isValid: false,
            message: `${name} is too long (max ${maxLength} characters)`
        };
    }
    
    if (pattern && !pattern.test(value)) {
        return {
            isValid: false,
            message: `Please enter a valid ${name}`
        };
    }
    
    return { isValid: true, message: "" };
}

/**
 * Validates complete form with multiple fields
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateForm(formData) {
    const errors = [];
    
    // Validate institution
    if (formData.institution) {
        const institutionValidation = validateField(
            { name: "institution name", required: true, minLength: 2, maxLength: 100 },
            formData.institution
        );
        if (!institutionValidation.isValid) {
            errors.push(institutionValidation.message);
        }
    }
    
    // Validate year
    if (!formData.year) {
        errors.push("Please select a graduation year");
    }
    
    // Validate message
    if (formData.message) {
        const messageValidation = validateField(
            { name: "message", required: true, minLength: 1, maxLength: 500 },
            formData.message
        );
        if (!messageValidation.isValid) {
            errors.push(messageValidation.message);
        }
    }
    
    // Validate profile fields
    if (formData.profile) {
        const { city, work } = formData.profile;
        
        if (!city && !work) {
            errors.push("Please enter your city or what you're doing");
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sets focus to an element with accessibility support
 * @param {HTMLElement} element - Element to focus
 * @param {string} message - Optional message for screen readers
 */
export function setFocus(element, message = "") {
    if (!element) return;
    
    element.focus();
    
    // Announce to screen readers
    if (message) {
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "polite");
        announcement.textContent = message;
        announcement.style.position = "absolute";
        announcement.style.left = "-9999px";
        document.body.appendChild(announcement);
        
        setTimeout(() => announcement.remove(), 1000);
    }
}

/**
 * Creates a loading spinner element
 * @param {HTMLElement} container - Container to add spinner to
 * @param {string} message - Optional loading message
 */
export function showLoading(container, message = "Loading...") {
    if (!container) return;
    
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-label", "Loading");
    
    const text = document.createElement("span");
    text.textContent = message;
    text.className = "loading-text";
    
    spinner.appendChild(text);
    container.appendChild(spinner);
}

/**
 * Removes loading spinner from container
 * @param {HTMLElement} container - Container to remove spinner from
 */
export function hideLoading(container) {
    if (!container) return;
    
    const spinner = container.querySelector(".loading-spinner");
    if (spinner) {
        spinner.remove();
    }
}
