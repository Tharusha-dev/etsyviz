-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    storeaccess BOOLEAN,
    prodandstoreaccess BOOLEAN,
    is_admin BOOLEAN,
    prodaccess BOOLEAN,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    file_type VARCHAR(50) NOT NULL,  -- 'products', 'stores', 'categories'
    rows_processed INTEGER NOT NULL,
    time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,     -- 'success', 'failed', 'partial'
    error_message TEXT
);
-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    product_id TEXT,
    search_url TEXT,
    category_tree TEXT,
    product_url TEXT,
    product_name TEXT,
    is_ad BOOLEAN,
    star_seller BOOLEAN,
    store_reviews_number INTEGER,
    store_reviews_score INTEGER,
    store_name TEXT,
    store_url TEXT,
    time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    store_id TEXT,
    store_name TEXT,
    store_url TEXT,
    store_sub_title TEXT,
    welcome_to_our_shop_text TEXT,
    store_logo_url TEXT,
    store_description TEXT,
    most_recent_product_urls TEXT[],
    store_country VARCHAR(100),
    star_seller BOOLEAN,
    store_last_updated TIMESTAMP,
    store_reviews INTEGER,
    store_review_score INTEGER,
    on_etsy_since DATE,
    store_sales INTEGER,
    store_admirers INTEGER,
    number_of_store_products INTEGER,
    looking_for_more_urls TEXT[],
    facebook_url TEXT,
    instagram_url TEXT,
    pinterest_url TEXT,
    tiktok_url TEXT,
    time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    time_scraped TIMESTAMP,
    cid TEXT,
    pjson JSONB,
    productJ JSONB,
    breadcrumbJ JSONB,
    category_name TEXT,
    category_tree TEXT,
    category_url TEXT,
    product_url TEXT,
    product_id TEXT,
    product_id_new TEXT,
    product_title TEXT,
    brand TEXT,
    image TEXT,
    last_24_hours INT,
    number_in_basket INTEGER,
    product_reviews INTEGER,
    rating_value NUMERIC(3, 2),
    date_of_latest_review DATE,
    date_listed DATE,
    number_of_favourties INTEGER,
    related_searches JSONB,
    star_seller BOOLEAN,
    ad BOOLEAN,
    digital_download BOOLEAN,
    price_usd NUMERIC(10, 2),
    sale_price_usd NUMERIC(10, 2),
    store_reviews INTEGER,
    store_name TEXT,
    store_url TEXT,
    store_country TEXT,
    on_etsy_since DATE,
    store_sales INTEGER,
    store_admirers INTEGER,
    number_of_store_products INTEGER,
    facebook_url TEXT,
    instagram_url TEXT,
    pinterest_url TEXT,
    tiktok_url TEXT,
    time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Categories Hierarchy Table
CREATE TABLE IF NOT EXISTS category_hierarchy (
    id SERIAL PRIMARY KEY,
    category_name TEXT NOT NULL,
    parent_id INTEGER REFERENCES category_hierarchy(id),
    level INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_name, parent_id)
);
