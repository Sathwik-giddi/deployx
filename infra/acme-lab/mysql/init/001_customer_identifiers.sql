USE acme_lab;

CREATE TABLE customer_master (
    CID BIGINT UNSIGNED NOT NULL,
    email_address VARCHAR(320),
    full_name VARCHAR(180),
    state_code CHAR(2),
    phone VARCHAR(40),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (CID),
    KEY idx_customer_master_email (email_address)
) ENGINE=InnoDB;

CREATE TABLE canonical_customer (
    customer_id CHAR(36) NOT NULL,
    email TEXT,
    name JSON,
    status VARCHAR(32),
    metadata JSON,
    phone VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id)
) ENGINE=InnoDB;
