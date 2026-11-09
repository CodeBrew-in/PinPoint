from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import moderator_user
from app.api.locations import delete_files, remove_location_files
from app.db.database import get_db
from app.models.location import Location, Report
from app.models.user import User
from app.schemas.location import ReportList, ReportRead, ReportStatus, ResolveBody
from app.services.serializers import report_out

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportList)
def list_reports(
    status_filter: ReportStatus = Query("open", alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(moderator_user),
):
    reports = (
        db.query(Report).filter(Report.status == status_filter).order_by(Report.created_at.desc(), Report.id.desc()).all()
    )
    return ReportList(items=[report_out(r) for r in reports])


@router.post("/{report_id}/resolve", response_model=ReportRead)
def resolve_report(
    report_id: int,
    body: ResolveBody,
    db: Session = Depends(get_db),
    moderator: User = Depends(moderator_user),
):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.status != "open":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Report is already resolved")

    now = datetime.utcnow()
    files: list[str] = []

    if body.action == "dismiss":
        report.status = "dismissed"
        report.resolved_by_id = moderator.id
        report.resolved_at = now
    else:
        report.status = "removed"
        report.resolved_by_id = moderator.id
        report.resolved_at = now
        location = db.get(Location, report.location_id) if report.location_id else None
        if location is not None:
            # Every report about this place is settled by removing it, and none may point at a deleted row.
            for other in db.query(Report).filter(Report.location_id == location.id).all():
                if other.status == "open":
                    other.status = "removed"
                    other.resolved_by_id = moderator.id
                    other.resolved_at = now
                other.location_id = None
            files = remove_location_files(location)
            if location.map is not None:
                location.map.updated_at = now
            db.delete(location)

    db.commit()
    db.refresh(report)
    delete_files(files)
    return report_out(report)
