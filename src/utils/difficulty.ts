import { Subject, AcademicLevel } from '../types';

export type DifficultyCategory = 
  | 'High Output Low Input' 
  | 'High Output High Input' 
  | 'Low Output Low Input' 
  | 'Low Output High Input';

/**
 * Helper to normalize string keys so slight spelling variations don't break the categorizations.
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace('elements', '')
    .trim();
}

const CATEGORY_MAPS: Record<string, DifficultyCategory> = {};

// Register a helper to populate normalized entries
function register(chapterName: string, category: DifficultyCategory) {
  const norm = normalizeString(chapterName);
  CATEGORY_MAPS[norm] = category;
}

// ==========================================
// CLASS 11 PHYSICS
// ==========================================
register('Units and Measurements', 'High Output Low Input');
register('Gravitation', 'High Output Low Input');
register('Mechanical Properties of Fluids', 'High Output Low Input');
register('Thermal Properties of Matter', 'High Output Low Input');
register('Kinetic Theory', 'High Output Low Input');

register('Laws of Motion', 'High Output High Input');
register('Work Energy and Power', 'High Output High Input');
register('Work, Energy and Power', 'High Output High Input');
register('System of Particles and Rotational Motion', 'High Output High Input');
register('Thermodynamics', 'High Output High Input'); // Note: Physics thermodynamics
register('Waves', 'High Output High Input');
register('Oscillations', 'High Output High Input');

register('Motion in a Straight Line', 'Low Output Low Input');

register('Motion in a Plane', 'Low Output High Input');
register('Mechanical Properties of Solids', 'Low Output High Input');


// ==========================================
// CLASS 12 PHYSICS
// ==========================================
register('Semiconductors', 'High Output Low Input');
register('Electromagnetic Waves', 'High Output Low Input');
register('Dual Nature', 'High Output Low Input');
register('Atomic Physics', 'High Output Low Input');

register('Electrostatics', 'High Output High Input');
register('Capacitance', 'High Output High Input');
register('Current Electricity', 'High Output High Input');
register('Magnetism and Current', 'High Output High Input');
register('EMI', 'High Output High Input');
register('Ray Optics', 'High Output High Input');
register('Wave Optics', 'High Output High Input');

register('Nuclear Physics', 'Low Output Low Input');

register('AC Circuits', 'Low Output High Input');
register('Magnetic Properties', 'Low Output High Input');


// ==========================================
// CLASS 11 CHEMISTRY
// ==========================================
register('Classification of Elements and Periodicity', 'High Output Low Input');
register('Redox Reactions', 'High Output Low Input');
register('Structure of Atom', 'High Output Low Input');

register('Chemical Bonding', 'High Output High Input');
register('Chemical Bonding and Molecular Structure', 'High Output High Input');
register('Chemical Thermodynamics', 'High Output High Input');
register('Thermodynamics', 'High Output High Input'); // Safe fallback
register('Equilibrium', 'High Output High Input');
register('Organic Chemistry Basics', 'High Output High Input');
register('Organic Chemistry', 'High Output High Input');
register('Hydrocarbons', 'High Output High Input');

register('Some Basic Concepts of Chemistry', 'Low Output Low Input');


// ==========================================
// CLASS 12 CHEMISTRY
// ==========================================
register('Surface Chemistry', 'High Output Low Input');
register('Biomolecules', 'High Output Low Input');
register('Amines', 'High Output Low Input');
register('d and f Block Elements', 'High Output Low Input');
register('df Block Elements', 'High Output Low Input');
register('df Block', 'High Output Low Input');
register('d and f Block', 'High Output Low Input');
register('Metallurgy', 'High Output Low Input');

register('Solutions', 'High Output High Input');
register('Electrochemistry', 'High Output High Input');
register('Chemical Kinetics', 'High Output High Input');
register('Coordination Compounds', 'High Output High Input');
register('Haloalkanes and Haloarenes', 'High Output High Input');
register('Alcohols Phenols and Ethers', 'High Output High Input');
register('Aldehydes and Ketones', 'High Output High Input');
register('Carboxylic Acids', 'High Output High Input');

register('p Block Elements', 'Low Output Low Input');
register('p Block', 'Low Output Low Input');


// ==========================================
// CLASS 11 MATHEMATICS
// ==========================================
register('Sets', 'High Output Low Input');
register('Relations and Functions', 'High Output Low Input');
register('Statistics', 'High Output Low Input');
register('Probability', 'High Output Low Input'); // Both 11th and 12th may have probability

register('Trigonometric Functions', 'High Output High Input');
register('Complex Numbers', 'High Output High Input');
register('Permutations and Combinations', 'High Output High Input');
register('Binomial Theorem', 'High Output High Input');
register('Sequences and Series', 'High Output High Input');
register('Conic Sections', 'High Output High Input');
register('Limits and Derivatives', 'High Output High Input');

register('Linear Inequalities', 'Low Output Low Input');

register('Straight Lines', 'Low Output High Input');
register('3D Geometry Introduction', 'Low Output High Input');
register('Introduction to 3D Geometry', 'Low Output High Input');


// ==========================================
// CLASS 12 MATHEMATICS
// ==========================================
register('Matrices', 'High Output Low Input');
register('Determinants', 'High Output Low Input');
register('Linear Programming', 'High Output Low Input');

register('Differentiation', 'High Output High Input');
register('Applications of Derivatives', 'High Output High Input');
register('Indefinite Integration', 'High Output High Input');
register('Definite Integration', 'High Output High Input');
register('Area Under Curves', 'High Output High Input');
register('Differential Equations', 'High Output High Input');
register('Vector Algebra', 'High Output High Input');
register('Three Dimensional Geometry', 'High Output High Input');
register('Continuity and Differentiability', 'High Output High Input');

register('Sets and Relations', 'Low Output Low Input');

register('Inverse Trigonometric Functions', 'Low Output High Input');


// ==========================================
// CLASS 11 BOTANY (NEET)
// ==========================================
register('Living World', 'High Output Low Input');
register('Biological Classification', 'High Output Low Input');
register('Biodiversity', 'High Output Low Input');
register('Biomolecules', 'High Output Low Input');

register('Cell Unit of Life', 'High Output High Input');
register('Cell Cycle and Division', 'High Output High Input');
register('Photosynthesis', 'High Output High Input');
register('Plant Growth and Development', 'High Output High Input');

register('Plant Respiration', 'Low Output Low Input');

register('Plant Kingdom', 'Low Output High Input');
register('Morphology of Plants', 'Low Output High Input');
register('Anatomy of Plants', 'Low Output High Input');
register('Reproduction in Plants', 'Low Output High Input');


// ==========================================
// CLASS 11/12 ZOOLOGY (NEET)
// ==========================================
register('Health and Diseases', 'High Output Low Input');
register('Microbes and Welfare', 'High Output Low Input');
register('Organisms and Populations', 'High Output Low Input');

register('Human Reproduction', 'High Output High Input');
register('Reproductive Health', 'High Output High Input');
register('Body Fluids and Circulation', 'High Output High Input');
register('Breathing and Exchange', 'High Output High Input');
register('Neural Control', 'High Output High Input');
register('Chemical Coordination', 'High Output High Input');

register('Locomotion and Movement', 'Low Output Low Input');
register('Excretion', 'Low Output Low Input');

register('Structural Organisation in Animals', 'Low Output High Input');

// Other fallback defaults based on heuristics if any extra chapters show up
export function getChapterDifficulty(chapterName: string): DifficultyCategory {
  const normalized = normalizeString(chapterName);
  
  if (CATEGORY_MAPS[normalized]) {
    return CATEGORY_MAPS[normalized];
  }
  
  // Specific fallback heuristics based on topics keywords if not mapped
  if (normalized.includes('semiconductor') || normalized.includes('atom') || normalized.includes('nuclei') || normalized.includes('dualnature')) {
    return 'High Output Low Input';
  }
  if (normalized.includes('electro') || normalized.includes('optic') || normalized.includes('organic') || normalized.includes('integration') || normalized.includes('differentiat')) {
    return 'High Output High Input';
  }

  // default average class level distribution weight
  const sum = chapterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbacks: DifficultyCategory[] = [
    'High Output Low Input',
    'High Output High Input',
    'Low Output Low Input',
    'Low Output High Input'
  ];
  return fallbacks[sum % 4];
}
