-- Add UPDATE and DELETE policies for messages table to complete RLS coverage
-- Users should be able to update/delete messages in their own chats

CREATE POLICY "Users can update messages in their chats" 
ON public.messages 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 
  FROM chats 
  WHERE ((chats.id = messages.chat_id) AND (chats.user_id = auth.uid()))
));

CREATE POLICY "Users can delete messages in their chats" 
ON public.messages 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 
  FROM chats 
  WHERE ((chats.id = messages.chat_id) AND (chats.user_id = auth.uid()))
));