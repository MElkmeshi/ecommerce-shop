import { useEffect, useState } from 'react';

export type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseScriptOptions {
    shouldPreventLoad?: boolean;
    removeOnUnmount?: boolean;
}

export interface UseScriptReturn {
    status: ScriptStatus;
    error: ErrorEvent | null;
}

/**
 * Dynamically load an external script.
 *
 * @param src - The script URL to load
 * @param options - Configuration options
 * @returns Object containing loading status and error state
 */
export function useScript(
    src: string | null,
    options: UseScriptOptions = {}
): UseScriptReturn {
    const [status, setStatus] = useState<ScriptStatus>(src ? 'loading' : 'idle');
    const [error, setError] = useState<ErrorEvent | null>(null);

    useEffect(() => {
        if (!src || options.shouldPreventLoad) {
            setStatus('idle');
            return;
        }

        // Check if script is already loaded
        let script = document.querySelector<HTMLScriptElement>(
            `script[src="${src}"]`
        );

        if (script) {
            // Script already exists, check if it's loaded
            if (script.hasAttribute('data-loaded')) {
                setStatus('ready');
                return;
            }
        } else {
            // Create new script element
            script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.setAttribute('data-status', 'loading');
            document.body.appendChild(script);
        }

        // Event handlers
        const handleLoad = () => {
            script?.setAttribute('data-status', 'ready');
            script?.setAttribute('data-loaded', 'true');
            setStatus('ready');
            setError(null);
        };

        const handleError = (event: Event) => {
            script?.setAttribute('data-status', 'error');
            setStatus('error');
            setError(event as ErrorEvent);
        };

        // Attach event listeners
        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        // Cleanup
        return () => {
            if (script) {
                script.removeEventListener('load', handleLoad);
                script.removeEventListener('error', handleError);

                if (options.removeOnUnmount) {
                    script.remove();
                }
            }
        };
    }, [src, options.shouldPreventLoad, options.removeOnUnmount]);

    return { status, error };
}
