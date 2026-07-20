import { Question } from '../types';

export const PRELOADED_QUESTIONS: Question[] = [
  // --- Physics JEE Main ---
  {
    id: 'q-jee-phy-1',
    chapterId: 'jee-physics-class-11-units-and-measurements',
    examType: 'JEE',
    subject: 'Physics',
    year: 2023,
    questionText: 'A physical quantity Q is given by Q = (A^2 B^3) / (C √D). If percentage errors in measurement of A, B, C, and D are 1%, 2%, 4%, and 2% respectively, find the maximum percentage error in the calculation of Q.',
    options: {
      A: '12%',
      B: '13%',
      C: '15%',
      D: '14%'
    },
    correctAnswer: 'B',
    explanation: 'Percentage error in Q is given by the formula:\nΔQ/Q = 2(ΔA/A) + 3(ΔB/B) + 1(ΔC/C) + 0.5(ΔD/D)\n\nSubstituting the percentage errors:\nΔQ/Q = 2(1%) + 3(2%) + 1(4%) + 0.5(2%)\nΔQ/Q = 2% + 6% + 4% + 1% = 13%.',
    concept: 'Propagation of Errors in Mathematics',
    difficulty: 'Medium'
  },
  {
    id: 'q-jee-phy-2',
    chapterId: 'jee-physics-class-11-motion-in-a-straight-line',
    examType: 'JEE',
    subject: 'Physics',
    year: 2022,
    questionText: 'A ball is thrown vertically upwards with a velocity of 20 m/s from the top of a tower of height 25 m. Find the total time taken by the ball to hit the ground. (Take g = 10 m/s²).',
    options: {
      A: '3 seconds',
      B: '4 seconds',
      C: '5 seconds',
      D: '6 seconds'
    },
    correctAnswer: 'C',
    explanation: 'Using the displacement equation:\ns = ut + 0.5 at²\n\nTaking vertically upward direction as positive:\nDisplacement s = -25 m\nInitial velocity u = +20 m/s\nAcceleration a = -10 m/s²\n\n-25 = 20t - 5t² \n=> 5t² - 20t - 25 = 0\n=> t² - 4t - 5 = 0\n=> (t - 5)(t + 1) = 0\nSince time cannot be negative, t = 5 seconds.',
    concept: 'Equations of Motion under Constant Gravity',
    difficulty: 'Easy'
  },
  {
    id: 'q-jee-phy-3',
    chapterId: 'jee-physics-class-11-laws-of-motion',
    examType: 'JEE',
    subject: 'Physics',
    year: 2024,
    questionText: 'A block of mass 5 kg is kept on a rough horizontal surface. The coefficient of static friction is 0.4. If a horizontal force of 15 N is applied to the block, what is the friction force acting on it? (Take g = 10 m/s²).',
    options: {
      A: '20 N',
      B: '15 N',
      C: '50 N',
      D: '0 N'
    },
    correctAnswer: 'B',
    explanation: 'Maximum static friction force (Limiting friction) = μ_s * N = μ_s * m * g\nF_limit = 0.4 * 5 * 10 = 20 N.\n\nSince the applied force (15 N) is less than the limiting friction (20 N), the block does not move. The static friction force will adjust itself to be exactly equal to the applied force.\nTherefore, Friction force = 15 N.',
    concept: 'Limiting and Self-Adjusting Static Friction',
    difficulty: 'Medium'
  },

  // --- Chemistry JEE Main ---
  {
    id: 'q-jee-ch-1',
    chapterId: 'jee-chemistry-class-11-some-basic-concepts-of-chemistry',
    examType: 'JEE',
    subject: 'Chemistry',
    year: 2023,
    questionText: 'What is the molarity of a solution prepared by dissolving 4g of NaOH in enough water to form 250 mL of solution? (Molar mass of NaOH = 40 g/mol).',
    options: {
      A: '0.1 M',
      B: '0.2 M',
      C: '0.4 M',
      D: '0.5 M'
    },
    correctAnswer: 'C',
    explanation: 'Number of moles of NaOH = Given mass / Molar mass = 4g / 40 g/mol = 0.1 mol.\nVolume of solution in liters = 250 / 1000 = 0.25 L.\n\nMolarity = moles of solute / volume of solution in liters\nMolarity = 0.1 / 0.25 = 0.4 M.',
    concept: 'Molarity and Concentration Terms',
    difficulty: 'Easy'
  },
  {
    id: 'q-jee-ch-2',
    chapterId: 'jee-chemistry-class-12-solutions',
    examType: 'JEE',
    subject: 'Chemistry',
    year: 2022,
    questionText: 'An aqueous solution of a non-volatile solute has a boiling point of 100.15 °C. If Kb for water is 0.512 K kg mol⁻¹, calculate the molality of the solution.',
    options: {
      A: '0.29 mol/kg',
      B: '0.58 mol/kg',
      C: '0.15 mol/kg',
      D: '0.45 mol/kg'
    },
    correctAnswer: 'A',
    explanation: 'Elevation in boiling point:\nΔTb = Tb - T°b = 100.15 - 100.00 = 0.15 °C = 0.15 K.\n\nUsing formula:\nΔTb = Kb * m\n0.15 = 0.512 * m\nm = 0.15 / 0.512 = 0.293 mol/kg.',
    concept: 'Colligative Properties - Elevation of Boiling Point',
    difficulty: 'Medium'
  },

  // --- Mathematics JEE Main ---
  {
    id: 'q-jee-math-1',
    chapterId: 'jee-mathematics-class-11-complex-numbers',
    examType: 'JEE',
    subject: 'Mathematics',
    year: 2023,
    questionText: 'Find the value of z = i^400 + i^401 + i^402 + i^403 where i = √(-1).',
    options: {
      A: '0',
      B: '1',
      C: 'i',
      D: '-i'
    },
    correctAnswer: 'A',
    explanation: 'We know that i^n + i^(n+1) + i^(n+2) + i^(n+3) for any integer n is always equal to 0 because:\ni^400 = 1\ni^401 = i\ni^402 = -1\ni^403 = -i\n\nSum = 1 + i - 1 - i = 0.',
    concept: 'Powers of Imaginary Unit i',
    difficulty: 'Easy'
  },
  {
    id: 'q-jee-math-2',
    chapterId: 'jee-mathematics-class-12-matrices',
    examType: 'JEE',
    subject: 'Mathematics',
    year: 2024,
    questionText: 'Let A be a 3x3 matrix such that |A| = 5. Find the value of |adj(A)|.',
    options: {
      A: '5',
      B: '25',
      C: '125',
      D: '1'
    },
    correctAnswer: 'B',
    explanation: 'For any n x n matrix, the determinant of its adjoint is given by:\n|adj(A)| = |A|^(n - 1)\n\nHere, n = 3 (since A is a 3x3 matrix) and |A| = 5.\n|adj(A)| = 5^(3 - 1) = 5² = 25.',
    concept: 'Properties of Adjoint and Determinant',
    difficulty: 'Easy'
  },

  // --- Physics NEET ---
  {
    id: 'q-neet-phy-1',
    chapterId: 'neet-physics-class-11-gravitation',
    examType: 'NEET',
    subject: 'Physics',
    year: 2024,
    questionText: 'The acceleration due to gravity on the surface of the Earth is g. What is its value at a height equal to the radius of the Earth (R)?',
    options: {
      A: 'g / 2',
      B: 'g / 4',
      C: 'g / 9',
      D: 'g / 3'
    },
    correctAnswer: 'B',
    explanation: 'Acceleration due to gravity at height h is:\ng_h = g * [R / (R + h)]²\n\nGiven height h = R:\ng_h = g * [R / (R + R)]² = g * [R / 2R]² = g * (1/2)² = g/4.',
    concept: 'Variation of gravity with height',
    difficulty: 'Easy'
  },

  // --- Botany NEET ---
  {
    id: 'q-neet-bot-1',
    chapterId: 'neet-botany-class-11-photosynthesis',
    examType: 'NEET',
    subject: 'Botany',
    year: 2023,
    questionText: 'Which of the following describes the first stable product of carbon dioxide fixation in C4 plants?',
    options: {
      A: 'Phosphoglyceric acid (PGA)',
      B: 'Oxaloacetic acid (OAA)',
      C: 'Phosphoenolpyruvate (PEP)',
      D: 'RuBP'
    },
    correctAnswer: 'B',
    explanation: 'In C4 plants, the primary carbon dioxide acceptor is PEP (Phosphoenolpyruvate). The carboxylation is catalyzed by PEP carboxylase, resulting in the formation of Oxaloacetic acid (OAA), a 4-carbon organic acid. This occurs in the mesophyll cells.',
    concept: 'C4 pathway of carbon dioxide fixation',
    difficulty: 'Medium'
  },
  {
    id: 'q-neet-bot-2',
    chapterId: 'neet-botany-class-11-cell-unit-of-life',
    examType: 'NEET',
    subject: 'Botany',
    year: 2024,
    questionText: 'Identify the organelle that is responsible for synthesis of lipids and steroidal hormones in animal cells.',
    options: {
      A: 'Rough Endoplasmic Reticulum',
      B: 'Smooth Endoplasmic Reticulum',
      C: 'Golgi Apparatus',
      D: 'Lysosomes'
    },
    correctAnswer: 'B',
    explanation: 'The Smooth Endoplasmic Reticulum (SER) is the major site for synthesis of lipids (like phospholipids and cholesterol) and steroidal hormones in animal cells.',
    concept: 'Endomembrane System organelles and functions',
    difficulty: 'Easy'
  },

  // --- Zoology NEET ---
  {
    id: 'q-neet-zoo-1',
    chapterId: 'neet-zoology-class-12-human-reproduction',
    examType: 'NEET',
    subject: 'Zoology',
    year: 2023,
    questionText: 'Which hormone is primarily responsible for triggering the ovulation process in human females?',
    options: {
      A: 'Progesterone',
      B: 'FSH (Follicle Stimulating Hormone)',
      C: 'LH (Luteinizing Hormone)',
      D: 'Estrogen'
    },
    correctAnswer: 'C',
    explanation: 'During the middle of the menstrual cycle (around day 14), a rapid secretion of LH induces LH surge. High levels of LH trigger the rupture of the Graafian follicle and thereby release the ovum (ovulation).',
    concept: 'Menstrual Cycle hormonal regulation',
    difficulty: 'Easy'
  },

  // --- CBSE Physics ---
  {
    id: 'q-cbse-phy-1',
    chapterId: 'cbse-physics-class-12-current-electricity',
    examType: 'CBSE',
    subject: 'Physics',
    year: 2022,
    questionText: 'How does the drift velocity of free electrons in a metallic conductor change when the temperature of the conductor increases, keeping the potential difference constant?',
    options: {
      A: 'Increases',
      B: 'Decreases',
      C: 'Remains unchanged',
      D: 'First increases then decreases'
    },
    correctAnswer: 'B',
    explanation: 'As the temperature of the metallic conductor increases, the thermal speed of electrons increases, leading to more frequent collisions with metal ions. This decreases the relaxation time (τ).\n\nSince drift velocity is given by v_d = (e * V * τ) / (m * L), a decrease in relaxation time (τ) directly results in a decrease of drift velocity.',
    concept: 'Drift velocity and temperature dependence',
    difficulty: 'Easy'
  },

  // --- CBSE Biology ---
  {
    id: 'q-cbse-bio-1',
    chapterId: 'cbse-biology-class-12-ecosystem',
    examType: 'CBSE',
    subject: 'Biology',
    year: 2024,
    questionText: 'Identify which of the following ecological pyramids is always upright in nature.',
    options: {
      A: 'Pyramid of biomass in a marine ecosystem',
      B: 'Pyramid of numbers in a tree ecosystem',
      C: 'Pyramid of energy in all ecosystems',
      D: 'Pyramid of biomass in grassland'
    },
    correctAnswer: 'C',
    explanation: 'The pyramid of energy is always upright. It can never be inverted because when energy flows from one trophic level to the next, some energy is always lost as heat in each step (10% law of Lindeman). Therefore, energy at lower trophic levels is always higher than that at progressive higher levels.',
    concept: 'Energy flow and Ecological pyramids',
    difficulty: 'Easy'
  },

  // --- Physics JEE Main: Electrostatics ---
  {
    id: 'q-jee-electro-1',
    chapterId: 'jee-physics-class-12-electrostatics',
    examType: 'JEE',
    subject: 'Physics',
    year: 2024,
    questionText: 'An electric dipole with dipole moment p = (3î + 4ĵ) × 10⁻⁹ C·m is placed in a uniform electric field E = 5000 î N/C. What is the magnitude of the torque acting on the dipole?',
    options: {
      A: '1.5 × 10⁻⁵ N·m',
      B: '2.0 × 10⁻⁵ N·m',
      C: '2.5 × 10⁻⁵ N·m',
      D: 'zero'
    },
    correctAnswer: 'B',
    explanation: 'Torque τ on a dipole is given by: τ = p × E. Substituting the values: τ = (3î + 4ĵ) × 10⁻⁹ × 5000 î. Since î × î = 0 and ĵ × î = -k̂, τ = 4 × 10⁻⁹ × 5000 (-k̂) = -20000 × 10⁻⁹ k̂ = -2 × 10⁻⁵ k̂ N·m. The magnitude of the torque is |τ| = 2.0 × 10⁻⁵ N·m.',
    concept: 'Torque on a Dipole in Uniform Electric Field',
    difficulty: 'Medium'
  },
  {
    id: 'q-jee-electro-2',
    chapterId: 'jee-physics-class-12-electrostatics',
    examType: 'JEE',
    subject: 'Physics',
    year: 2023,
    questionText: 'The electric potential at any point (x, y, z) in space is given by V = 3x + 4y volts. Find the magnitude of the electric field at any point in this region.',
    options: {
      A: '5 N/C',
      B: '7 N/C',
      C: '1 N/C',
      D: '25 N/C'
    },
    correctAnswer: 'A',
    explanation: 'The electric field E is related to electric potential V by the negative potential gradient: E = -∇V = - (∂V/∂x î + ∂V/∂y ĵ + ∂V/∂z k̂). Substituting V = 3x + 4y: ∂V/∂x = 3, ∂V/∂y = 4, ∂V/∂z = 0. Therefore, E = -3 î - 4 ĵ N/C. The magnitude of the electric field is |E| = √((-3)² + (-4)²) = √(9 + 16) = √25 = 5 N/C.',
    concept: 'Relation between Electric Field and Electric Potential',
    difficulty: 'Medium'
  },
  {
    id: 'q-jee-electro-3',
    chapterId: 'jee-physics-class-12-electrostatics',
    examType: 'JEE',
    subject: 'Physics',
    year: 2024,
    questionText: 'Two point charges +q and -q are placed at a distance d apart. The net electric potential at any point on the perpendicular bisector (equatorial plane) of the line joining them at a distance r from the center is:',
    options: {
      A: 'kq / r',
      B: 'kp / r²',
      C: 'zero',
      D: '2kq / √(r² + d²/4)'
    },
    correctAnswer: 'C',
    explanation: 'Electric potential is a scalar quantity. Since any point on the perpendicular bisector of the dipole is equidistant from both the +q and -q charges (at distance R = √(r² + d²/4)), the positive potential due to +q charge exactly cancels the negative potential due to -q charge: V = k(+q)/R + k(-q)/R = 0.',
    concept: 'Electric Potential on Dipole Equatorial Plane',
    difficulty: 'Easy'
  },
  {
    id: 'q-jee-electro-4',
    chapterId: 'jee-physics-class-12-electrostatics',
    examType: 'JEE',
    subject: 'Physics',
    year: 2023,
    questionText: 'A point charge Q is placed at the center of an imaginary cube. What is the electric flux passing through any one of the six faces of the cube?',
    options: {
      A: 'Q / ε₀',
      B: 'Q / (6ε₀)',
      C: 'Q / (4πε₀)',
      D: 'zero'
    },
    correctAnswer: 'B',
    explanation: 'By Gauss\'s Law, the total electric flux passing through any closed surface surrounding a charge Q is Φ_total = Q / ε₀. Since the cube is symmetrical and the charge is at the center, the total flux is divided equally among all 6 faces of the cube. Therefore, the flux through any single face is Φ_face = Φ_total / 6 = Q / (6ε₀).',
    concept: 'Gauss\'s Law and Symmetrical Flux Distribution',
    difficulty: 'Easy'
  },
  {
    id: 'q-jee-electro-5',
    chapterId: 'jee-physics-class-12-electrostatics',
    examType: 'JEE',
    subject: 'Physics',
    year: 2024,
    questionText: 'Two identical metal spheres carry charges of +3 µC and -1 µC respectively. They are brought into contact and then separated to their initial distance. What is the ratio of final electrostatic force to the initial force between them?',
    options: {
      A: '1 : 3',
      B: '3 : 1',
      C: '1 : 2',
      D: '2 : 3'
    },
    correctAnswer: 'A',
    explanation: 'Let initial distance be d. The initial force magnitude is F_initial = k * |(+3) * (-1)| / d² = 3k/d². On contact, the total charge (+3 µC - 1 µC = +2 µC) distributes equally on both identical spheres, so each gets +1 µC. The final force magnitude is F_final = k * |(+1) * (+1)| / d² = 1k/d². The ratio of final to initial force is F_final / F_initial = (1k/d²) / (3k/d²) = 1/3, representing a ratio of 1 : 3.',
    concept: 'Coulomb\'s Law and Charge Conservation/Conduction',
    difficulty: 'Medium'
  }
];
