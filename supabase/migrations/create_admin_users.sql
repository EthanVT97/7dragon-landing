-- Create the admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all users"
    ON admin_users
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can insert users"
    ON admin_users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Super admins can update users"
    ON admin_users
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can delete users"
    ON admin_users
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
