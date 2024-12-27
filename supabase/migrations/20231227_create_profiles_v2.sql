-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user'::user_role,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, role)
    VALUES (
        new.id,
        new.email,
        CASE 
            WHEN new.email LIKE '%admin%' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END
    );
    RETURN new;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user if not exists
INSERT INTO public.profiles (id, username, role)
SELECT id, email, 'admin'::user_role
FROM auth.users
WHERE email = 'your-admin-email@example.com'  -- Replace with your admin email
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role
WHERE profiles.role != 'admin'::user_role;
