-- Add order_index to knowledge_base table
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add order_index to chats table
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Initialize order_index based on created_at for knowledge_base
UPDATE knowledge_base 
SET order_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM knowledge_base
) AS subquery
WHERE knowledge_base.id = subquery.id AND knowledge_base.order_index = 0;

-- Initialize order_index based on created_at for chats
UPDATE chats
SET order_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM chats
) AS subquery
WHERE chats.id = subquery.id AND chats.order_index = 0;