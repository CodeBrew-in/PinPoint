from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import moderator_user
from app.db.database import get_db
from app.models.location import Location, Report
from app.models.user import User
from app.schemas.location import ReportList, ReportRead, ReportStatus, ResolveBody
from app.services.removal import audit, delete_files, remove_location
from app.services.serializers import report_out

router = APIRouter(prefix="/reports", tags=["reports"])

MAX_REPORTS = 200


@router.get("", response_model=ReportList)
def list_reports(
    status_filter: ReportStatus = Query("open", alias="status"),
    limit: int = Query(100, ge=1, le=MAX_REPORTS),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(moderator_user),
):
    reports = (
        db.query(Report)
        .filter(Report.status == status_filter)
        .order_by(Report.created_at.desc(), Report.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return ReportList(items=[report_out(r) for r in reports])


@router.post("/{report_id}/resolve", response_model=ReportRead)
def resolve_report(
    report_id: int,
    body: ResolveBody,
    db: Session = Depends(get_db),
    moderator: User = Depends(moderator_user),
):
    # Lock the row, so two moderators resolving the same report at once cannot both act on it
    report = db.query(Report).filter(Report.id == report_id).with_for_update().first()
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
        audit(db, moderator, "report_dismissed", "report", report.id, report.place_name)
    else:
        report.status = "removed"
        report.resolved_by_id = moderator.id
        report.resolved_at = now
        location = db.get(Location, report.location_id) if report.location_id else None
        audit(db, moderator, "place_removed_by_moderator", "place", report.location_id, f"report {report.id}: {report.place_name}")
        if location is not None:
            # Closes every other open report about this place too
            files = remove_location(db, location, moderator, now)

    db.commit()
    db.refresh(report)
    delete_files(files)
    return report_out(report)
