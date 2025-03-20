-- Add front_label and back_label columns to the decks table
ALTER TABLE decks
ADD COLUMN front_label TEXT DEFAULT 'Question',
ADD COLUMN back_label TEXT DEFAULT 'Answer';

-- Update policy to allow these new fields to be updated
CREATE POLICY update_deck_labels ON decks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
