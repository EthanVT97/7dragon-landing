-- Support Staff Table
CREATE TABLE support_staff (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) CHECK (status IN ('online', 'offline', 'busy', 'away')) DEFAULT 'offline',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    languages TEXT[] DEFAULT '{my}',  -- Default to Myanmar language
    specialties TEXT[] DEFAULT '{}',
    max_concurrent_chats INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Alerts Table
CREATE TABLE support_alerts (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL,
    type VARCHAR(50) CHECK (type IN ('urgent', 'self-exclusion', 'technical', 'general')),
    status VARCHAR(20) CHECK (status IN ('pending', 'assigned', 'resolved', 'cancelled')) DEFAULT 'pending',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    assigned_to UUID REFERENCES support_staff(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Staff Activity Log
CREATE TABLE support_staff_activity (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES support_staff(id),
    action VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time Presence Function
CREATE OR REPLACE FUNCTION handle_support_staff_presence() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        
        -- Log status change
        IF OLD.status != NEW.status THEN
            INSERT INTO support_staff_activity (staff_id, action, details)
            VALUES (
                NEW.id,
                'status_change',
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Support Staff Presence
CREATE TRIGGER support_staff_presence_trigger
    BEFORE UPDATE ON support_staff
    FOR EACH ROW
    EXECUTE FUNCTION handle_support_staff_presence();

-- Indexes
CREATE INDEX idx_support_staff_status ON support_staff(status);
CREATE INDEX idx_support_alerts_status ON support_alerts(status);
CREATE INDEX idx_support_alerts_type ON support_alerts(type);
CREATE INDEX idx_support_alerts_priority ON support_alerts(priority);

-- RLS Policies
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_staff_activity ENABLE ROW LEVEL SECURITY;

-- Staff can view all staff members
CREATE POLICY "Staff can view all staff members"
    ON support_staff FOR SELECT
    USING (auth.role() = 'authenticated');

-- Staff can update their own status
CREATE POLICY "Staff can update their own status"
    ON support_staff FOR UPDATE
    USING (auth.uid() = user_id);

-- Staff can view all alerts
CREATE POLICY "Staff can view all alerts"
    ON support_alerts FOR SELECT
    USING (auth.role() = 'authenticated');

-- Staff can update assigned alerts
CREATE POLICY "Staff can update assigned alerts"
    ON support_alerts FOR UPDATE
    USING (auth.role() = 'authenticated' AND (assigned_to IS NULL OR assigned_to = (
        SELECT id FROM support_staff WHERE user_id = auth.uid()
    )));

-- Staff can view activity logs
CREATE POLICY "Staff can view activity logs"
    ON support_staff_activity FOR SELECT
    USING (auth.role() = 'authenticated');
