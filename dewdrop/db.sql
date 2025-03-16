-- Create tables
CREATE TABLE decks (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    parent_deck_id UUID REFERENCES decks(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cards (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    deck_id UUID REFERENCES decks(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 5),
    time_taken INTEGER, -- in seconds
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_tags (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, tag_id)
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create RLS policies
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;

-- Deck policies
CREATE POLICY "Users can view their own decks"
    ON decks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
    ON decks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
    ON decks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
    ON decks FOR DELETE
    USING (auth.uid() = user_id);

-- Similar policies for other tables
-- Cards policies
CREATE POLICY "Users can view their own cards"
    ON cards FOR SELECT
    USING (auth.uid() = user_id);

-- (Add similar policies for cards, reviews, tags, and card_tags)

-- Indexes for better performance
CREATE INDEX idx_cards_next_review ON cards(next_review_date);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_reviews_card_id ON reviews(card_id);
CREATE INDEX idx_card_tags_card_id ON card_tags(card_id);