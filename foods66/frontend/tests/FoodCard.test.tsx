import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FoodCard from '../components/FoodCard';
import * as Store from '../store/useStore';
import { FoodCategory } from '../types';

vi.mock('../store/useStore', () => ({
  useAuthStore: vi.fn(),
  useNotificationStore: vi.fn(),
  useCartStore: vi.fn()
}));
// Mock generateFoodImage to avoid network requests
vi.mock('../services/geminiService', () => ({
  generateFoodImage: vi.fn().mockResolvedValue('test-image-url')
}));

const mockFood = {
  id: 'test-1',
  name: 'Test Food',
  description: 'Test Description',
  price: 150,
  category: FoodCategory.VEG,
  image: 'test-image-url',
  isVegetarian: true,
  calories: 200,
  rating: 4.5,
  restaurantName: 'Test Rest'
};

describe('FoodCard', () => {
  const mockShowNotification = vi.fn();
  const mockUpdateQuantity = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (Store.useAuthStore as any).mockReturnValue({ user: { username: 'test', healthProfile: {} } });
    (Store.useNotificationStore as any).mockReturnValue({ showNotification: mockShowNotification });
    (Store.useCartStore as any).mockReturnValue({
      cart: [],
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart
    });
  });

  it('renders food details correctly', async () => {
    render(<FoodCard item={mockFood} onAdd={vi.fn()} />);
    
    expect(screen.getByText('Test Food')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    
    // Wait for any async updates
    await waitFor(() => {
      expect(screen.getByText('Test Food')).toBeInTheDocument();
    });
  });

  it('calls onAdd when Add to Cart button is clicked', async () => {
    const onAddMock = vi.fn();
    render(<FoodCard item={mockFood} onAdd={onAddMock} />);
    
    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(onAddMock).toHaveBeenCalled();
    });
  });

  it('displays increase and decrease controls when item is in cart', () => {
    (Store.useCartStore as any).mockReturnValue({
      cart: [{ ...mockFood, quantity: 2 }],
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart
    });

    render(<FoodCard item={mockFood} onAdd={vi.fn()} />);
    expect(screen.getAllByText(/2 in cart/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Increase Test Food quantity in cart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decrease Test Food quantity in cart/i)).toBeInTheDocument();
  });

  it('increases quantity when plus button is clicked', () => {
    (Store.useCartStore as any).mockReturnValue({
      cart: [{ ...mockFood, quantity: 2 }],
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart
    });

    render(<FoodCard item={mockFood} onAdd={vi.fn()} />);
    const plusButton = screen.getByLabelText(/Increase Test Food quantity in cart/i);
    fireEvent.click(plusButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('test-1', 3);
  });

  it('decreases quantity when minus button is clicked', () => {
    (Store.useCartStore as any).mockReturnValue({
      cart: [{ ...mockFood, quantity: 2 }],
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart
    });

    render(<FoodCard item={mockFood} onAdd={vi.fn()} />);
    const minusButton = screen.getByLabelText(/Decrease Test Food quantity in cart/i);
    fireEvent.click(minusButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('test-1', 1);
  });

  it('removes item from cart when quantity is 1 and minus button is clicked', () => {
    (Store.useCartStore as any).mockReturnValue({
      cart: [{ ...mockFood, quantity: 1 }],
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart
    });

    render(<FoodCard item={mockFood} onAdd={vi.fn()} />);
    const minusButton = screen.getByLabelText(/Decrease Test Food quantity in cart/i);
    fireEvent.click(minusButton);
    expect(mockRemoveFromCart).toHaveBeenCalledWith('test-1');
  });
});
