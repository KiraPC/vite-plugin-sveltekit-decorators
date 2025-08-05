import type { PageServerLoad } from './$types';

// Disabilita il wrapping per questo file
export const config = { decorators: false };

export const load: PageServerLoad = async () => {
  console.log('🚫 [OPT-OUT] Load function called - this should NOT be decorated (opted out)');
  
  return {
    message: 'This page has autowrap disabled'
  };
};
