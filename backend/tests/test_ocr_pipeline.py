import pytest
from app.services.ocr.confidence_triage import triage_document
from app.models.document import UploadStatus

def test_triage_auto_accept():
    extracted = {
        "fields": {
            "owner_name": "John Doe",
            "survey_number": "123",
            "khasra_number": "456",
            "plot_area": "500",
            "village": "Test Village",
            "district": "Test Dist"
        },
        "confidences": {
            "owner_name": 0.9,
            "survey_number": 0.9,
            "khasra_number": 0.9,
            "plot_area": 0.9,
            "village": 0.9,
            "district": 0.9
        }
    }
    res = triage_document(0.95, extracted)
    assert res.status == UploadStatus.auto_accepted

def test_triage_needs_review():
    extracted = {
        "fields": {
            "owner_name": "John Doe",
            "survey_number": "123"
        },
        "confidences": {
            "owner_name": 0.6,
            "survey_number": 0.7
        }
    }
    res = triage_document(0.7, extracted)
    assert res.status == UploadStatus.needs_review
    assert len(res.missing_fields) > 0

def test_triage_rejected():
    res = triage_document(0.2, {"fields": {}, "confidences": {}})
    assert res.status == UploadStatus.rejected
