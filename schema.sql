CREATE TABLE subscribers (
                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                             email TEXT UNIQUE NOT NULL,
                             subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                             ip_address TEXT,
                             user_agent TEXT
);

CREATE INDEX idx_email ON subscribers(email);
CREATE INDEX idx_subscribed_at ON subscribers(subscribed_at);