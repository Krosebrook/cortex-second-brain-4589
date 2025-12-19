-- Fix RLS policies for profiles table
-- Drop existing overly permissive policy and create specific ones
DROP POLICY IF EXISTS "Users manage/view own profile" ON public.profiles;

-- Create specific SELECT policy - users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = id);

-- Create INSERT policy
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- Create UPDATE policy
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = id);

-- Create DELETE policy
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = id);

-- Fix RLS policies for user_profiles table
-- First ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;

-- Create strict SELECT policy - users can ONLY view their own profile
CREATE POLICY "Users can view own user_profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Create UPDATE policy - users can only update their own profile
CREATE POLICY "Users can update own user_profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role and triggers to insert profiles (for handle_new_user trigger)
CREATE POLICY "System can insert user_profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Admins can view all profiles for admin functions
CREATE POLICY "Admins can view all user_profiles"
  ON public.user_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));