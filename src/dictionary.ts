// Complete Job Classification Dictionary for UN Jobs - 15 Category System
// Updated September 2024 with enhanced classification system

export interface ClassificationCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  
  // Multi-tier keyword system
  coreKeywords: string[];           // Essential defining terms (high weight)
  supportKeywords: string[];        // Supporting context terms (medium weight)
  contextPairs: string[][];         // Keyword combinations that boost confidence
  
  // Dynamic learning fields
  emergingKeywords: string[];       // New terms detected over time
  weakSignals: string[];           // Terms that might become important
  lastUpdated: string;             // When this category was last refined
}

export interface ClassificationResult {
  primary: string;
  confidence: number;               // 0-100 confidence score
  secondary: Array<{category: string; confidence: number}>;
  reasoning: string[];              // Why this classification was chosen
  flags: {
    ambiguous: boolean;             // Multiple high-scoring categories
    lowConfidence: boolean;         // Score below threshold
    emergingTerms: string[];        // Unrecognized important terms found
    hybridCandidate: boolean;       // Spans multiple clear categories
  };
}

export const JOB_CLASSIFICATION_DICTIONARY: ClassificationCategory[] = [
  {
    id: 'leadership-executive',
    name: 'Leadership & Executive Management',
    description: 'Senior leadership positions including Resident Coordinators, Country Directors, Chiefs of Mission, Representatives, and executive management',
    color: '#1F2937',
    coreKeywords: [
      'director', 'coordinator', 'representative', 'chief', 'deputy', 'head', 'executive',
      'resident coordinator', 'country director', 'deputy director', 'chief of mission',
      'senior management', 'executive management', 'leadership', 'strategic leadership',
      'D1', 'D2', 'ASG', 'USG', 'executive level', 'senior executive'
    ],
    supportKeywords: [
      'management', 'oversight', 'governance', 'strategic direction', 'leadership team',
      'senior position', 'executive role', 'country management', 'field management',
      'regional director', 'global leadership', 'organizational leadership',
      'executive coordination', 'senior coordinator', 'chief officer'
    ],
    contextPairs: [
      ['resident', 'coordinator'], ['country', 'director'], ['chief', 'mission'],
      ['deputy', 'director'], ['senior', 'management'], ['executive', 'leadership'],
      ['strategic', 'leadership'], ['field', 'management']
    ],
    emergingKeywords: [],
    weakSignals: ['transformation leadership', 'digital leadership', 'innovation leadership'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'digital-technology',
    name: 'Digital & Technology',
    description: 'IT, software development, data science, cybersecurity, digital transformation',
    color: '#3B82F6',
    coreKeywords: [
      'software', 'programmer', 'developer', 'software engineer', 'data scientist', 
      'IT specialist', 'digital transformation', 'cybersecurity', 'machine learning',
      'AI', 'artificial intelligence', 'blockchain', 'programming', 'coding',
      'cloud computing', 'big data analytics', 'automation engineer'
    ],
    supportKeywords: [
      'digital', 'technology', 'IT', 'innovation', 'platform', 'database', 'web', 'mobile', 'app',
      'technical specialist', 'algorithm', 'API', 'integration', 'infrastructure',
      'DevOps', 'agile', 'scrum', 'user experience', 'UX', 'UI', 'digital literacy',
      'e-governance', 'smart city', 'IoT', 'internet of things', 'data analysis'
    ],
    contextPairs: [
      ['data', 'analysis'], ['digital', 'transformation'], ['IT', 'systems'],
      ['software', 'development'], ['cyber', 'security'], ['machine', 'learning'],
      ['artificial', 'intelligence'], ['cloud', 'computing'], ['big', 'data']
    ],
    emergingKeywords: [],
    weakSignals: ['quantum computing', 'metaverse', 'web3', 'generative AI', 'MLOps'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'climate-environment',
    name: 'Climate & Environment',
    description: 'Climate change, environmental protection, sustainability, renewable energy, conservation',
    color: '#10B981',
    coreKeywords: [
      'climate', 'environment', 'sustainability', 'green', 'carbon', 'renewable',
      'biodiversity', 'ecosystem', 'conservation', 'climate change', 'environmental',
      'clean energy', 'emissions', 'mitigation', 'adaptation', 'forest',
      'ocean', 'marine', 'wildlife', 'natural resources'
    ],
    supportKeywords: [
      'ecological', 'waste management', 'pollution', 'deforestation', 'restoration',
      'sustainable development', 'green technology', 'solar', 'wind', 'hydroelectric',
      'carbon footprint', 'greenhouse gas', 'Paris agreement', 'UNFCCC', 'SDG',
      'circular economy', 'nature-based solutions', 'ecosystem services'
    ],
    contextPairs: [
      ['climate', 'change'], ['renewable', 'energy'], ['carbon', 'emissions'],
      ['biodiversity', 'conservation'], ['green', 'technology'], ['sustainable', 'development'],
      ['environmental', 'protection'], ['clean', 'energy']
    ],
    emergingKeywords: [],
    weakSignals: ['nature positive', 'regenerative agriculture', 'blue carbon', 'climate tech'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'health-medical',
    name: 'Health & Medical',
    description: 'Public health, medical services, epidemiology, health systems, nutrition',
    color: '#EF4444',
    coreKeywords: [
      'health', 'medical', 'healthcare', 'clinical', 'epidemiology', 'disease',
      'vaccine', 'pharmacy', 'nutrition', 'public health', 'WHO', 'health system',
      'maternal health', 'child health', 'mental health', 'global health',
      'health policy', 'health security', 'pandemic', 'outbreak', 'epidemiologist',
      'world health organization', 'health product access', 'health programs'
    ],
    supportKeywords: [
      'hospital', 'patient', 'treatment', 'diagnosis', 'prevention', 'immunization',
      'health promotion', 'primary healthcare', 'universal health coverage',
      'health equity', 'health research', 'medical research', 'clinical trial',
      'health data', 'health information', 'telemedicine', 'digital health'
    ],
    contextPairs: [
      ['public', 'health'], ['maternal', 'health'], ['mental', 'health'],
      ['disease', 'prevention'], ['health', 'systems'], ['global', 'health'],
      ['health', 'policy'], ['universal', 'coverage']
    ],
    emergingKeywords: [],
    weakSignals: ['precision medicine', 'health AI', 'genomics', 'personalized medicine'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'agriculture-food-security',
    name: 'Agriculture & Food Security',
    description: 'Agricultural development, food systems, rural development, livestock, fisheries',
    color: '#16A34A',
    coreKeywords: [
      'agriculture', 'food security', 'farming', 'rural development', 'livestock',
      'fisheries', 'food systems', 'agricultural development', 'FAO', 'IFAD',
      'WFP', 'rural', 'crops', 'agribusiness', 'aquaculture', 'food production',
      'agricultural economics', 'land management', 'irrigation', 'soil', 'seeds'
    ],
    supportKeywords: [
      'food policy', 'nutrition security', 'smallholder farmers', 'value chains',
      'agricultural extension', 'farm management', 'crop production', 'animal husbandry',
      'sustainable agriculture', 'organic farming', 'precision agriculture',
      'food safety', 'post-harvest', 'agricultural research', 'agtech'
    ],
    contextPairs: [
      ['food', 'security'], ['rural', 'development'], ['agricultural', 'development'],
      ['food', 'systems'], ['value', 'chains'], ['smallholder', 'farmers'],
      ['food', 'production'], ['agricultural', 'economics']
    ],
    emergingKeywords: [],
    weakSignals: ['vertical farming', 'agtech', 'climate-smart agriculture', 'food tech'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'education-development',
    name: 'Education & Development',
    description: 'Education, training, capacity building, youth development, skills development',
    color: '#8B5CF6',
    coreKeywords: [
      'education', 'training', 'learning', 'capacity building', 'curriculum',
      'teaching', 'academic', 'scholarship', 'skill development', 'knowledge management',
      'educational', 'school', 'university', 'literacy', 'numeracy', 'youth',
      'technical education', 'vocational training', 'adult education', 'youth development'
    ],
    supportKeywords: [
      'pedagogy', 'educational technology', 'e-learning', 'distance learning',
      'quality education', 'inclusive education', 'educational planning',
      'teacher training', 'educational assessment', 'learning outcomes',
      'educational policy', 'higher education', 'early childhood education'
    ],
    contextPairs: [
      ['capacity', 'building'], ['skill', 'development'], ['quality', 'education'],
      ['teacher', 'training'], ['educational', 'policy'], ['technical', 'education'],
      ['adult', 'education'], ['distance', 'learning'], ['youth', 'development']
    ],
    emergingKeywords: [],
    weakSignals: ['microlearning', 'adaptive learning', 'learning analytics', 'EdTech'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'social-affairs-human-rights',
    name: 'Social Affairs & Human Rights',
    description: 'Human rights, gender equality, social inclusion, child protection, social development',
    color: '#EC4899',
    coreKeywords: [
      'human rights', 'gender', 'women', 'equality', 'inclusion', 'diversity',
      'disability', 'social protection', 'empowerment', 'child protection',
      'marginalized', 'vulnerable', 'gender equality', 'women empowerment',
      'social inclusion', 'inclusive', 'equity', 'discrimination', 'social development'
    ],
    supportKeywords: [
      'gender mainstreaming', 'women leadership', 'girls education',
      'gender-based violence', 'social cohesion', 'minority rights',
      'indigenous peoples', 'LGBTI', 'accessibility', 'social justice',
      'human dignity', 'cultural diversity', 'social affairs'
    ],
    contextPairs: [
      ['human', 'rights'], ['gender', 'equality'], ['women', 'empowerment'], 
      ['social', 'inclusion'], ['gender', 'mainstreaming'], ['vulnerable', 'groups'],
      ['social', 'protection'], ['inclusive', 'development'], ['child', 'protection']
    ],
    emergingKeywords: [],
    weakSignals: ['intersectionality', 'gender responsive', 'leave no one behind'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'peace-security',
    name: 'Peace & Security',
    description: 'Peacekeeping, political affairs, disarmament, security sector reform, conflict prevention',
    color: '#1E40AF',
    coreKeywords: [
      'peacekeeping', 'peacebuilding', 'political affairs', 'political officer',
      'political analysis', 'political advisor', 'conflict prevention',
      'mediation', 'conflict resolution', 'peace operations', 'security council',
      'disarmament', 'stabilization', 'ceasefire', 'DDR', 'security sector reform',
      'political reporting', 'political coordination', 'political research', 'military officer',
      'police officer', 'uniformed personnel', 'peacekeeping operations'
    ],
    supportKeywords: [
      'conflict analysis', 'peace processes', 'political dialogue', 'reconciliation',
      'transitional justice', 'election monitoring', 'political transition',
      'security assessment', 'peace agreement', 'political settlement',
      'diplomatic engagement', 'political mapping', 'stakeholder analysis',
      'political strategy', 'peace dividend', 'political economy'
    ],
    contextPairs: [
      ['political', 'affairs'], ['peace', 'operations'], ['conflict', 'prevention'],
      ['security', 'council'], ['peace', 'building'], ['political', 'analysis'],
      ['conflict', 'resolution'], ['peace', 'process'], ['security', 'sector']
    ],
    emergingKeywords: [],
    weakSignals: ['hybrid courts', 'women peace security', 'youth peace security', 'climate security'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'humanitarian-emergency',
    name: 'Humanitarian & Emergency',
    description: 'Emergency response, humanitarian coordination, refugee assistance, disaster response',
    color: '#F59E0B',
    coreKeywords: [
      'humanitarian', 'emergency', 'crisis', 'disaster', 'response', 'relief',
      'refugee', 'UNHCR', 'recovery', 'resilience', 'humanitarian aid', 
      'disaster risk reduction', 'emergency preparedness', 'humanitarian coordination',
      'humanitarian assistance', 'displacement', 'migration'
    ],
    supportKeywords: [
      'emergency response', 'disaster management', 'risk reduction', 'early warning', 
      'contingency planning', 'protection', 'food security', 'shelter', 'WASH', 
      'logistics', 'humanitarian access', 'camp management', 'humanitarian principles',
      'humanitarian financing'
    ],
    contextPairs: [
      ['humanitarian', 'assistance'], ['emergency', 'response'], ['disaster', 'relief'],
      ['humanitarian', 'coordination'], ['risk', 'reduction'], ['emergency', 'preparedness'],
      ['humanitarian', 'aid'], ['disaster', 'management']
    ],
    emergingKeywords: [],
    weakSignals: ['anticipatory action', 'nexus approach', 'localization', 'cash programming'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'governance-rule-of-law',
    name: 'Governance & Rule of Law',
    description: 'Democratic governance, justice, rule of law, elections, public administration',
    color: '#6366F1',
    coreKeywords: [
      'governance', 'rule of law', 'elections', 'democracy',
      'democratic governance', 'public administration', 'institutional',
      'anti-corruption', 'transparency', 'accountability', 'public sector',
      'institutional development', 'public management', 'regulatory', 'legislative',
      'electoral'
    ],
    supportKeywords: [
      'public policy', 'governance reform', 'institutional capacity',
      'public service', 'civil service', 'decentralization', 'local governance',
      'participatory governance', 'e-governance', 'regulatory framework', 
      'institutional strengthening', 'good governance', 'government relations',
      'electoral assistance'
    ],
    contextPairs: [
      ['democratic', 'governance'], ['public', 'administration'], 
      ['good', 'governance'], ['institutional', 'strengthening'], ['governance', 'reform'],
      ['public', 'sector'], ['electoral', 'assistance']
    ],
    emergingKeywords: [],
    weakSignals: ['digital governance', 'agile government', 'policy innovation', 'civic tech'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'legal-compliance',
    name: 'Legal & Compliance',
    description: 'Legal affairs, international law, contracts, compliance, ethics, and regulatory matters',
    color: '#0F766E',
    coreKeywords: [
      'legal', 'lawyer', 'attorney', 'counsel', 'legal officer', 'legal advisor',
      'legal affairs', 'legal counsel', 'legal specialist', 'legal expert',
      'compliance', 'compliance officer', 'ethics', 'ethics officer',
      'international law', 'contract', 'contracts', 'contractual',
      'litigation', 'arbitration', 'dispute resolution', 'legal framework',
      'treaty', 'treaties', 'convention', 'conventions', 'legal analysis',
      'jurisprudence', 'legal review', 'legal services', 'legal support',
      'intellectual property', 'IP law', 'corporate law', 'labor law',
      'human rights law', 'humanitarian law', 'criminal law', 'civil law'
    ],
    supportKeywords: [
      'due diligence', 'legal research', 'legal opinion', 'legal advice',
      'regulatory compliance', 'anti-fraud', 'whistleblower', 'oversight',
      'legal drafting', 'legal documentation', 'legal instruments',
      'legal proceedings', 'court', 'tribunal', 'judicial',
      'legal risk', 'legal liability', 'indemnification', 'liability',
      'terms of reference', 'memorandum of understanding', 'MOU',
      'legal negotiation', 'settlement', 'mediation', 'adjudication',
      'privileges and immunities', 'host country agreement', 'legal status',
      'data protection', 'privacy law', 'GDPR', 'confidentiality',
      'investigation', 'misconduct', 'disciplinary', 'sanctions'
    ],
    contextPairs: [
      ['legal', 'officer'], ['legal', 'advisor'], ['legal', 'counsel'],
      ['legal', 'affairs'], ['international', 'law'], ['legal', 'framework'],
      ['compliance', 'officer'], ['ethics', 'officer'], ['legal', 'analysis'],
      ['contract', 'management'], ['legal', 'review'], ['due', 'diligence'],
      ['legal', 'services'], ['dispute', 'resolution'], ['legal', 'support']
    ],
    emergingKeywords: [],
    weakSignals: ['legal tech', 'smart contracts', 'regulatory technology', 'legal AI'],
    lastUpdated: '2024-11-27'
  },
  {
    id: 'economic-affairs-trade',
    name: 'Economic Affairs & Trade',
    description: 'Economic development, trade, finance, private sector, market development',
    color: '#059669',
    coreKeywords: [
      'economic', 'development', 'finance', 'investment', 'trade', 'private sector',
      'entrepreneurship', 'market', 'financial inclusion', 'poverty reduction',
      'economic growth', 'microfinance', 'banking', 'financial services',
      'economic policy', 'fiscal', 'monetary', 'employment', 'job creation',
      'trade facilitation', 'market development', 'investment promotion'
    ],
    supportKeywords: [
      'sustainable development', 'inclusive growth', 'value chain', 'business development',
      'financial literacy', 'access to finance', 'economic empowerment',
      'livelihood', 'income generation', 'economic analysis', 'macroeconomic',
      'SME development', 'public-private partnership', 'economic research',
      'trade policy', 'commercial development'
    ],
    contextPairs: [
      ['economic', 'development'], ['private', 'sector'], ['financial', 'inclusion'],
      ['poverty', 'reduction'], ['economic', 'growth'], ['job', 'creation'],
      ['market', 'development'], ['trade', 'facilitation'], ['investment', 'promotion']
    ],
    emergingKeywords: [],
    weakSignals: ['fintech', 'digital finance', 'impact investing', 'green finance'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'policy-strategic-planning',
    name: 'Policy & Strategic Planning',
    description: 'Policy development, strategic planning, research, analysis, coordination',
    color: '#7C2D12',
    coreKeywords: [
      'policy', 'strategy', 'planning', 'analysis', 'coordination', 'strategic planning',
      'policy development', 'policy analysis', 'strategic analysis', 'research',
      'policy research', 'strategic coordination', 'planning officer', 'policy officer',
      'strategy officer', 'programme planning', 'strategic management'
    ],
    supportKeywords: [
      'policy coordination', 'strategic direction', 'policy implementation',
      'strategic initiatives', 'policy review', 'strategic assessment',
      'planning coordination', 'policy advisory', 'strategic advisory',
      'results-based management', 'monitoring and evaluation', 'strategic monitoring'
    ],
    contextPairs: [
      ['policy', 'development'], ['strategic', 'planning'], ['policy', 'analysis'],
      ['strategic', 'analysis'], ['policy', 'coordination'], ['strategic', 'coordination'],
      ['policy', 'research'], ['strategic', 'management']
    ],
    emergingKeywords: [],
    weakSignals: ['policy innovation', 'strategic foresight', 'systems thinking'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'communications-partnerships',
    name: 'Communications & Partnerships',
    description: 'Public information, media, advocacy, partnerships, resource mobilization',
    color: '#DC2626',
    coreKeywords: [
      'communication', 'communications', 'advocacy', 'media', 'public information', 'outreach',
      'awareness', 'campaign', 'social media', 'journalism', 'partnership',
      'public relations', 'stakeholder engagement', 'knowledge sharing', 
      'information management', 'content creation', 'partnerships', 'donor relations',
      'resource mobilization', 'partnership development'
    ],
    supportKeywords: [
      'strategic communication', 'behavior change', 'social mobilization',
      'community engagement', 'multimedia', 'digital communication',
      'advocacy strategy', 'messaging', 'storytelling', 'brand management',
      'external relations', 'fundraising', 'visibility'
    ],
    contextPairs: [
      ['strategic', 'communication'], ['public', 'information'], ['social', 'media'],
      ['stakeholder', 'engagement'], ['advocacy', 'campaign'], ['behavior', 'change'],
      ['community', 'engagement'], ['knowledge', 'sharing'], ['partnership', 'development']
    ],
    emergingKeywords: [],
    weakSignals: ['influencer engagement', 'content marketing', 'digital storytelling'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'operations-administration',
    name: 'Operations & Administration',
    description: 'HR, finance, procurement, general administration, facilities, travel',
    color: '#6B7280',
    coreKeywords: [
      'administrative', 'administration', 'administrative support', 'staff assistant',
      'office management', 'HR', 'human resources', 'finance', 'procurement', 
      'facilities', 'travel', 'support', 'operational', 'budget management', 
      'financial analysis', 'budget', 'financial management', 'treasury', 
      'accounting', 'financial planning', 'budget planning', 'financial reporting',
      'driver', 'vehicle management', 'fleet maintenance', 'transport services'
    ],
    supportKeywords: [
      'project management', 'resource management', 'vendor management',
      'contract management', 'quality assurance', 'compliance',
      'business continuity', 'risk management', 'asset management',
      'facility management', 'event management', 'budget monitoring',
      'expenditure monitoring', 'financial control', 'cost management',
      'budget administration', 'financial operations', 'cash management'
    ],
    contextPairs: [
      ['human', 'resources'], ['project', 'management'], ['budget', 'management'],
      ['operations', 'management'], ['facility', 'management'], ['resource', 'management'], 
      ['administrative', 'support'], ['financial', 'management']
    ],
    emergingKeywords: [],
    weakSignals: ['automation', 'digital transformation', 'predictive analytics'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'supply-chain-logistics',
    name: 'Supply Chain & Logistics',
    description: 'Logistics, supply chain, warehouse, fleet management, distribution',
    color: '#78716C',
    coreKeywords: [
      'logistics', 'supply chain', 'supply', 'warehouse', 'distribution',
      'fleet management', 'transport', 'shipping', 'freight', 'customs',
      'inventory', 'procurement logistics', 'supply planning', 'logistics coordination',
      'supply operations', 'logistics management', 'supply management'
    ],
    supportKeywords: [
      'vendor management', 'supplier relations', 'inventory management',
      'distribution management', 'transportation management', 'warehousing',
      'logistics planning', 'supply planning', 'demand planning',
      'cold chain', 'humanitarian logistics', 'field logistics'
    ],
    contextPairs: [
      ['supply', 'chain'], ['supply', 'management'], ['logistics', 'coordination'],
      ['fleet', 'management'], ['distribution', 'management'], ['inventory', 'management'],
      ['logistics', 'planning'], ['supply', 'planning']
    ],
    emergingKeywords: [],
    weakSignals: ['supply chain digitalization', 'predictive maintenance', 'drone delivery'],
    lastUpdated: '2024-09-17'
  },
  {
    id: 'translation-interpretation',
    name: 'Translation & Interpretation',
    description: 'Language services, translation, interpretation, localization, and linguistic support',
    color: '#8B5CF6',
    coreKeywords: [
      'translator', 'interpreter', 'translation', 'interpretation', 'linguistic', 'language',
      'bilingual', 'multilingual', 'localization', 'linguist', 'language specialist',
      'consecutive interpretation', 'simultaneous interpretation', 'sign language',
      'language services', 'translation services', 'interpreter services',
      'field interpreter', 'arabic-english', 'english-arabic'
    ],
    supportKeywords: [
      'language skills', 'fluency', 'native speaker', 'language proficiency',
      'cultural adaptation', 'terminology', 'glossary', 'translation memory',
      'cultural mediation', 'language coordination', 'translation quality',
      'linguistic review', 'proofreading', 'editing', 'subtitling',
      'voice-over', 'transcription', 'language training', 'conference interpretation'
    ],
    contextPairs: [
      ['language', 'services'], ['translation', 'interpretation'], ['linguistic', 'support'],
      ['language', 'specialist'], ['cultural', 'adaptation'], ['language', 'coordination'],
      ['consecutive', 'interpretation'], ['simultaneous', 'interpretation'], 
      ['field', 'interpreter'], ['arabic', 'english']
    ],
    emergingKeywords: [],
    weakSignals: ['AI translation', 'machine translation', 'neural translation', 'remote interpretation'],
    lastUpdated: '2024-09-17'
  }
];

// Leadership Override System - Only true senior leadership grades and titles
// UN System Context: NPSA/PSA are service agreement contracts, NOT international staff
// True leadership = International Professional D1+, or Senior Appointed Officials (ASG, USG)
export const LEADERSHIP_GRADES = [
  'D-2', 'D2', 'D-1', 'D1', 'ASG', 'USG', 'SG', 'DSG', 'P5', 'P6', 'P7'
];

/**
 * STRICT POSITIVE IDENTIFICATION for Leadership grades
 * ONLY these specific grades qualify for Leadership & Executive Management:
 * - D1, D2 (Director levels) - International Professional Staff
 * - ASG (Assistant Secretary-General)
 * - USG (Under-Secretary-General)
 * - SG (Secretary-General)  
 * - DSG (Deputy Secretary-General)
 * - P5 (Senior Professional level) - May be considered senior leadership
 * 
 * EXPLICITLY EXCLUDED (even at high levels):
 * - NPSA (all levels) - National staff contracts, NOT executive positions
 *   Even NPSA-10/11 are locally recruited national staff, subject to local 
 *   salary scales, and are supporting roles not executive leadership.
 * - PSA (all levels) - Personnel Service Agreements, NOT staff positions
 * - Consultants (IC, SSA, LICA, IPSA)
 * - UNV, Interns
 * - P1-P4, GS/G grades, NOA/NOB/NOC/NOD
 */
export function isLeadershipGrade(grade: string): boolean {
  if (!grade) return false;
  
  const gradeUpper = grade.toUpperCase().trim();
  
  // EXPLICITLY EXCLUDE NPSA at ALL levels - service agreement, not executive
  // NPSA = National Personnel Service Agreement (national staff contracts)
  if (gradeUpper.includes('NPSA')) {
    return false;
  }
  
  // EXPLICITLY EXCLUDE PSA at ALL levels - service agreement
  if (gradeUpper.includes('PSA')) {
    return false;
  }
  
  // EXPLICITLY EXCLUDE service contracts and consultants
  if (gradeUpper.includes('CONSULT') || gradeUpper.includes('IC') || 
      gradeUpper.includes('LICA') || gradeUpper.includes('IPSA') ||
      gradeUpper.includes('SSA') || gradeUpper.includes('SB')) {
    return false;
  }
  
  // EXPLICITLY EXCLUDE UNV and Interns
  if (gradeUpper.includes('UNV') || gradeUpper.includes('VOLUNTEER') ||
      gradeUpper.includes('INTERN')) {
    return false;
  }
  
  // POSITIVE IDENTIFICATION ONLY - Executive levels (Senior Appointed Officials)
  if (['ASG', 'USG', 'SG', 'DSG'].includes(gradeUpper)) return true;
  
  // POSITIVE IDENTIFICATION ONLY - D grades (D1, D2) - International Directors
  if (gradeUpper.match(/^D[-]?[12]$/)) return true;
  
  // POSITIVE IDENTIFICATION ONLY - P5+ (Senior Professional levels)
  const pMatch = gradeUpper.match(/^P[-]?([0-9]+)$/);
  if (pMatch) {
    const pLevel = parseInt(pMatch[1]);
    return pLevel >= 5; // Only P5+
  }
  
  // EVERYTHING ELSE IS EXCLUDED
  return false;
}

export const LEADERSHIP_TITLE_INDICATORS = [
  'resident coordinator', 'country director', 'regional director',
  'deputy director general', 'assistant director general', 'director general',
  'assistant secretary-general', 'under-secretary-general', 'secretary-general',
  'executive secretary', 'administrator', 'high commissioner',
  'special representative', 'deputy special representative'
];

// Detection thresholds and configuration
export const CLASSIFICATION_CONFIG = {
  confidenceThresholds: {
    high: 70,
    medium: 40,
    low: 25
  },
  ambiguityThreshold: 5, // If top 2 scores are within this range, flag as ambiguous
  emergingTermThreshold: 3, // Min occurrences to consider a new term "emerging"
  weakSignalPromotionThreshold: 10, // Occurrences to promote weak signal to emerging
  
  fieldWeights: {
    title: 25,           // INCREASED: Titles are strongest category indicators
    jobLabels: 15,       // High: Skills/keywords are important  
    description: 3,      // Low: Descriptions often generic
    contextBonus: 12,    // INCREASED: Word combinations are strong signals
    coreKeywordMultiplier: 2.0,     // INCREASED: Core keywords are definitive
    supportKeywordMultiplier: 1.0,   // Support keywords stay same
    titleKeywordMultiplier: 3.0,     // NEW: Extra boost for keywords in titles
  }
};

// Common words to ignore when detecting emerging terms
export const STOP_WORDS = new Set([
  'will', 'with', 'work', 'experience', 'required', 'years', 'including',
  'strong', 'knowledge', 'skills', 'ability', 'responsibilities', 'duties',
  'position', 'role', 'candidate', 'must', 'should', 'working', 'team',
  'responsible', 'support', 'develop', 'ensure', 'provide', 'manage',
  'coordinate', 'implement', 'contribute', 'assist', 'participate',
  'relevant', 'appropriate', 'effective', 'efficient', 'successful',
  'international', 'national', 'regional', 'local', 'global', 'country',
  'organization', 'agency', 'department', 'office', 'unit', 'project',
  'program', 'initiative', 'activity', 'task', 'assignment', 'mission',
  // CRITICAL: Generic keywords that appear everywhere
  'research', 'analysis', 'analytical', 'management', 'administration', 
  'development', 'implementation', 'coordination', 'planning',
  'monitoring', 'evaluation', 'assessment', 'review', 'technical', 'operational',
  'strategic', 'policies', 'procedures', 'guidelines', 'standards',
  'systems', 'system', 'processes', 'process', 'solutions', 'solution',
  'approaches', 'approach', 'methods', 'method', 'tools', 'tool',
  'resources', 'resource', 'materials', 'material', 'studies',
  'university', 'universities', 'academic', 'report'
]);

// Generic keywords that should NEVER be suggested (too common across categories)
export const FORBIDDEN_LEARNING_KEYWORDS = new Set([
  'research', 'management', 'administration', 'support', 'development',
  'analysis', 'coordination', 'planning', 'monitoring', 'evaluation',
  'assessment', 'implementation', 'technical', 'operational', 'strategic',
  'university', 'academic', 'software', 'system', 'digital', 'data',
  'report', 'policy', 'governance', 'communication', 'training',
  'health', 'education', 'security', 'finance', 'legal', 'operations'
]);

// Hybrid category patterns - jobs that commonly span multiple categories
export const HYBRID_PATTERNS = [
  {
    name: 'Digital Health',
    categories: ['digital-technology', 'health-medical'],
    indicators: ['health tech', 'medical software', 'health data', 'telemedicine', 'digital health']
  },
  {
    name: 'Climate Tech',
    categories: ['climate-environment', 'digital-technology'],
    indicators: ['climate data', 'environmental monitoring', 'green tech', 'clean tech']
  },
  {
    name: 'EdTech',
    categories: ['education-development', 'digital-technology'],
    indicators: ['educational technology', 'e-learning platform', 'digital learning']
  },
  {
    name: 'Humanitarian Tech',
    categories: ['humanitarian-emergency', 'digital-technology'],
    indicators: ['humanitarian innovation', 'crisis tech', 'emergency systems']
  },
  {
    name: 'Financial Inclusion',
    categories: ['economic-affairs-trade', 'social-affairs-human-rights'],
    indicators: ['inclusive finance', 'microfinance', 'financial empowerment']
  },
  {
    name: 'Agriculture Tech',
    categories: ['agriculture-food-security', 'digital-technology'],
    indicators: ['agtech', 'precision agriculture', 'smart farming', 'agricultural data']
  },
  {
    name: 'Peace & Humanitarian',
    categories: ['peace-security', 'humanitarian-emergency'],
    indicators: ['post-conflict recovery', 'humanitarian protection', 'peace operations']
  }
];

// Category mapping for backward compatibility
export const CATEGORY_MAPPING = {
  // Old -> New mappings
  'education-training': 'education-development',
  'gender-social-inclusion': 'social-affairs-human-rights',
  'emergency-humanitarian': 'humanitarian-emergency',
  'governance-policy': 'governance-rule-of-law',
  'economic-development': 'economic-affairs-trade',
  'communication-advocacy': 'communications-partnerships',
  'operations-logistics': 'operations-administration'
};

// System for learning and adaptation
export interface LearningMetrics {
  totalClassifications: number;
  avgConfidence: number;
  ambiguousRate: number;
  lowConfidenceRate: number;
  newTermsDetected: number;
  lastLearningUpdate: string;
  categoryPerformance: Array<{
    category: string;
    avgConfidence: number;
    ambiguityRate: number;
    volume: number;
  }>;
}