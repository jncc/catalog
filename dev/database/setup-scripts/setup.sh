#!/bin/bash
cd /setup
sudo -u postgres psql -c "CREATE DATABASE catalog;"
sudo -u postgres psql -d catalog -f database.sql
sudo -u postgres psql -d catalog -f collection.sql
sudo -u postgres psql -d catalog -f product.sql
sudo -u postgres psql -d catalog -f product_view.sql
sudo -u postgres psql -d catalog -c "CREATE USER catalog WITH ENCRYPTED PASSWORD 'catalog123';"
sudo -u postgres psql -d catalog -c "GRANT connect ON DATABASE catalog TO catalog;"
sudo -u postgres psql -d catalog -c "GRANT usage ON SCHEMA public TO catalog;"
sudo -u postgres psql -d catalog -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO catalog;"
sudo -u postgres psql -d catalog -f scot-lidar-collection-backup.sql
sudo -u postgres psql -d catalog -f scot-lidar-product-backup.sql
