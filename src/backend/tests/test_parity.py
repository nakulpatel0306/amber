"""Re-run the shared parity fixture so the Python engine and the TS port stay in lockstep."""

import json
import pathlib

import pytest

from agent.ember_agent import determine_archetype, run_ember_analysis, run_ember_employer_analysis
from engine.compatibility import CandidateOCEAN, calculate_compatibility
from scripts.generate_parity_fixture import FIXTURE, ocean, prefs, requirements

DATA = json.loads(FIXTURE.read_text())


def normalize(value):
    # JSON round-trip so the comparison sees exactly what the fixture stores
    return json.loads(json.dumps(value, sort_keys=True))


@pytest.mark.parametrize('case', DATA['cases'], ids=lambda c: c['candidate']['id'])
def test_compatibility_matches_fixture(case):
    result = calculate_compatibility(
        ocean(case['candidate']),
        prefs(case['employer']),
        case['candidate']['preferred_work_style'],
        requirements(case['role']),
    )
    assert normalize({
        'trait_match_score': result.trait_match_score,
        'culture_match_score': result.culture_match_score,
        'work_style_score': result.work_style_score,
        'communication_score': result.communication_score,
        'overall_match_score': result.overall_match_score,
        'breakdown': result.breakdown,
    }) == case['compatibility']


@pytest.mark.parametrize('case', DATA['cases'], ids=lambda c: c['candidate']['id'])
def test_ember_analysis_matches_fixture(case):
    analysis = run_ember_analysis(case['candidate'], case['employer'], case['role'])
    assert normalize(analysis) == case['analysis']


def test_archetypes_match_fixture():
    for entry in DATA['archetypes']:
        assert normalize(determine_archetype(CandidateOCEAN(**entry['ocean']))) == entry['archetype']


def test_employer_rankings_match_fixture():
    for entry in DATA['rankings']:
        ranking = run_ember_employer_analysis(entry['employer'], entry['candidates'], entry['role'])
        assert normalize(ranking) == entry['ranking']


def test_fixture_covers_rounding_ties():
    halves = [
        v for case in DATA['cases'] for k, v in case['candidate'].items()
        if k.endswith('_score') and isinstance(v, float) and v % 1 == 0.5
    ]
    assert len(halves) > 20
    assert pathlib.Path(FIXTURE).name == 'ember-parity.json'
