import { json } from '@sveltejs/kit';

// Granular configuration: only wrap POST, skip GET
export const config = {
  decorators: {
    api: ['POST'] // Only POST HTTP method will be wrapped
  }
};

// Simulated product database
const products = [
  { id: 1, name: 'Laptop Pro', price: 1299.99, category: 'Electronics' },
  { id: 2, name: 'Coffee Mug', price: 15.99, category: 'Kitchen' },
  { id: 3, name: 'Wireless Mouse', price: 49.99, category: 'Electronics' }
];

// GET handler - will NOT be wrapped due to granular config
export async function GET({ url }) {
  console.log('🔍 [API-GET] Products API called (not decorated - excluded by config)');
  
  const category = url.searchParams.get('category');
  let filteredProducts = products;
  
  if (category) {
    filteredProducts = products.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  return json({ products: filteredProducts });
}

// POST handler - WILL be wrapped due to granular config
export async function POST({ request }) {
  console.log('📝 [API-POST] Products POST API called (will be decorated)');
  
  try {
    const productData = await request.json();
    
    if (!productData.name || !productData.price) {
      return json({ error: 'Name and price are required' }, { status: 400 });
    }
    
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newProduct = {
      id: products.length + 1,
      name: productData.name,
      price: productData.price,
      category: productData.category || 'Uncategorized'
    };
    
    products.push(newProduct);
    
    return json(newProduct, { status: 201 });
  } catch (error) {
    return json({ error: 'Invalid product data' }, { status: 400 });
  }
}
