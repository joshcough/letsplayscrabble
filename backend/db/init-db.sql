INSERT INTO players (name, division_id, stats) VALUES
    ('John Doe', 1, '{"rating": 1500, "wins": 10, "avgScore": 350}'::jsonb),
    ('Jane Smith', 1, '{"rating": 1600, "wins": 12, "avgScore": 375}'::jsonb),
    ('Bob Wilson', 1, '{"rating": 1450, "wins": 8, "avgScore": 325}'::jsonb),
    ('Alice Brown', 2, '{"rating": 1550, "wins": 15, "avgScore": 360}'::jsonb),
    ('Charlie Davis', 2, '{"rating": 1525, "wins": 11, "avgScore": 345}'::jsonb),
    ('Eva White', 3, '{"rating": 1575, "wins": 14, "avgScore": 370}'::jsonb)
ON CONFLICT DO NOTHING;