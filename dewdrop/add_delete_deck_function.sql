-- Function to delete a deck and all its associated cards
CREATE OR REPLACE FUNCTION delete_deck_and_cards(input_deck_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    cards_deleted INTEGER;
    deck_deleted INTEGER;
BEGIN
    -- Delete all cards associated with the deck
    DELETE FROM cards WHERE deck_id = input_deck_id;
    GET DIAGNOSTICS cards_deleted = ROW_COUNT;

    -- Delete the deck itself
    DELETE FROM decks WHERE id = input_deck_id;
    GET DIAGNOSTICS deck_deleted = ROW_COUNT;

    -- Return true if the deck was deleted, false otherwise
    RETURN deck_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_deck_and_cards(UUID) TO authenticated;
