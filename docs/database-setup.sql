-- ViralSplit Database Setup
-- Run this in your Supabase SQL editor or PostgreSQL instance

-- Users table (shared between brands)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL CHECK (brand IN ('viralsplit', 'contentmulti')),
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    credits INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects/Videos table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_url TEXT NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    task_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transformations table
CREATE TABLE IF NOT EXISTS transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    variant_type TEXT NOT NULL DEFAULT 'standard',
    output_url TEXT,
    thumbnail_url TEXT,
    metrics JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    credits_used INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates marketplace
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_transformations_project_id ON transformations(project_id);
CREATE INDEX IF NOT EXISTS idx_transformations_platform ON transformations(platform);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_creator_id ON templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);

-- RLS (Row Level Security) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);

-- Transformations policies
CREATE POLICY "Users can view own transformations" ON transformations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = transformations.project_id AND projects.user_id = auth.uid()));

-- Usage policies
CREATE POLICY "Users can view own usage" ON usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies (public read, owner write)
CREATE POLICY "Anyone can view active templates" ON templates FOR SELECT USING (is_active = true);
CREATE POLICY "Creators can manage own templates" ON templates FOR ALL USING (auth.uid() = creator_id);