CREATE OR REPLACE FUNCTION public.get_satisfaction_stats(time_range text)
RETURNS TABLE (
  satisfied bigint,
  neutral bigint,
  unsatisfied bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE satisfaction_rating >= 4) as satisfied,
    COUNT(*) FILTER (WHERE satisfaction_rating = 3) as neutral,
    COUNT(*) FILTER (WHERE satisfaction_rating <= 2) as unsatisfied
  FROM chat_messages
  WHERE created_at >= 
    CASE time_range
      WHEN 'week' THEN NOW() - INTERVAL '7 days'
      WHEN 'month' THEN NOW() - INTERVAL '30 days'
      WHEN 'year' THEN NOW() - INTERVAL '365 days'
      ELSE NOW() - INTERVAL '30 days'
    END;
END;
$$;
