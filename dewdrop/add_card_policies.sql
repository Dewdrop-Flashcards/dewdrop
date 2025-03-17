-- Create INSERT policy for cards
CREATE POLICY "Users can insert their own cards"
    ON cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for cards
CREATE POLICY "Users can update their own cards"
    ON cards FOR UPDATE
    USING (auth.uid() = user_id);

-- Create DELETE policy for cards
CREATE POLICY "Users can delete their own cards"
    ON cards FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for reviews
CREATE POLICY "Users can insert their own reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for tags
CREATE POLICY "Users can insert their own tags"
    ON tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON tags FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for card_tags
CREATE POLICY "Users can view their own card_tags"
    ON card_tags FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cards c
        WHERE c.id = card_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert card_tags for their own cards"
    ON card_tags FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cards c
        WHERE c.id = card_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own card_tags"
    ON card_tags FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM cards c
        WHERE c.id = card_id AND c.user_id = auth.uid()
    ));
