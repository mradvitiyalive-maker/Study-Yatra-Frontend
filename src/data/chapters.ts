import { Chapter, Subject, Exam, AcademicLevel } from '../types';

export const RAW_CHAPTER_STRUCTURE = {
  // CBSE and JEE share Physics, Chemistry, Mathematics
  CBSE_JEE: {
    Physics: {
      'Class 11': [
        'Units and Measurements',
        'Motion in a Straight Line',
        'Motion in a Plane',
        'Laws of Motion',
        'Work, Energy and Power',
        'System of Particles and Rotational Motion',
        'Gravitation',
        'Mechanical Properties of Solids',
        'Mechanical Properties of Fluids',
        'Thermal Properties of Matter',
        'Thermodynamics',
        'Kinetic Theory',
        'Oscillations',
        'Waves'
      ],
      'Class 12': [
        'Electrostatics',
        'Capacitance',
        'Current Electricity',
        'Magnetic Properties',
        'Moving Charges and Magnetism',
        'EMI',
        'AC Circuits',
        'Electromagnetic Waves',
        'Ray Optics',
        'Wave Optics',
        'Dual Nature',
        'Atomic Physics',
        'Nuclear Physics',
        'Semiconductors'
      ]
    },
    Chemistry: {
      'Class 11': [
        'Some Basic Concepts of Chemistry',
        'Structure of Atom',
        'Classification of Elements and Periodicity',
        'Chemical Bonding and Molecular Structure',
        'Chemical Thermodynamics',
        'Equilibrium',
        'Redox Reactions',
        'Organic Chemistry Basics',
        'Hydrocarbons'
      ],
      'Class 12': [
        'Solutions',
        'Electrochemistry',
        'Chemical Kinetics',
        'Surface Chemistry',
        'Metallurgy',
        'p Block Elements',
        'd and f Block Elements',
        'Coordination Compounds',
        'Haloalkanes and Haloarenes',
        'Alcohols Phenols and Ethers',
        'Aldehydes and Ketones',
        'Carboxylic Acids',
        'Amines',
        'Biomolecules'
      ]
    },
    Mathematics: {
      'Class 11': [
        'Sets',
        'Relations and Functions',
        'Trigonometric Functions',
        'Complex Numbers',
        'Linear Inequalities',
        'Permutations and Combinations',
        'Binomial Theorem',
        'Sequences and Series',
        'Straight Lines',
        'Conic Sections',
        '3D Geometry Introduction',
        'Limits and Derivatives',
        'Statistics',
        'Probability'
      ],
      'Class 12': [
        'Sets and Relations',
        'Matrices',
        'Determinants',
        'Inverse Trigonometric Functions',
        'Continuity and Differentiability',
        'Differentiation',
        'Applications of Derivatives',
        'Indefinite Integration',
        'Definite Integration',
        'Area Under Curves',
        'Differential Equations',
        'Vector Algebra',
        'Three Dimensional Geometry',
        'Linear Programming',
        'Probability'
      ]
    }
  },
  NEET: {
    Physics: {
      'Class 11': [
        'Units and Measurements',
        'Motion in a Straight Line',
        'Motion in a Plane',
        'Laws of Motion',
        'Work, Energy and Power',
        'System of Particles and Rotational Motion',
        'Gravitation',
        'Mechanical Properties of Solids',
        'Mechanical Properties of Fluids',
        'Thermal Properties of Matter',
        'Thermodynamics',
        'Kinetic Theory',
        'Oscillations',
        'Waves'
      ],
      'Class 12': [
        'Electrostatics',
        'Capacitance',
        'Current Electricity',
        'Magnetic Properties',
        'Moving Charges and Magnetism',
        'EMI',
        'AC Circuits',
        'Electromagnetic Waves',
        'Ray Optics',
        'Wave Optics',
        'Dual Nature',
        'Atomic Physics',
        'Nuclear Physics',
        'Semiconductors'
      ]
    },
    Chemistry: {
      'Class 11': [
        'Some Basic Concepts of Chemistry',
        'Structure of Atom',
        'Classification of Elements and Periodicity',
        'Chemical Bonding and Molecular Structure',
        'Thermodynamics',
        'Equilibrium',
        'Redox Reactions',
        'Organic Chemistry Basics',
        'Hydrocarbons'
      ],
      'Class 12': [
        'Solutions',
        'Electrochemistry',
        'Chemical Kinetics',
        'Surface Chemistry',
        'Metallurgy',
        'p Block',
        'd and f Block',
        'Coordination Compounds',
        'Haloalkanes and Haloarenes',
        'Alcohols Phenols and Ethers',
        'Aldehydes and Ketones',
        'Carboxylic Acids',
        'Amines',
        'Biomolecules'
      ]
    },
    Botany: {
      // For NEET Botany, custom classification can span Class 11 & Class 12 or merged.
      // We list the 14 Botany chapters requested by user:
      'Class 11': [
        'Living World',
        'Biological Classification',
        'Plant Kingdom',
        'Morphology of Plants',
        'Anatomy of Plants',
        'Cell Unit of Life',
        'Cell Cycle and Division',
        'Plant Respiration',
        'Photosynthesis',
        'Plant Growth and Development'
      ],
      'Class 12': [
        'Reproduction in Plants',
        'Biomolecules',
        'Biodiversity',
        'Ecosystem'
      ]
    },
    Zoology: {
      // 17 Zoology chapters requested:
      'Class 11': [
        'Structural Organisation in Animals',
        'Excretion',
        'Breathing and Exchange',
        'Locomotion and Movement',
        'Body Fluids and Circulation',
        'Neural Control',
        'Chemical Coordination'
      ],
      'Class 12': [
        'Reproductive Health',
        'Human Reproduction',
        'Molecular Inheritance',
        'Inheritance and Variation',
        'Evolution',
        'Health and Diseases',
        'Microbes and Welfare',
        'Biotechnology Principles',
        'Biotechnology Applications',
        'Organisms and Populations'
      ]
    }
  }
};

// Generates stable beautiful styled gradient cards for chapter images
export function getChapterGradient(id: string): string {
  const gradients = [
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', // Blue
    'linear-gradient(135deg, #10B981 0%, #047857 100%)', // Emerald
    'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)', // Violet
    'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)', // Amber
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', // Pink
    'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)', // Cyan
    'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)', // Rose
    'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)', // Indigo
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return gradients[sum % gradients.length];
}

// Generate full list of preloaded Chapters based on Exam, Academic Level, and Subject selections
export function generatePreloadedChapters(): Chapter[] {
  const chapters: Chapter[] = [];

  // Helper to make a standardized ID
  const makeId = (exam: string, sub: string, lvl: string, name: string) => {
    return `${exam.toLowerCase()}-${sub.toLowerCase().replace(/\s+/g, '-')}-${lvl.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  };

  // Setup JEE Chapters
  const j_phys11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Physics['Class 11'];
  j_phys11.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Physics', 'Class 11', ch),
      name: ch,
      subject: 'Physics',
      exam: 'JEE',
      level: 'Class 11',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    // Droppers can have access to Class 11 and Class 12 chapters
    chapters.push({
      id: makeId('JEE', 'Physics', 'Dropper', ch),
      name: ch,
      subject: 'Physics',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const j_phys12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Physics['Class 12'];
  j_phys12.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Physics', 'Class 12', ch),
      name: ch,
      subject: 'Physics',
      exam: 'JEE',
      level: 'Class 12',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('JEE', 'Physics', 'Dropper', ch),
      name: ch,
      subject: 'Physics',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const j_chem11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Chemistry['Class 11'];
  j_chem11.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Chemistry', 'Class 11', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'JEE',
      level: 'Class 11',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('JEE', 'Chemistry', 'Dropper', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const j_chem12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Chemistry['Class 12'];
  j_chem12.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Chemistry', 'Class 12', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'JEE',
      level: 'Class 12',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('JEE', 'Chemistry', 'Dropper', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const j_math11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Mathematics['Class 11'];
  j_math11.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Mathematics', 'Class 11', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'JEE',
      level: 'Class 11',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('JEE', 'Mathematics', 'Dropper', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const j_math12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Mathematics['Class 12'];
  j_math12.forEach(ch => {
    chapters.push({
      id: makeId('JEE', 'Mathematics', 'Class 12', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'JEE',
      level: 'Class 12',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('JEE', 'Mathematics', 'Dropper', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'JEE',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Setup NEET Chapters: Physics, Chemistry, Botany, Zoology
  // Physics (Classes 11 & 12, plus Droppers)
  const n_phys11 = RAW_CHAPTER_STRUCTURE.NEET.Physics['Class 11'];
  n_phys11.forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Physics', 'Class 11', ch),
      name: ch,
      subject: 'Physics',
      exam: 'NEET',
      level: 'Class 11',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Physics', 'Dropper', ch),
      name: ch,
      subject: 'Physics',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const n_phys12 = RAW_CHAPTER_STRUCTURE.NEET.Physics['Class 12'];
  n_phys12.forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Physics', 'Class 12', ch),
      name: ch,
      subject: 'Physics',
      exam: 'NEET',
      level: 'Class 12',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Physics', 'Dropper', ch),
      name: ch,
      subject: 'Physics',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Chemistry
  const n_chem11 = RAW_CHAPTER_STRUCTURE.NEET.Chemistry['Class 11'];
  n_chem11.forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Chemistry', 'Class 11', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'NEET',
      level: 'Class 11',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Chemistry', 'Dropper', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const n_chem12 = RAW_CHAPTER_STRUCTURE.NEET.Chemistry['Class 12'];
  n_chem12.forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Chemistry', 'Class 12', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'NEET',
      level: 'Class 12',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Chemistry', 'Dropper', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Botany
  RAW_CHAPTER_STRUCTURE.NEET.Botany['Class 11'].forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Botany', 'Class 11', ch),
      name: ch,
      subject: 'Botany',
      exam: 'NEET',
      level: 'Class 11',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Botany', 'Dropper', ch),
      name: ch,
      subject: 'Botany',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  RAW_CHAPTER_STRUCTURE.NEET.Botany['Class 12'].forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Botany', 'Class 12', ch),
      name: ch,
      subject: 'Botany',
      exam: 'NEET',
      level: 'Class 12',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Botany', 'Dropper', ch),
      name: ch,
      subject: 'Botany',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Zoology
  RAW_CHAPTER_STRUCTURE.NEET.Zoology['Class 11'].forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Zoology', 'Class 11', ch),
      name: ch,
      subject: 'Zoology',
      exam: 'NEET',
      level: 'Class 11',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Zoology', 'Dropper', ch),
      name: ch,
      subject: 'Zoology',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  RAW_CHAPTER_STRUCTURE.NEET.Zoology['Class 12'].forEach(ch => {
    chapters.push({
      id: makeId('NEET', 'Zoology', 'Class 12', ch),
      name: ch,
      subject: 'Zoology',
      exam: 'NEET',
      level: 'Class 12',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
    chapters.push({
      id: makeId('NEET', 'Zoology', 'Dropper', ch),
      name: ch,
      subject: 'Zoology',
      exam: 'NEET',
      level: 'Dropper',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Setup CBSE Chapters: Physics, Chemistry, Mathematics, Biology
  // Physics (Class 11 & Class 12 only, because CBSE doesn't have a Dropper level in the same way, but let's make sure it handles selections gracefully)
  const c_phys11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Physics['Class 11'];
  c_phys11.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Physics', 'Class 11', ch),
      name: ch,
      subject: 'Physics',
      exam: 'CBSE',
      level: 'Class 11',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const c_phys12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Physics['Class 12'];
  c_phys12.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Physics', 'Class 12', ch),
      name: ch,
      subject: 'Physics',
      exam: 'CBSE',
      level: 'Class 12',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Chemistry
  const c_chem11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Chemistry['Class 11'];
  c_chem11.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Chemistry', 'Class 11', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'CBSE',
      level: 'Class 11',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const c_chem12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Chemistry['Class 12'];
  c_chem12.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Chemistry', 'Class 12', ch),
      name: ch,
      subject: 'Chemistry',
      exam: 'CBSE',
      level: 'Class 12',
      totalQuestions: 12,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // Mathematics
  const c_math11 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Mathematics['Class 11'];
  c_math11.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Mathematics', 'Class 11', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'CBSE',
      level: 'Class 11',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const c_math12 = RAW_CHAPTER_STRUCTURE.CBSE_JEE.Mathematics['Class 12'];
  c_math12.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Mathematics', 'Class 12', ch),
      name: ch,
      subject: 'Mathematics',
      exam: 'CBSE',
      level: 'Class 12',
      totalQuestions: 15,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // CBSE Biology - lets map NEET Botany + Zoology merged into Biology, as specified for CBSE Subjects -> Biology
  // We'll take NEET Botany and Zoology chapters lists and map them under CBSE Biology
  const mergeBio11 = [
    'Living World',
    'Biological Classification',
    'Plant Kingdom',
    'Morphology of Plants',
    'Anatomy of Plants',
    'Cell Cycle and Division',
    'Cell Unit of Life',
    'Structural Organisation in Animals',
    'Excretion',
    'Breathing and Exchange',
    'Locomotion and Movement',
    'Body Fluids and Circulation',
    'Neural Control',
    'Chemical Coordination'
  ];
  mergeBio11.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Biology', 'Class 11', ch),
      name: ch,
      subject: 'Biology',
      exam: 'CBSE',
      level: 'Class 11',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  const mergeBio12 = [
    'Reproduction in Plants',
    'Biomolecules',
    'Biodiversity',
    'Ecosystem',
    'Reproductive Health',
    'Human Reproduction',
    'Molecular Inheritance',
    'Inheritance and Variation',
    'Evolution',
    'Health and Diseases',
    'Microbes and Welfare',
    'Biotechnology Principles',
    'Biotechnology Applications',
    'Organisms and Populations'
  ];
  mergeBio12.forEach(ch => {
    chapters.push({
      id: makeId('CBSE', 'Biology', 'Class 12', ch),
      name: ch,
      subject: 'Biology',
      exam: 'CBSE',
      level: 'Class 12',
      totalQuestions: 10,
      progressPercent: 0,
      imageUrl: getChapterGradient(ch),
    });
  });

  // De-duplicate chapters by id to prevent React key conflict issues and redundant cards for Droppers
  const uniqueChapters: Chapter[] = [];
  const seenIds = new Set<string>();
  for (const ch of chapters) {
    if (!seenIds.has(ch.id)) {
      seenIds.add(ch.id);
      uniqueChapters.push(ch);
    }
  }
  return uniqueChapters;
}
