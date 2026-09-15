import pytest
from app.services.validation.business_rules import run_business_rules

def test_business_rules_pass():
    record = {
        "plot_area_sqm": 500,
        "district": "Ghaziabad",
        "tehsil": "Modinagar",
        "owner_name": "Rahul Kumar"
    }
    res = run_business_rules(record)
    assert res.passed == True
    assert len(res.errors) == 0

def test_business_rules_fail_area():
    record = {
        "plot_area_sqm": 0,
        "district": "Ghaziabad",
        "tehsil": "Modinagar",
        "owner_name": "Rahul"
    }
    res = run_business_rules(record)
    assert res.passed == False
    assert any("area" in e.lower() for e in res.errors)

def test_business_rules_fail_district():
    record = {
        "plot_area_sqm": 500,
        "district": "Mumbai",
        "tehsil": "Modinagar",
        "owner_name": "Rahul"
    }
    res = run_business_rules(record)
    assert res.passed == False
    assert any("district" in e.lower() for e in res.errors)
