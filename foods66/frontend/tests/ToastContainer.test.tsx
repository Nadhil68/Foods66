import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ToastContainer from '../components/ToastContainer';
import * as Store from '../store/useStore';

describe('ToastContainer', () => {
  it('renders nothing when there are no notifications', () => {
    vi.spyOn(Store, 'useNotificationStore').mockReturnValue({
      notifications: [],
      showNotification: vi.fn(),
      removeNotification: vi.fn()
    });

    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders notifications with correct roles and texts', () => {
    vi.spyOn(Store, 'useNotificationStore').mockReturnValue({
      notifications: [
        { id: '1', title: 'Success', message: 'Item added', type: 'success' },
        { id: '2', title: 'Error', message: 'Failed to add', type: 'error' }
      ],
      showNotification: vi.fn(),
      removeNotification: vi.fn()
    });

    render(<ToastContainer />);
    
    // Accessibility check: role="alert"
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Item added')).toBeInTheDocument();
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to add')).toBeInTheDocument();
  });

  it('calls removeNotification when close button is clicked', () => {
    const removeNotificationMock = vi.fn();
    vi.spyOn(Store, 'useNotificationStore').mockReturnValue({
      notifications: [
        { id: '1', title: 'Test', message: 'Test message', type: 'info' }
      ],
      showNotification: vi.fn(),
      removeNotification: removeNotificationMock
    });

    render(<ToastContainer />);
    
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(removeNotificationMock).toHaveBeenCalledWith('1');
  });
});
