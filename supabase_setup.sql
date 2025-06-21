-- Create social_media_posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    platform VARCHAR(50) DEFAULT 'Twitter',
    user_id VARCHAR(100) NOT NULL,
    likes INTEGER DEFAULT 0,
    retweets INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(100) DEFAULT 'User Generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_media_disaster_id ON social_media_posts(disaster_id);
CREATE INDEX IF NOT EXISTS idx_social_media_timestamp ON social_media_posts(timestamp DESC);
-- Enable RLS (Row Level Security)
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
-- Create policy for reading posts (public)
CREATE POLICY "Allow public read access to social media posts" ON social_media_posts FOR
SELECT USING (true);
-- Create policy for inserting posts (authenticated users)
CREATE POLICY "Allow authenticated users to create posts" ON social_media_posts FOR
INSERT WITH CHECK (true);
-- Create policy for updating own posts
CREATE POLICY "Allow users to update own posts" ON social_media_posts FOR
UPDATE USING (user_id = current_user);