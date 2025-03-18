-- Drop the existing foreign key constraints
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_deck_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_card_id_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE for cards
ALTER TABLE cards
ADD CONSTRAINT cards_deck_id_fkey
FOREIGN KEY (deck_id)
REFERENCES decks(id)
ON DELETE CASCADE;

-- Add the foreign key constraint with ON DELETE CASCADE for reviews
ALTER TABLE reviews
ADD CONSTRAINT reviews_card_id_fkey
FOREIGN KEY (card_id)
REFERENCES cards(id)
ON DELETE CASCADE;

-- Update the delete_deck_and_cards function
CREATE OR REPLACE FUNCTION delete_deck_and_cards(input_deck_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deck_deleted INTEGER;
BEGIN
    -- Delete the deck itself (cards and reviews will be automatically deleted due to CASCADE)
    DELETE FROM decks WHERE id = input_deck_id;
    GET DIAGNOSTICS deck_deleted = ROW_COUNT;

    -- Return true if the deck was deleted, false otherwise
    RETURN deck_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_deck_and_cards(UUID) TO authenticated;
