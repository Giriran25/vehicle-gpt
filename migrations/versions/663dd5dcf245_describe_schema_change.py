"""Preserve the corrected schema from the initial migration."""

revision = "663dd5dcf245"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    # 0001 already contains the corrected schema. Keep this historical
    # revision safe for fresh PostgreSQL databases and existing databases at 0001.
    pass


def downgrade():
    pass
