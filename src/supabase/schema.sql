-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  game_id text not null,
  status text check (status in ('active', 'closed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  game_id text not null,
  content text,
  message_type text check (message_type in ('text', 'image', 'file')) default 'text',
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table for admin users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('NEW_CUSTOMER', 'ASSISTANCE_NEEDED')),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  data jsonb not null,
  status text check (status in ('pending', 'handled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  handled_at timestamp with time zone,
  handled_by uuid references auth.users(id)
);

-- Enable RLS on admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create chatbot_responses table
CREATE TABLE IF NOT EXISTS chatbot_responses (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  keywords text[] not null,
  response text not null,
  is_active boolean default true,
  priority integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Enable RLS on chatbot_responses
ALTER TABLE chatbot_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Anyone can create a chat session"
  ON chat_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view active chat sessions"
  ON chat_sessions FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Admins can view all chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for messages
CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages in their session"
  ON messages FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.status = 'active'
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for chatbot_responses
CREATE POLICY "Anyone can read active responses"
  ON chatbot_responses FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage responses"
  ON chatbot_responses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default responses
INSERT INTO chatbot_responses (type, keywords, response, priority) VALUES
  ('greeting', ARRAY['hello', 'hi', 'hey'], '👋 Welcome to 18K Chat! I''m your virtual assistant. To get started, please provide your Game ID or Username.', 100),
  ('game_id_prompt', ARRAY['game id', 'username'], '🎮 Please enter your Game ID or Username:', 90),
  ('password_prompt', ARRAY['password'], '🔑 Please enter your Game Password:', 90),
  ('deposit', ARRAY['deposit', 'payment', 'fund', 'money', 'balance'], 'To make a deposit, please provide your payment method (Bank Transfer/E-wallet). Our admin will assist you with the process.', 80),
  ('withdraw', ARRAY['withdraw', 'cashout', 'payout'], 'For withdrawals, please provide your bank details and withdrawal amount. Our admin will process your request.', 80),
  ('games', ARRAY['game', 'play', 'slot', 'bet', 'gambling'], 'We offer various exciting games! Would you like to know about our slots, live casino, or sports betting options?', 70),
  ('help', ARRAY['help', 'support', 'assist', 'problem', 'issue'], 'I understand you need assistance. Let me connect you with our admin team.', 60),
  ('new_customer', ARRAY['new'], 'Welcome! I''ve notified our admin team about your registration. They''ll assist you shortly. In the meantime, how can I help you?', 50),
  ('unknown', ARRAY['unknown'], 'I''ve notified our admin team about your query. They''ll be with you shortly to provide expert assistance.', 0);
