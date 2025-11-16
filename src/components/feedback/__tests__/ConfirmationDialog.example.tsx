import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationProvider, useConfirmationDialog } from '../ConfirmationProvider';

const ConfirmationExamples: React.FC = () => {
  const { confirm } = useConfirmationDialog();

  const handleDeleteUser = () => {
    confirm({
      title: 'Delete User Account',
      description: 'Are you sure you want to delete this user account? This action cannot be undone and will permanently remove all user data.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('User deleted');
      },
      successMessage: {
        title: 'User Deleted',
        description: 'The user account has been permanently deleted'
      },
      errorMessage: {
        title: 'Deletion Failed',
        description: 'Failed to delete the user account'
      }
    });
  };

  const handlePublishContent = () => {
    confirm({
      title: 'Publish Content',
      description: 'Are you ready to publish this content? It will be visible to all users immediately.',
      confirmText: 'Publish Now',
      cancelText: 'Not Yet',
      variant: 'default',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Content published');
      },
      successMessage: {
        title: 'Published Successfully',
        description: 'Your content is now live'
      }
    });
  };

  const handleWarningAction = () => {
    confirm({
      title: 'Potential Data Loss',
      description: 'This action may result in data loss. Some unsaved changes might be discarded. Do you want to continue?',
      confirmText: 'Continue Anyway',
      cancelText: 'Go Back',
      variant: 'warning',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Warning action confirmed');
      },
      successMessage: {
        title: 'Action Completed',
        description: 'The action was completed successfully'
      }
    });
  };

  const handleInfoAction = () => {
    confirm({
      title: 'Enable Notifications',
      description: 'Would you like to enable push notifications to stay updated with the latest changes?',
      confirmText: 'Enable',
      cancelText: 'Maybe Later',
      variant: 'info',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Notifications enabled');
      },
      successMessage: {
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications'
      }
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Confirmation Dialog Examples</h1>
        <p className="text-muted-foreground">
          Click the buttons below to see different confirmation dialog variants with toast integration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Destructive Action</CardTitle>
            <CardDescription>
              For dangerous actions like deletions that cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDeleteUser} variant="destructive">
              Delete User Account
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Confirmation</CardTitle>
            <CardDescription>
              For standard confirmations like publishing content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePublishContent}>
              Publish Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warning Action</CardTitle>
            <CardDescription>
              For actions that require caution but aren't necessarily destructive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleWarningAction} variant="outline">
              Potentially Risky Action
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Info Action</CardTitle>
            <CardDescription>
              For informational confirmations or optional features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInfoAction} variant="secondary">
              Enable Feature
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const ConfirmationDialogExample: React.FC = () => {
  return (
    <ConfirmationProvider>
      <ConfirmationExamples />
    </ConfirmationProvider>
  );
};

export default ConfirmationDialogExample;
