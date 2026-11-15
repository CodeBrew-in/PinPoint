"""case-insensitive unique email and username, and the audit log

Revision ID: c5d8e1f20a93
Revises: a3f1c9d27b40
Create Date: 2026-11-15 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c5d8e1f20a93'
down_revision: Union[str, Sequence[str], None] = 'a3f1c9d27b40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _stop_on_duplicates(column: str) -> None:
    rows = op.get_bind().execute(
        sa.text(f"SELECT lower({column}) FROM users WHERE {column} IS NOT NULL GROUP BY lower({column}) HAVING count(*) > 1")
    ).fetchall()
    if rows:
        raise RuntimeError(
            f"Cannot make users.{column} unique ignoring case: {len(rows)} value(s) are used by more than one account. "
            "Merge or delete the extra accounts first, then run the migration again."
        )


def upgrade() -> None:
    _stop_on_duplicates("email")
    _stop_on_duplicates("username")
    # E-mails are compared in lower case everywhere, so store them that way
    op.execute("UPDATE users SET email = lower(email) WHERE email <> lower(email)")
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)
    op.create_index("uq_users_username_lower", "users", [sa.text("lower(username)")], unique=True)

    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("detail", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_events_actor_id", "audit_events", ["actor_id"])
    op.create_index("ix_audit_events_action", "audit_events", ["action"])
    op.create_index("ix_audit_events_created_at", "audit_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_events_created_at", table_name="audit_events")
    op.drop_index("ix_audit_events_action", table_name="audit_events")
    op.drop_index("ix_audit_events_actor_id", table_name="audit_events")
    op.drop_table("audit_events")
    op.drop_index("uq_users_username_lower", table_name="users")
    op.drop_index("uq_users_email_lower", table_name="users")
