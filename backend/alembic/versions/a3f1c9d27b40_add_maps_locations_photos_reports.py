"""add maps, locations, photos, notes and reports (contract v2)

Revision ID: a3f1c9d27b40
Revises: 74cca7508396
Create Date: 2026-11-02 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1c9d27b40'
down_revision: Union[str, Sequence[str], None] = '74cca7508396'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # users: profile fields
    op.add_column('users', sa.Column('username', sa.String(length=30), nullable=True))
    op.add_column('users', sa.Column('name', sa.String(length=60), nullable=True))
    op.add_column('users', sa.Column('bio', sa.String(length=180), server_default='', nullable=False))
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)

    op.create_table('maps',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=72), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=False),
    sa.Column('category', sa.String(length=40), nullable=False),
    sa.Column('visibility', sa.String(length=10), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maps_id'), 'maps', ['id'], unique=False)
    op.create_index(op.f('ix_maps_owner_id'), 'maps', ['owner_id'], unique=False)
    op.create_index(op.f('ix_maps_visibility'), 'maps', ['visibility'], unique=False)

    op.create_table('map_shares',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('map_id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.ForeignKeyConstraint(['map_id'], ['maps.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('map_id', 'email', name='uq_map_shares_map_email')
    )
    op.create_index(op.f('ix_map_shares_email'), 'map_shares', ['email'], unique=False)
    op.create_index(op.f('ix_map_shares_map_id'), 'map_shares', ['map_id'], unique=False)

    op.create_table('locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('map_id', sa.Integer(), nullable=True),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('description', sa.String(length=2000), nullable=False),
    sa.Column('lat', sa.Float(), nullable=False),
    sa.Column('lng', sa.Float(), nullable=False),
    sa.Column('visibility', sa.String(length=10), nullable=False),
    sa.Column('tags', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('verified_at', sa.DateTime(), nullable=True),
    sa.Column('verified_by_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['map_id'], ['maps.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['verified_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_locations_id'), 'locations', ['id'], unique=False)
    op.create_index(op.f('ix_locations_map_id'), 'locations', ['map_id'], unique=False)
    op.create_index(op.f('ix_locations_owner_id'), 'locations', ['owner_id'], unique=False)
    op.create_index(op.f('ix_locations_visibility'), 'locations', ['visibility'], unique=False)
    op.create_index('ix_locations_lat_lng', 'locations', ['lat', 'lng'], unique=False)

    op.create_table('photos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('location_id', sa.Integer(), nullable=False),
    sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
    sa.Column('filename', sa.String(length=64), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_photos_location_id'), 'photos', ['location_id'], unique=False)

    op.create_table('location_notes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('location_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('text', sa.String(length=500), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_location_notes_location_id'), 'location_notes', ['location_id'], unique=False)

    op.create_table('reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('location_id', sa.Integer(), nullable=True),
    sa.Column('place_name', sa.String(length=120), nullable=False),
    sa.Column('map_title', sa.String(length=72), nullable=True),
    sa.Column('kind', sa.String(length=30), nullable=False),
    sa.Column('note', sa.String(length=500), nullable=False),
    sa.Column('reporter_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=12), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('resolved_by_id', sa.Integer(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_location_id'), 'reports', ['location_id'], unique=False)
    op.create_index(op.f('ix_reports_status'), 'reports', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_reports_status'), table_name='reports')
    op.drop_index(op.f('ix_reports_location_id'), table_name='reports')
    op.drop_table('reports')
    op.drop_index(op.f('ix_location_notes_location_id'), table_name='location_notes')
    op.drop_table('location_notes')
    op.drop_index(op.f('ix_photos_location_id'), table_name='photos')
    op.drop_table('photos')
    op.drop_index('ix_locations_lat_lng', table_name='locations')
    op.drop_index(op.f('ix_locations_visibility'), table_name='locations')
    op.drop_index(op.f('ix_locations_owner_id'), table_name='locations')
    op.drop_index(op.f('ix_locations_map_id'), table_name='locations')
    op.drop_index(op.f('ix_locations_id'), table_name='locations')
    op.drop_table('locations')
    op.drop_index(op.f('ix_map_shares_map_id'), table_name='map_shares')
    op.drop_index(op.f('ix_map_shares_email'), table_name='map_shares')
    op.drop_table('map_shares')
    op.drop_index(op.f('ix_maps_visibility'), table_name='maps')
    op.drop_index(op.f('ix_maps_owner_id'), table_name='maps')
    op.drop_index(op.f('ix_maps_id'), table_name='maps')
    op.drop_table('maps')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'name')
    op.drop_column('users', 'username')
