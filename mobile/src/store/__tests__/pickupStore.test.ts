import { usePickupStore } from '../pickupStore';

describe('pickupStore', () => {
  it('adds an item to the cart', () => {
    const item = { id: 'test-1', waste_type: 'plastic', source: 'barcode' as const };
    usePickupStore.getState().addToCart(item);
    
    const cart = usePickupStore.getState().cart;
    expect(cart).toContainEqual(item);
    expect(cart.length).toBe(1);
  });

  it('removes an item from the cart', () => {
    const item = { id: 'test-1', waste_type: 'plastic', source: 'barcode' as const };
    usePickupStore.getState().addToCart(item);
    usePickupStore.getState().removeFromCart('test-1');
    
    const cart = usePickupStore.getState().cart;
    expect(cart.find(i => i.id === 'test-1')).toBeUndefined();
  });

  it('clears the cart', () => {
    usePickupStore.getState().addToCart({ id: '1', waste_type: 'plastic', source: 'ai' });
    usePickupStore.getState().addToCart({ id: '2', waste_type: 'paper', source: 'barcode' });
    
    usePickupStore.getState().clearCart();
    expect(usePickupStore.getState().cart.length).toBe(0);
  });
});
