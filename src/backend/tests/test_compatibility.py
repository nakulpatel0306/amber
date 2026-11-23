"""Unit tests for the OCEAN compatibility engine."""

from engine.compatibility import (
    CandidateOCEAN,
    EmployerPreferences,
    RoleRequirements,
    calculate_communication_fit,
    calculate_compatibility,
    calculate_confidence,
    calculate_overall_match,
    calculate_reverse_compatibility,
    calculate_role_fit,
    calculate_trait_match,
    calculate_work_style_score,
)


def prefs(o=50, c=50, e=50, a=50, n=50, values=None):
    return EmployerPreferences(o, c, e, a, n, values or [])


def test_identical_profiles_score_100_on_traits():
    score, breakdown = calculate_trait_match(CandidateOCEAN(70, 60, 50, 40, 30), prefs(70, 60, 50, 40, 30))
    assert score == 100
    assert set(breakdown.values()) == {100}


def test_opposite_profiles_score_0_on_traits():
    score, _ = calculate_trait_match(CandidateOCEAN(0, 0, 0, 0, 0), prefs(100, 100, 100, 100, 100))
    assert score == 0


def test_trait_match_uses_euclidean_distance():
    # One trait 50 apart: distance ratio = 50 / sqrt(5 * 100^2) = 0.2236 -> 77.6 -> 78
    score, breakdown = calculate_trait_match(CandidateOCEAN(100, 50, 50, 50, 50), prefs(50, 50, 50, 50, 50))
    assert score == 78
    assert breakdown['openness_fit'] == 50


def test_role_fit_penalises_two_points_per_unit_outside_range():
    role = RoleRequirements(required_openness_min=60, required_openness_max=80)
    fit, breakdown = calculate_role_fit(CandidateOCEAN(50, 50, 50, 50, 50), role)
    assert breakdown['openness_role_fit'] == 80
    assert fit == 96  # (80 + 4 * 100) / 5


def test_work_style_table():
    role = RoleRequirements(work_style='remote')
    assert calculate_work_style_score('remote', role) == 100
    assert calculate_work_style_score('flexible', role) == 85
    assert calculate_work_style_score('hybrid', role) == 65
    assert calculate_work_style_score('onsite', role) == 40
    assert calculate_work_style_score(None, role) == 75


def test_communication_weights_extraversion_over_agreeableness():
    candidate = CandidateOCEAN(50, 50, 30, 50, 50)
    assert calculate_communication_fit(candidate, prefs(e=50)) == 89  # 100 - 20 * 0.55
    assert calculate_communication_fit(CandidateOCEAN(50, 50, 50, 30, 50), prefs(a=50)) == 91


def test_overall_weights():
    assert calculate_overall_match(100, 0, 0, 0) == 40
    assert calculate_overall_match(0, 100, 0, 0) == 30
    assert calculate_overall_match(0, 0, 100, 0) == 20
    assert calculate_overall_match(0, 0, 0, 100) == 10


def test_negative_culture_weight_rewards_low_scores():
    calm = calculate_compatibility(CandidateOCEAN(50, 50, 50, 50, 10), prefs(values=['balance']))
    anxious = calculate_compatibility(CandidateOCEAN(50, 50, 50, 50, 90), prefs(values=['balance']))
    assert calm.breakdown['values_alignment'] > anxious.breakdown['values_alignment']


def test_unknown_culture_values_are_ignored():
    result = calculate_compatibility(CandidateOCEAN(50, 50, 50, 50, 50), prefs(values=['vibes']))
    assert 'values_alignment' not in result.breakdown


def test_confidence_counts_completed_parts():
    full = {f'{t}_score': 50 for t in ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']}
    assert calculate_confidence(full) == 40
    assert calculate_confidence({**full, 'headline': 'x', 'bio': 'y', 'location': 'z'}) == 70


def test_reverse_compatibility_defaults_to_neutral():
    assert calculate_reverse_compatibility(prefs(), {}) == 65
    data = {'preferred_work_style': 'remote', '_employer_work_style': 'remote'}
    assert calculate_reverse_compatibility(prefs(), data) == 100
