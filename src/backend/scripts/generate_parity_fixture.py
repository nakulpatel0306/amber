"""
Generate tests/fixtures/ember-parity.json.

The fixture pairs deterministic inputs with the outputs of the Python engine and
Ember agent. pytest re-runs the Python side against it and vitest runs the
TypeScript port (src/frontend/src/lib/ember) against the same file, so any drift
between the two implementations fails one of the suites.

Run from src/backend after an intentional scoring change:
    python scripts/generate_parity_fixture.py
"""

import json
import pathlib
import random
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from agent.ember_agent import (  # noqa: E402
    determine_archetype,
    run_ember_analysis,
    run_ember_employer_analysis,
)
from engine.compatibility import (  # noqa: E402
    CULTURE_OCEAN_MAP,
    CandidateOCEAN,
    EmployerPreferences,
    RoleRequirements,
    calculate_compatibility,
)

FIXTURE = pathlib.Path(__file__).resolve().parents[3] / 'tests' / 'fixtures' / 'ember-parity.json'

TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
WORK_STYLES = ['remote', 'hybrid', 'onsite', 'flexible', None]
SIZES = ['startup', 'small', 'medium', 'large', None]
EMPLOYER_ARCHETYPES = [
    'The Innovator', 'The Optimizer', 'The Collaborator', 'The Driver',
    'The Stabilizer', 'The Visionary', 'The Nurturer', 'The Challenger', None,
]


def trait_value(rng: random.Random) -> float:
    # Mostly whole numbers, some exact halves to exercise round-half-to-even
    roll = rng.random()
    if roll < 0.15:
        return rng.randint(0, 99) + 0.5
    if roll < 0.2:
        return rng.choice([0, 20, 40, 60, 80, 100])
    return rng.randint(0, 100)


def make_candidate(rng: random.Random, i: int) -> dict:
    row = {f'{t}_score': trait_value(rng) for t in TRAITS}
    row.update({
        'id': f'cand-{i}',
        'preferred_work_style': rng.choice(WORK_STYLES),
        'preferred_company_size': rng.choice(SIZES),
        'headline': rng.choice(['Product designer', 'Backend engineer', None]),
        'bio': rng.choice(['Likes hard problems.', None]),
        'location': rng.choice(['Toronto, ON', None]),
        'profiles': {'full_name': f'Candidate {i}', 'email': f'candidate{i}@example.com'},
    })
    return row


def make_employer(rng: random.Random, i: int) -> dict:
    values = rng.sample(sorted(CULTURE_OCEAN_MAP) + ['unknown-value'], rng.randint(0, 5))
    row = {f'{t}_preference': trait_value(rng) for t in TRAITS}
    row.update({
        'id': f'emp-{i}',
        'company_name': f'Company {i}',
        'company_size': rng.choice(SIZES),
        'culture_values': [v.title() if rng.random() < 0.3 else v for v in values],
        'archetype_name': rng.choice(EMPLOYER_ARCHETYPES),
    })
    return row


def make_role(rng: random.Random, i: int):
    if rng.random() < 0.25:
        return None
    role = {'id': f'role-{i}', 'title': f'Role {i}', 'work_style': rng.choice(WORK_STYLES)}
    for t in TRAITS:
        if rng.random() < 0.5:
            low = rng.randint(0, 70)
            role[f'required_{t}_min'] = low if rng.random() < 0.8 else None
            role[f'required_{t}_max'] = low + rng.randint(10, 30) if rng.random() < 0.8 else None
    return role


def ocean(row: dict) -> CandidateOCEAN:
    return CandidateOCEAN(**{t: row[f'{t}_score'] for t in TRAITS})


def prefs(row: dict) -> EmployerPreferences:
    return EmployerPreferences(
        **{f'{t}_preference': row[f'{t}_preference'] for t in TRAITS},
        culture_values=row['culture_values'],
    )


def requirements(role):
    if role is None:
        return None
    fields = {k: v for k, v in role.items() if k.startswith('required_') or k == 'work_style'}
    return RoleRequirements(**fields)


def build() -> dict:
    rng = random.Random(20260101)
    cases = []
    for i in range(120):
        candidate = make_candidate(rng, i)
        employer = make_employer(rng, i)
        role = make_role(rng, i)
        compat = calculate_compatibility(
            ocean(candidate), prefs(employer), candidate['preferred_work_style'], requirements(role),
        )
        cases.append({
            'candidate': candidate,
            'employer': employer,
            'role': role,
            'compatibility': {
                'trait_match_score': compat.trait_match_score,
                'culture_match_score': compat.culture_match_score,
                'work_style_score': compat.work_style_score,
                'communication_score': compat.communication_score,
                'overall_match_score': compat.overall_match_score,
                'breakdown': compat.breakdown,
            },
            'analysis': run_ember_analysis(candidate, employer, role),
        })

    archetypes = []
    for _ in range(200):
        scores = {t: trait_value(rng) for t in TRAITS}
        archetypes.append({'ocean': scores, 'archetype': determine_archetype(CandidateOCEAN(**scores))})

    pool = [make_candidate(rng, 1000 + i) for i in range(12)]
    rankings = []
    for i in range(6):
        employer = make_employer(rng, 1000 + i)
        role = make_role(rng, 1000 + i)
        rankings.append({
            'employer': employer,
            'role': role,
            'candidates': pool,
            'ranking': run_ember_employer_analysis(employer, pool, role),
        })

    return {'cases': cases, 'archetypes': archetypes, 'rankings': rankings}


if __name__ == '__main__':
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(json.dumps(build(), sort_keys=True, separators=(',', ':')) + '\n')
    print(f'Wrote {FIXTURE}')
