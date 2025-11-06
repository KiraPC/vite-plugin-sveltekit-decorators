import { prerender } from '$app/server';

// Remote function
export const getUser = prerender(async () => {
    return {
        name: 'A test',
    }
});
