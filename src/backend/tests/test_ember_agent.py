"""Unit tests for archetype classification and Ember's analysis output."""

from agent.archetype_compatibility import ARCHETYPE_MATRIX, get_archetype_modifier
from agent.ember_agent import (
    PERSONALITY_ARCHETYPES,
    classify_level,
    determine_archetype,
    run_ember_analysis,
    run_ember_employer_analysis,
)
from engine.compatibility import CandidateOCEAN


def test_classify_level_boundaries():
    assert [classify_level(s) for s in (0, 19, 20, 40, 60, 80, 100)] == [
        'low', 'low', 'low-mid', 'mid', 'mid-high', 'high', 'high',
    ]


def test_clear_profiles_land_on_expected_archetypes():
    assert determine_archetype(CandidateOCEAN(90, 30, 50, 50, 50))['key'] == 'the_innovator'
    assert determine_archetype(CandidateOCEAN(50, 50, 90, 90, 50))['key'] == 'the_connector'
    assert determine_archetype(CandidateOCEAN(90, 90, 10, 50, 50))['key'] == 'the_craftsperson'


def test_archetype_confidence_is_0_to_100():
    result = determine_archetype(CandidateOCEAN(90, 30, 50, 50, 50))
    assert result['confidence'] == 100


def test_matrix_covers_every_pair():
    assert set(ARCHETYPE_MATRIX) == set(PERSONALITY_ARCHETYPES)
    for row in ARCHETYPE_MATRIX.values():
        assert len(row) == 8
        assert all(-10 <= entry['bonus'] <= 10 for entry in row.values())


def test_unknown_employer_archetype_is_neutral():
    assert get_archetype_modifier('the_innovator', 'Nobody')['bonus'] == 0


def candidate(**scores):
    base = {f'{t}_score': 50 for t in ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']}
    base.update(scores)
    return base


def test_archetype_bonus_is_added_and_clamped():
    employer = {
        'company_name': 'Example Co', 'culture_values': ['innovation', 'creativity'],
        'openness_preference': 90, 'conscientiousness_preference': 30,
        'extraversion_preference': 50, 'agreeableness_preference': 50, 'neuroticism_preference': 50,
    }
    innovator = candidate(openness_score=90, conscientiousness_score=30)
    plain = run_ember_analysis(innovator, employer)
    boosted = run_ember_analysis(innovator, {**employer, 'archetype_name': 'The Innovator'})
    assert boosted['overall_score'] == min(100, plain['overall_score'] + 10)
    assert 0 <= boosted['overall_score'] <= 100


def test_shared_values_message_is_sorted():
    employer = {'company_name': 'Example Co', 'culture_values': ['risk', 'agility', 'innovation']}
    analysis = run_ember_analysis(candidate(openness_score=90, conscientiousness_score=30), employer)
    highlights = [i['message'] for i in analysis['insights'] if 'naturally aligns' in i['message']]
    assert highlights and highlights[0].endswith('agility, innovation, risk')


def test_employer_analysis_ranks_descending():
    employer = {'company_name': 'Example Co', 'culture_values': ['empathy'], 'agreeableness_preference': 90}
    pool = [
        {**candidate(agreeableness_score=10), 'id': 'low'},
        {**candidate(agreeableness_score=90), 'id': 'high'},
    ]
    ranking = run_ember_employer_analysis(employer, pool)
    assert [r['candidate_id'] for r in ranking] == ['high', 'low']
    assert ranking[0]['candidate_name'] == 'Unknown'
