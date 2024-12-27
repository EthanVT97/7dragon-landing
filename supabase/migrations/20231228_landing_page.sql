-- Create landing_page_content table
CREATE TABLE landing_page_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    priority INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial sections
INSERT INTO landing_page_content (section, content_type, title, description, priority, status) VALUES
('marketing', 'banner', '7Dragon Casino', 'Experience the thrill of online gaming', 1, 'active'),
('promotion', 'bonus', 'Welcome Bonus', 'Get 100% bonus on your first deposit', 1, 'active'),
('games', 'featured', 'Popular Games', 'Check out our most played games', 1, 'active');

-- Create RLS policies
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON landing_page_content
FOR SELECT
TO PUBLIC
USING (status = 'active');

CREATE POLICY "Allow admin full access"
ON landing_page_content
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_landing_page_content_updated_at
    BEFORE UPDATE ON landing_page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
