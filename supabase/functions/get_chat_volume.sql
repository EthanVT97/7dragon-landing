CREATE OR REPLACE FUNCTION public.get_chat_volume(time_range text)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CASE time_range
        WHEN 'day' THEN NOW() - INTERVAL '24 hours'
        WHEN 'week' THEN NOW() - INTERVAL '7 days'
        WHEN 'month' THEN NOW() - INTERVAL '30 days'
        ELSE NOW() - INTERVAL '7 days'
      END,
      NOW(),
      CASE time_range
        WHEN 'day' THEN INTERVAL '1 hour'
        ELSE INTERVAL '1 day'
      END
    )::date as series_date
  )
  SELECT 
    d.series_date as date,
    COUNT(m.id) as count
  FROM date_series d
  LEFT JOIN chat_messages m ON DATE(m.created_at) = d.series_date
  GROUP BY d.series_date
  ORDER BY d.series_date;
END;
$$;
