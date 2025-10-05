-- Create Posts table
CREATE TABLE Posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Tags table
CREATE TABLE Tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Create PostTags junction table
CREATE TABLE PostTags (
  post_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);
