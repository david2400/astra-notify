import { ServerApiError } from '@/server/lib/types';
import { ActionResult } from '@/server/lib/types/action.type';

export function handleError(error: unknown): ActionResult<never> {
    // Handle ServerApiError specifically
    if (error instanceof ServerApiError) {
        // The message is already properly extracted by handleResponse
        // Just return it in the ActionResult format
        return { 
            success: false, 
            error: error.message, 
            status: error.status 
        };
    }
    
    // Handle generic Error objects
    if (error instanceof Error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
    
    // Handle unknown error types
    const message = typeof error === 'string' ? error : 'Error inesperado';
    return { 
        success: false, 
        error: message 
    };
}
