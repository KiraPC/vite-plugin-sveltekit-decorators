import { error, json } from '@sveltejs/kit';

// Mock orders database
let orders = [
  { id: 1, userId: 1, productId: 1, quantity: 2, status: 'pending' },
  { id: 2, userId: 2, productId: 3, quantity: 1, status: 'completed' }
];

/**
 * GET /api/orders - Get all orders
 * This function will be wrapped (no configuration = all functions wrapped)
 */
export const GET = async ({ url }) => {
  const status = url.searchParams.get('status');
  
  let filteredOrders = orders;
  
  if (status) {
    filteredOrders = orders.filter(order => order.status === status);
  }
  
  return json({
    orders: filteredOrders,
    total: filteredOrders.length
  });
};

/**
 * POST /api/orders - Create a new order
 * This function will be wrapped (no configuration = all functions wrapped)
 */
export const POST = async ({ request }) => {
  const body = await request.json();
  
  // Basic validation
  if (!body.userId || !body.productId || !body.quantity) {
    throw error(400, 'userId, productId, and quantity are required');
  }
  
  const newOrder = {
    id: orders.length + 1,
    userId: parseInt(body.userId),
    productId: parseInt(body.productId),
    quantity: parseInt(body.quantity),
    status: 'pending'
  };
  
  orders.push(newOrder);
  
  return json(newOrder);
};
