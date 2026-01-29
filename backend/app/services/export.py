from app.schemas.contracts import ExportResponse


async def export_document(document_id: str, content: str, fmt: str) -> ExportResponse:
    return ExportResponse(
        document_id=document_id,
        format=fmt,
        message="Export is stubbed. Integrate docx/pdf pipeline.",
        content_preview=content[:200],
    )
