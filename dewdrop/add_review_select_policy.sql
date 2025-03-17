-- Create SELECT policy for reviews
CREATE POLICY "Users can view their own reviews"
    ON reviews FOR SELECT
    USING (auth.uid() = user_id);
