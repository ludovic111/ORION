-- Run as the schema owner in the dedicated ORION database AFTER migration.
-- Create the login orion_app and its password through the institution's vault.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE orion TO orion_app;
GRANT USAGE ON SCHEMA public TO orion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, sessions, operations, memberships, records TO orion_app;
GRANT SELECT, INSERT ON audit TO orion_app;
GRANT SELECT, UPDATE ON audit_lock TO orion_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO orion_app;
-- Do not grant schema ownership, CREATE, TRUNCATE, SUPERUSER or trigger privileges.
