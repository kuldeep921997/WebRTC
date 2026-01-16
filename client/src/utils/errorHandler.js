/**
 * STEP 8: Architecture Cleanup - Error Handling
 * 
 * Centralized error handling and user-friendly error messages
 */

/**
 * WebRTC Error Types
 */
export const ErrorTypes = {
  MEDIA_PERMISSION_DENIED: 'MEDIA_PERMISSION_DENIED',
  MEDIA_DEVICE_NOT_FOUND: 'MEDIA_DEVICE_NOT_FOUND',
  PEER_CONNECTION_FAILED: 'PEER_CONNECTION_FAILED',
  SIGNALING_ERROR: 'SIGNALING_ERROR',
  ICE_GATHERING_FAILED: 'ICE_GATHERING_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Error messages map
 */
const ERROR_MESSAGES = {
  [ErrorTypes.MEDIA_PERMISSION_DENIED]: {
    title: 'Permission Denied',
    message: 'Please allow access to your camera and microphone to continue.',
    action: 'Check browser permissions and try again.'
  },
  [ErrorTypes.MEDIA_DEVICE_NOT_FOUND]: {
    title: 'Device Not Found',
    message: 'No camera or microphone found.',
    action: 'Please connect a camera/microphone and refresh the page.'
  },
  [ErrorTypes.PEER_CONNECTION_FAILED]: {
    title: 'Connection Failed',
    message: 'Unable to establish peer connection.',
    action: 'Check your network connection and try again.'
  },
  [ErrorTypes.SIGNALING_ERROR]: {
    title: 'Signaling Error',
    message: 'Unable to communicate with signaling server.',
    action: 'Please check if the server is running and try again.'
  },
  [ErrorTypes.ICE_GATHERING_FAILED]: {
    title: 'NAT Traversal Failed',
    message: 'Unable to find a network path to the peer.',
    action: 'Your network may require a TURN server. Contact support.'
  },
  [ErrorTypes.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Network connectivity issue detected.',
    action: 'Check your internet connection and try again.'
  },
  [ErrorTypes.UNKNOWN_ERROR]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support.'
  }
};

/**
 * Parse browser error to our error type
 */
export const parseError = (error) => {
  if (!error) return ErrorTypes.UNKNOWN_ERROR;

  const errorName = error.name?.toLowerCase() || '';
  const errorMessage = error.message?.toLowerCase() || '';

  // Media errors
  if (errorName === 'notallowederror' || errorName === 'permissiondeniederror') {
    return ErrorTypes.MEDIA_PERMISSION_DENIED;
  }
  if (errorName === 'notfounderror' || errorMessage.includes('device not found')) {
    return ErrorTypes.MEDIA_DEVICE_NOT_FOUND;
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return ErrorTypes.NETWORK_ERROR;
  }

  // Signaling errors
  if (errorMessage.includes('signaling') || errorMessage.includes('socket')) {
    return ErrorTypes.SIGNALING_ERROR;
  }

  return ErrorTypes.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = typeof error === 'string' ? error : parseError(error);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorTypes.UNKNOWN_ERROR];
};

/**
 * Handle WebRTC error with logging and user notification
 */
export const handleWebRTCError = (error, context = '', onLog) => {
  console.error(`[WebRTC Error] ${context}:`, error);
  
  const errorInfo = getErrorMessage(error);
  
  if (onLog) {
    onLog(`❌ ${errorInfo.title}: ${errorInfo.message}`, 'error');
    onLog(`💡 ${errorInfo.action}`, 'info');
  }

  return errorInfo;
};

/**
 * Retry mechanism for operations
 */
export const retryOperation = async (
  operation,
  maxRetries = 3,
  delay = 1000,
  onRetry
) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        if (onRetry) {
          onRetry(i + 1, maxRetries);
        }
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Log error to external service (placeholder for production)
 */
export const logErrorToService = (error, context, user) => {
  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  console.log('[Error Logging]', {
    error: error.message,
    stack: error.stack,
    context,
    user,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};
