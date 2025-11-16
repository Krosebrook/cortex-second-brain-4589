/**
 * Example usage of EnhancedToast component
 * 
 * This file demonstrates how to use the enhanced toast system
 * with action buttons, progress bars, and undo functionality.
 */

import React, { useState } from 'react';
import { enhancedToast } from '../EnhancedToast';
import { Button } from '@/components/ui/button';

export const EnhancedToastExamples = () => {
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

  // Basic toasts
  const showSuccessToast = () => {
    enhancedToast.success('Success!', 'Your changes have been saved.');
  };

  const showErrorToast = () => {
    enhancedToast.error('Error occurred', 'Failed to save your changes.');
  };

  const showWarningToast = () => {
    enhancedToast.warning('Warning', 'This action cannot be undone.');
  };

  const showInfoToast = () => {
    enhancedToast.info('Information', 'New updates are available.');
  };

  // Toast with custom action
  const showActionToast = () => {
    enhancedToast.show({
      title: 'New message received',
      description: 'You have a new message from John Doe',
      variant: 'info',
      action: {
        label: 'View Message',
        onClick: () => {
          console.log('Navigating to message...');
        },
      },
    });
  };

  // Destructive action with undo
  const deleteItem = (index: number) => {
    const deletedItem = items[index];
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    enhancedToast.destructive(
      'Item deleted',
      `"${deletedItem}" has been removed`,
      () => {
        // Undo function
        setItems(items);
        enhancedToast.success('Restored', `"${deletedItem}" has been restored`);
      }
    );
  };

  // Progress toast
  const showProgressToast = () => {
    const progressToast = enhancedToast.progress('Uploading file...', 0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        progressToast.update(progress, `Uploading file... ${progress}%`);
      }
      if (progress >= 100) {
        clearInterval(interval);
        progressToast.success('Upload complete!');
      }
    }, 500);
  };

  // Promise toast
  const showPromiseToast = () => {
    const mockApiCall = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Data loaded') : reject(new Error('Failed to load'));
      }, 2000);
    });

    enhancedToast.promise(mockApiCall, {
      loading: 'Loading data...',
      success: 'Data loaded successfully!',
      error: (err) => `Error: ${err.message}`,
    });
  };

  // Static progress toast
  const showStaticProgress = () => {
    enhancedToast.show({
      title: 'Processing',
      description: 'Please wait while we process your request',
      variant: 'info',
      progress: 65,
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Enhanced Toast Examples</h2>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Variants</h3>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={showSuccessToast} variant="outline">
            Success Toast
          </Button>
          <Button onClick={showErrorToast} variant="outline">
            Error Toast
          </Button>
          <Button onClick={showWarningToast} variant="outline">
            Warning Toast
          </Button>
          <Button onClick={showInfoToast} variant="outline">
            Info Toast
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Interactive Toasts</h3>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={showActionToast} variant="outline">
            Toast with Action
          </Button>
          <Button onClick={showProgressToast} variant="outline">
            Progress Toast
          </Button>
          <Button onClick={showPromiseToast} variant="outline">
            Promise Toast
          </Button>
          <Button onClick={showStaticProgress} variant="outline">
            Static Progress
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Undo Functionality</h3>
        <p className="text-sm text-muted-foreground">
          Delete an item to see the undo toast
        </p>
        <div className="flex gap-2 flex-wrap">
          {items.map((item, index) => (
            <Button
              key={item}
              onClick={() => deleteItem(index)}
              variant="destructive"
              size="sm"
            >
              Delete {item}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
