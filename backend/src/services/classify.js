// Contact classification for the A/1 Suppliers CRM.
// Maps a raw intake submission to one of the canonical CONTACT TYPES.
// YEP (ages 7-17) always leads; Y-A.E.P. (18-24) is the secondary lane.

export const CONTACT_TYPES = {
  YOUTH: 'Youth 7-17',
  PARENT: 'Parent/Guardian',
  YOUNG_ADULT: 'Young Adult 18-24',
  MENTOR: 'Mentor',
  VOLUNTEER: 'Volunteer',
  SPONSOR: 'Sponsor',
  PARTNER: 'Partner',
  GENERAL: 'General Contact',
};

const CANONICAL = new Set(Object.values(CONTACT_TYPES));

// Loose aliases an intake form might submit -> canonical category.
const ALIASES = {
  youth: CONTACT_TYPES.YOUTH,
  'youth 7-17': CONTACT_TYPES.YOUTH,
  yep: CONTACT_TYPES.YOUTH,
  student: CONTACT_TYPES.YOUTH,
  child: CONTACT_TYPES.YOUTH,
  parent: CONTACT_TYPES.PARENT,
  guardian: CONTACT_TYPES.PARENT,
  'parent/guardian': CONTACT_TYPES.PARENT,
  'young adult': CONTACT_TYPES.YOUNG_ADULT,
  'young adult 18-24': CONTACT_TYPES.YOUNG_ADULT,
  'y-a.e.p.': CONTACT_TYPES.YOUNG_ADULT,
  yaep: CONTACT_TYPES.YOUNG_ADULT,
  mentor: CONTACT_TYPES.MENTOR,
  coach: CONTACT_TYPES.MENTOR,
  volunteer: CONTACT_TYPES.VOLUNTEER,
  sponsor: CONTACT_TYPES.SPONSOR,
  donor: CONTACT_TYPES.SPONSOR,
  partner: CONTACT_TYPES.PARTNER,
  business: CONTACT_TYPES.PARTNER,
  organization: CONTACT_TYPES.PARTNER,
  general: CONTACT_TYPES.GENERAL,
  'general contact': CONTACT_TYPES.GENERAL,
  contact: CONTACT_TYPES.GENERAL,
};

// Human-readable age band stored alongside the category.
export function ageGroupFor(age) {
  if (age === null || age === undefined || Number.isNaN(age)) return '';
  if (age >= 7 && age <= 17) return 'YEP (7-17)';
  if (age >= 18 && age <= 24) return 'Y-A.E.P. (18-24)';
  if (age >= 25) return 'Adult (25+)';
  return 'Under 7';
}

function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const v = raw.trim();
  if (CANONICAL.has(v)) return v;
  const alias = ALIASES[v.toLowerCase()];
  return alias || null;
}

// classifyContact(): determine the canonical contact type for a submission.
// Priority: explicit valid category -> role/interest alias -> age-based -> General.
export function classifyContact(input = {}) {
  const explicit = normalizeCategory(input.category);
  if (explicit) return explicit;

  const fromRole = normalizeCategory(input.role) || normalizeCategory(input.interest);
  if (fromRole) return fromRole;

  const age = Number.parseInt(input.age, 10);
  if (!Number.isNaN(age)) {
    if (age >= 7 && age <= 17) return CONTACT_TYPES.YOUTH;
    if (age >= 18 && age <= 24) return CONTACT_TYPES.YOUNG_ADULT;
  }

  return CONTACT_TYPES.GENERAL;
}
