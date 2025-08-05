import type { Actions, PageServerLoad } from './$types';

// Dati mock semplici
const items = [
  { id: 1, name: 'Item 1', completed: false },
  { id: 2, name: 'Item 2', completed: true },
  { id: 3, name: 'Item 3', completed: false }
];

// Load function - will be automatically wrapped by the plugin
export const load: PageServerLoad = async ({ url }) => {
  // Simulate a small delay to better see the logs
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('� [SERVER-PAGE] Loading page data...');
  
  return {
    items,
    timestamp: new Date().toISOString(),
    url: url.pathname
  };
};

// Actions - will be automatically wrapped by the plugin
export const actions: Actions = {
  toggle: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    
    console.log(`🔄 [ACTION-TOGGLE] Toggling item ${id}`);
    
    // Simula operazione
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const item = items.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
    }
    
    return { success: true, id };
  },

  add: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    
    console.log(`➕ [ACTION-ADD] Adding new item: ${name}`);
    
    if (!name) {
      return { success: false, error: 'Nome richiesto' };
    }
    
    // Simula operazione
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const newItem = {
      id: Math.max(...items.map(i => i.id)) + 1,
      name,
      completed: false
    };
    
    items.push(newItem);
    
    return { success: true, item: newItem };
  }
};
