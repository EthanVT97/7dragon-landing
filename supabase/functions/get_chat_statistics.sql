CREATE OR REPLACE FUNCTION public.get_chat_statistics()
RETURNS TABLE (
  total_chats bigint,
  success_rate numeric,
  avg_response_time numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      AVG(EXTRACT(EPOCH FROM (response_time))) as avg_time
    FROM chat_messages
    WHERE created_at >= NOW() - INTERVAL '7 days'
  )
  SELECT 
    total as total_chats,
    ROUND((successful::numeric / NULLIF(total, 0)) * 100, 1) as success_rate,
    ROUND(avg_time::numeric, 1) as avg_response_time
  FROM stats;
END;
$$;
