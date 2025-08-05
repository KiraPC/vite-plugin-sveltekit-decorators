// Configurazione granulare: disabilita solo le actions, mantieni load
export const config = {
  decorators: {
    load: true,     // Keep load function wrapping
    actions: ['delete']  // Enable wrapping ONLY for 'delete' action
  }
};

export const load = async () => {
  console.log('📊 [GRANULAR-LOAD] This load WILL be decorated - granular test demo');
  
  return {
    message: 'Load wrappata, actions no'
  };
};

export const actions = {
  create: async ({ request }) => {
    console.log('🚫 [GRANULAR-ACTION] This action will NOT be decorated (excluded by config)');
    const data = await request.formData();
    const name = data.get('name');
    
    return {
      success: true,
      item: { name: name?.toString() }
    };
  },
  
  delete: async ({ request }) => {
    console.log('✅ [GRANULAR-ACTION] This action WILL be decorated (included in config)');
    return { success: true };
  }
};
