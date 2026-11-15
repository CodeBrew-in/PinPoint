"""photos can live in the database: data, content_type, size_bytes

Revision ID: e1f4a7b8c9d2
Revises: c5d8e1f20a93
Create Date: 2026-11-16 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e1f4a7b8c9d2'
down_revision: Union[str, Sequence[str], None] = 'c5d8e1f20a93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("photos", sa.Column("data", sa.LargeBinary(), nullable=True))
    op.add_column("photos", sa.Column("content_type", sa.String(length=30), nullable=True))
    op.add_column("photos", sa.Column("size_bytes", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("photos", "size_bytes")
    op.drop_column("photos", "content_type")
    op.drop_column("photos", "data")
