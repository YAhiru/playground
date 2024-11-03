CREATE TABLE `orders` (
    `id` VARCHAR(255) NOT NULL,
    `price` INT NOT NULL,
    `ordered_at` TIMESTAMP NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `aggregate_id` VARCHAR(255) NOT NULL,
    `event_name` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `sequence_number` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uidx_aggregate_id_sequence_number` (`aggregate_id`, `sequence_number`),
    KEY `aggregate_id` (`aggregate_id`)
);

CREATE TABLE `snapshots` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `aggregate_id` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `sequence_number` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uidx_aggregate_id_sequence_number` (`aggregate_id`, `sequence_number`),
    KEY `aggregate_id` (`aggregate_id`)
);

CREATE TABLE `consumed_events` (
    `id` INT NOT NULL COMMENT 'events.id',
    `consumed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`id`) REFERENCES `events` (`id`)
);
