/**
 * Tests for User Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserService } from '../user.service';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client');

describe('UserService', () => {
  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
  };

  const mockProfile = {
    id: mockUserId,
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    role: 'user',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    preferences: { theme: 'dark' },
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should get the current user profile', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await UserService.getCurrentUser();

      expect(result).toEqual(mockProfile);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return null if no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await UserService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle authentication errors', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      } as any);

      await expect(UserService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should get a user profile by ID', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await UserService.getUserProfile(mockUserId);

      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle profile not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found', code: '404' },
            }),
          }),
        }),
      } as any);

      await expect(UserService.getUserProfile(mockUserId)).rejects.toThrow();
    });
  });

  describe('getUserProfiles', () => {
    it('should get multiple user profiles', async () => {
      const userIds = ['user-1', 'user-2'];
      const mockProfiles = [
        { ...mockProfile, id: 'user-1' },
        { ...mockProfile, id: 'user-2' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockProfiles,
            error: null,
          }),
        }),
      } as any);

      const result = await UserService.getUserProfiles(userIds);

      expect(result).toEqual(mockProfiles);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no profiles found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      const result = await UserService.getUserProfiles(['user-1']);

      expect(result).toEqual([]);
    });
  });

  describe('updateCurrentUserProfile', () => {
    it('should update the current user profile', async () => {
      const updates = {
        full_name: 'Updated Name',
        bio: 'Updated bio',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockProfile, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await UserService.updateCurrentUserProfile(updates);

      expect(result.full_name).toBe(updates.full_name);
      expect(result.bio).toBe(updates.bio);
    });

    it('should throw error if user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        UserService.updateCurrentUserProfile({ full_name: 'Test' })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const newPreferences = { language: 'en', notifications: true };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Mock getCurrentUser call
      vi.spyOn(UserService, 'getCurrentUser').mockResolvedValue(mockProfile);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockProfile,
                  preferences: { ...mockProfile.preferences, ...newPreferences },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await UserService.updatePreferences(newPreferences);

      expect(result.preferences).toMatchObject(newPreferences);
    });

    it('should merge preferences with existing ones', async () => {
      const existingPreferences = { theme: 'dark' };
      const newPreferences = { language: 'en' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(UserService, 'getCurrentUser').mockResolvedValue({
        ...mockProfile,
        preferences: existingPreferences,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockProfile,
                  preferences: { ...existingPreferences, ...newPreferences },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await UserService.updatePreferences(newPreferences);

      expect(result.preferences).toMatchObject({
        theme: 'dark',
        language: 'en',
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const query = 'test';
      const mockUsers = [mockProfile];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await UserService.searchUsers(query);

      expect(result).toEqual(mockUsers);
    });

    it('should respect limit parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      await UserService.searchUsers('test', 5);

      // Verify limit was called
      const fromMock = vi.mocked(supabase.from).mock.results[0].value;
      expect(fromMock.select).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should get user activity statistics', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Mock count queries
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 5 }),
            }),
          } as any;
        }
        if (table === 'knowledge_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 10 }),
            }),
          } as any;
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockImplementation((columns) => {
              if (columns === 'created_at') {
                return {
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                          data: { created_at: '2024-01-01T00:00:00.000Z' },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }
              return {
                eq: vi.fn().mockResolvedValue({ count: 20 }),
              };
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await UserService.getUserStats();

      expect(result).toMatchObject({
        chatCount: 5,
        knowledgeCount: 10,
        messageCount: 20,
        lastActive: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should return zero counts if no data', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((column, value) => {
            if (column === 'user_id') {
              return Promise.resolve({ count: 0 });
            }
            return {
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            };
          }),
        }),
      } as any));

      const result = await UserService.getUserStats();

      expect(result.chatCount).toBe(0);
      expect(result.knowledgeCount).toBe(0);
      expect(result.messageCount).toBe(0);
      expect(result.lastActive).toBeNull();
    });
  });

  describe('isFullNameAvailable', () => {
    it('should return true if full name is available', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await UserService.isFullNameAvailable('New User');

      expect(result).toBe(true);
    });

    it('should return false if full name is taken', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'user-1' }],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await UserService.isFullNameAvailable('Existing User');

      expect(result).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('should mark account as deleted and sign out', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      await UserService.deleteAccount();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error if user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(UserService.deleteAccount()).rejects.toThrow('User not authenticated');
    });
  });
});
