# Enhanced Feedback System

This directory contains components and hooks for providing user feedback through toasts and confirmation dialogs.

## EnhancedToast

A powerful toast notification system with support for actions, progress bars, and undo functionality.

### Usage

```typescript
import { enhancedToast } from '@/components/feedback/EnhancedToast';

// Simple success toast
enhancedToast.success('Success!', 'Your changes have been saved');

// Error toast
enhancedToast.error('Error', 'Failed to save changes');

// Warning toast
enhancedToast.warning('Warning', 'This action requires confirmation');

// Info toast
enhancedToast.info('Info', 'Your subscription expires in 7 days');

// Toast with custom actions
enhancedToast.show({
  variant: 'info',
  title: 'Update Available',
  description: 'A new version is available',
  actions: [
    { label: 'Update Now', onClick: () => updateApp() },
    { label: 'Remind Later', onClick: () => remindLater() }
  ]
});

// Progress toast
const progress = enhancedToast.progress('Uploading files...', 0);
// Update progress
progress.update(50);
// Complete
progress.complete('Upload complete!');
// Or handle error
progress.error('Upload failed');

// Promise toast
enhancedToast.promise(
  fetchData(),
  {
    loading: 'Loading data...',
    success: 'Data loaded successfully',
    error: 'Failed to load data'
  }
);

// Destructive action with undo
enhancedToast.destructive(
  'Item Deleted',
  'The item has been deleted',
  () => {
    // Undo action
    restoreItem();
    enhancedToast.success('Restored', 'Item has been restored');
  }
);
```

## Confirmation Dialog System

A confirmation dialog system that integrates seamlessly with enhanced toasts for critical actions.

### Usage

```typescript
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';

function MyComponent() {
  const { confirm } = useConfirmationDialog();

  const handleDelete = () => {
    confirm({
      title: 'Delete Item',
      description: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        await deleteItem();
      },
      successMessage: {
        title: 'Deleted',
        description: 'The item has been deleted successfully'
      },
      errorMessage: {
        title: 'Error',
        description: 'Failed to delete the item'
      }
    });
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### Variants

- `default`: Standard confirmation
- `destructive`: For dangerous actions (deletions, etc.)
- `warning`: For actions requiring caution
- `info`: For informational confirmations

### Integration with Hooks

The confirmation dialog system can be easily integrated into your hooks:

```typescript
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';

export const useMyFeature = () => {
  const { confirm } = useConfirmationDialog();

  const deleteItem = (id: string, title: string) => {
    confirm({
      title: 'Delete Item',
      description: `Are you sure you want to delete "${title}"?`,
      variant: 'destructive',
      onConfirm: async () => {
        await api.delete(id);
      },
      successMessage: {
        title: 'Deleted',
        description: 'Item deleted successfully'
      }
    });
  };

  return { deleteItem };
};
```

## Best Practices

### When to Use Toasts vs Confirmations

**Use Toasts for:**
- Non-blocking feedback
- Success/error messages
- Progress updates
- Undo actions for immediate reversible operations

**Use Confirmation Dialogs for:**
- Critical actions requiring explicit user consent
- Destructive operations (deletions)
- Actions with significant consequences
- Operations that need user attention before proceeding

### Toast Guidelines

1. **Keep messages concise**: Titles under 5 words, descriptions under 20 words
2. **Use appropriate variants**: Match the severity to the situation
3. **Provide actions when relevant**: Let users act on the information
4. **Auto-dismiss non-critical toasts**: Use default duration for info/success
5. **Keep critical toasts persistent**: Set `duration: Infinity` for errors requiring action

### Confirmation Dialog Guidelines

1. **Clear titles**: Describe the action being confirmed
2. **Detailed descriptions**: Explain consequences clearly
3. **Appropriate variants**: Use `destructive` for irreversible actions
4. **Action buttons**: Label buttons with specific actions ("Delete Account" vs "Confirm")
5. **Success feedback**: Always provide toast feedback after confirmation

## Examples

See the example files:
- `EnhancedToast.example.tsx` - Toast system examples
- `ConfirmationDialog.example.tsx` - Confirmation dialog examples
