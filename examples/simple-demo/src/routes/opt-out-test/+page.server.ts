// Disable wrapping for this file
export const config = { decorators: false };

export const load = async () => {
  console.log('🚫 [OPT-OUT] Load function called - this should NOT be decorated (opted out)');
  
  return {
    message: 'This page has autowrap disabled'
  };
};
