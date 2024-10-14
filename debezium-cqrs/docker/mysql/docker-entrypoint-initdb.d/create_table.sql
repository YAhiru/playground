CREATE TABLE `orders` (
    `id` VARCHAR(255) NOT NULL,
    `price` INT NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `order_events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `order_id` (`order_id`)
);

CREATE TABLE `consumed_order_events` (
    `id` INT NOT NULL,
    `consumed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`id`) REFERENCES `order_events` (`id`)
);
