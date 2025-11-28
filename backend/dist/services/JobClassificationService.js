"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobClassificationService = void 0;
const JOB_CLASSIFICATION_DICTIONARY = [
    {
        id: 'leadership-executive',
        name: 'Leadership & Executive Management',
        coreKeywords: [
            'director', 'coordinator', 'representative', 'chief', 'deputy', 'head', 'executive',
            'resident coordinator', 'country director', 'deputy director', 'chief of mission',
            'senior management', 'executive management', 'leadership', 'strategic leadership',
            'D1', 'D2', 'ASG', 'USG', 'executive level', 'senior executive',
            'director ejecutivo', 'director regional', 'jefe', 'coordinador residente',
            'directeur', 'directeur exécutif', 'chef de mission', 'coordinateur résident',
            'diretor', 'diretor executivo', 'coordenador residente'
        ],
        supportKeywords: [
            'management', 'oversight', 'governance', 'strategic direction', 'leadership team',
            'senior position', 'executive role', 'country management', 'field management',
            'regional director', 'global leadership', 'organizational leadership'
        ],
        contextPairs: [
            ['resident', 'coordinator'], ['country', 'director'], ['chief', 'mission'],
            ['deputy', 'director'], ['senior', 'management'], ['executive', 'leadership']
        ]
    },
    {
        id: 'digital-technology',
        name: 'Digital & Technology',
        coreKeywords: [
            'software', 'programmer', 'developer', 'software engineer', 'data scientist',
            'IT specialist', 'digital transformation', 'cybersecurity', 'machine learning',
            'AI', 'artificial intelligence', 'blockchain', 'programming', 'coding',
            'cloud computing', 'big data analytics', 'automation engineer', 'ICT officer',
            'systems administrator', 'network engineer', 'web developer', 'data engineer',
            'information technology assistant', 'IT assistant', 'IT officer', 'IT intern',
            'ICT assistant', 'ICT officer', 'technology assistant', 'tech support',
            'information technology', 'information systems', 'information security',
            'network security', 'application security', 'security analyst',
            'DevOps', 'cloud integration', 'virtualization', 'disaster recovery',
            'data analyst', 'data migration', 'data management', 'master data',
            'database', 'ETL', 'SQL', 'data governance', 'business intelligence',
            'UX', 'UI', 'UX/UI', 'user experience', 'user interface', 'usability',
            'UX designer', 'UI designer', 'interaction design', 'prototyping',
            'desarrollador', 'ingeniero de software', 'analista de sistemas', 'programador',
            'transformación digital', 'tecnología de información', 'analista de datos',
            'migración de datos', 'gestión de datos',
            'développeur', 'ingénieur logiciel', 'analyste informatique',
            'analyste de données', 'migration de données',
            'desenvolvedor', 'engenheiro de software', 'analista de sistemas',
            'analista de dados', 'migração de dados'
        ],
        supportKeywords: [
            'digital', 'technology', 'IT', 'platform', 'database', 'web', 'mobile',
            'technical specialist', 'algorithm', 'API', 'integration', 'infrastructure',
            'DevOps', 'agile', 'scrum',
            'sistemas de información', 'SIG', 'GIS', 'arcgis', 'autocad',
            'data visualization', 'data analytics', 'business process', 'modernization'
        ],
        contextPairs: [
            ['digital', 'transformation'], ['IT', 'systems'],
            ['software', 'development'], ['cyber', 'security'], ['machine', 'learning'],
            ['information', 'technology'], ['sistemas', 'información'],
            ['data', 'analyst'], ['data', 'migration'], ['data', 'management'],
            ['user', 'experience'], ['master', 'data'],
            ['IT', 'assistant'], ['technology', 'assistant'], ['network', 'security'],
            ['information', 'security'], ['application', 'security'], ['cloud', 'integration']
        ]
    },
    {
        id: 'climate-environment',
        name: 'Climate & Environment',
        coreKeywords: [
            'climate', 'environment', 'sustainability', 'green', 'carbon', 'renewable',
            'biodiversity', 'ecosystem', 'conservation', 'climate change', 'environmental',
            'clean energy', 'emissions', 'mitigation', 'adaptation', 'forest', 'ocean', 'marine',
            'ambiental', 'medio ambiente', 'sostenibilidad', 'cambio climático', 'biodiversidad',
            'energía renovable', 'energías renovables', 'conservación', 'ecosistema',
            'gestión ambiental', 'analista ambiental', 'experto ambiental', 'auditoría ambiental',
            'recursos naturales', 'desarrollo sostenible', 'economía circular', 'circular economy',
            'financiamiento verde', 'green finance', 'sector energía', 'energético',
            'environnement', 'environnemental', 'climatique', 'durable', 'écologique',
            'énergie renouvelable', 'changement climatique',
            'ambiental', 'meio ambiente', 'sustentabilidade', 'mudança climática',
            'energia renovável', 'conservação da biodiversidade'
        ],
        supportKeywords: [
            'ecological', 'waste management', 'pollution', 'deforestation', 'restoration',
            'sustainable development', 'green technology', 'solar', 'wind', 'hydroelectric',
            'carbon footprint', 'greenhouse gas', 'Paris agreement', 'circular economy',
            'contaminación', 'residuos', 'reciclaje', 'áreas naturales protegidas', 'ANP',
            'diagnóstico ambiental', 'política ambiental', 'políticas energéticas'
        ],
        contextPairs: [
            ['climate', 'change'], ['renewable', 'energy'], ['carbon', 'emissions'],
            ['biodiversity', 'conservation'], ['green', 'technology'],
            ['cambio', 'climático'], ['energía', 'renovable'], ['gestión', 'ambiental'],
            ['medio', 'ambiente'], ['recursos', 'naturales'], ['desarrollo', 'sostenible']
        ]
    },
    {
        id: 'health-medical',
        name: 'Health & Medical',
        coreKeywords: [
            'health', 'medical', 'healthcare', 'clinical', 'epidemiology', 'disease',
            'vaccine', 'vaccination', 'pharmacy', 'nutrition', 'public health', 'WHO', 'health system',
            'maternal health', 'child health', 'mental health', 'global health',
            'health policy', 'health security', 'pandemic', 'outbreak', 'epidemiologist',
            'salud', 'salud pública', 'medicina', 'médico', 'epidemiología', 'vacuna', 'vacunación',
            'nutrición', 'hospital', 'clínico', 'enfermedad', 'prevención', 'tratamiento',
            'santé', 'santé publique', 'médical', 'épidémiologie', 'vaccination', 'vaccin',
            'PEV', 'programme élargi de vaccination', 'immunisation', 'nutrition',
            'maladie', 'prévention', 'traitement', 'hôpital',
            'saúde', 'saúde pública', 'medicina', 'epidemiologia', 'vacina', 'vacinação',
            'nutrição'
        ],
        supportKeywords: [
            'hospital', 'patient', 'treatment', 'diagnosis', 'prevention', 'immunization',
            'health promotion', 'primary healthcare', 'universal health coverage',
            'health equity', 'health research', 'telemedicine', 'digital health',
            'recherche opérationnelle', 'rédaction scientifique'
        ],
        contextPairs: [
            ['public', 'health'], ['maternal', 'health'], ['mental', 'health'],
            ['disease', 'prevention'], ['health', 'systems'], ['global', 'health'],
            ['salud', 'pública'], ['santé', 'publique'], ['programme', 'vaccination']
        ]
    },
    {
        id: 'agriculture-food-security',
        name: 'Agriculture & Food Security',
        coreKeywords: [
            'agriculture', 'food security', 'farming', 'rural development', 'livestock',
            'fisheries', 'food systems', 'agricultural development', 'FAO', 'IFAD',
            'WFP', 'rural', 'crops', 'agribusiness', 'aquaculture', 'food production'
        ],
        supportKeywords: [
            'food policy', 'nutrition security', 'smallholder farmers', 'value chains',
            'agricultural extension', 'farm management', 'crop production', 'animal husbandry',
            'sustainable agriculture', 'organic farming', 'precision agriculture'
        ],
        contextPairs: [
            ['food', 'security'], ['rural', 'development'], ['agricultural', 'development'],
            ['food', 'systems'], ['value', 'chains'], ['smallholder', 'farmers']
        ]
    },
    {
        id: 'education-development',
        name: 'Education & Development',
        coreKeywords: [
            'education', 'training', 'learning', 'capacity building', 'curriculum',
            'teaching', 'academic', 'scholarship', 'skill development', 'knowledge management',
            'educational', 'school', 'university', 'literacy', 'numeracy', 'youth',
            'educación', 'capacitación', 'formación', 'aprendizaje', 'enseñanza',
            'escuela', 'universidad', 'académico', 'alfabetización', 'becas',
            'gestión de conocimiento', 'conocimiento', 'educativo', 'educativa',
            'brechas educativas', 'extraescolar',
            'éducation', 'formation', 'apprentissage', 'enseignement', 'école',
            'université', 'alphabétisation', 'académique',
            'educação', 'capacitação', 'formação', 'aprendizagem', 'ensino',
            'escola', 'universidade', 'alfabetização'
        ],
        supportKeywords: [
            'pedagogy', 'educational technology', 'e-learning', 'distance learning',
            'quality education', 'inclusive education', 'educational planning',
            'teacher training', 'educational assessment', 'learning outcomes',
            'pedagogía', 'tecnología educativa', 'educación a distancia'
        ],
        contextPairs: [
            ['capacity', 'building'], ['skill', 'development'], ['quality', 'education'],
            ['teacher', 'training'], ['educational', 'policy'], ['youth', 'development'],
            ['gestión', 'conocimiento'], ['brechas', 'educativas']
        ]
    },
    {
        id: 'social-affairs-human-rights',
        name: 'Social Affairs & Human Rights',
        coreKeywords: [
            'human rights', 'gender', 'women', 'equality', 'inclusion', 'diversity',
            'disability', 'social protection', 'empowerment', 'child protection',
            'marginalized', 'vulnerable', 'gender equality', 'women empowerment',
            'social inclusion', 'inclusive', 'equity', 'discrimination', 'social development',
            'foster care', 'child welfare', 'alternative care', 'orphan', 'orphans',
            'children with disabilities', 'child rights', 'family welfare',
            'social work', 'social worker', 'case management',
            'derechos humanos', 'género', 'mujeres', 'igualdad', 'inclusión', 'diversidad',
            'discapacidad', 'protección social', 'empoderamiento', 'protección infantil',
            'desarrollo social', 'cohesión social', 'inclusión social', 'equidad',
            'pueblos indígenas', 'juventud', 'niñez', 'adolescencia',
            'acogimiento familiar', 'bienestar infantil', 'trabajo social',
            'droits de l\'homme', 'genre', 'femmes', 'égalité', 'inclusion',
            'protection sociale', 'développement social', 'cohésion sociale',
            'protection de l\'enfance', 'placement familial', 'travail social',
            'direitos humanos', 'gênero', 'mulheres', 'igualdade', 'inclusão',
            'proteção social', 'desenvolvimento social',
            'acolhimento familiar', 'bem-estar infantil'
        ],
        supportKeywords: [
            'gender mainstreaming', 'women leadership', 'girls education',
            'gender-based violence', 'social cohesion', 'minority rights',
            'indigenous peoples', 'LGBTI', 'accessibility', 'social justice',
            'violencia de género', 'transversalización de género',
            'complex needs', 'vulnerable children', 'child development'
        ],
        contextPairs: [
            ['human', 'rights'], ['gender', 'equality'], ['women', 'empowerment'],
            ['social', 'inclusion'], ['gender', 'mainstreaming'], ['child', 'protection'],
            ['derechos', 'humanos'], ['cohesión', 'social'], ['desarrollo', 'social'],
            ['droits', 'homme']
        ]
    },
    {
        id: 'peace-security',
        name: 'Peace & Security',
        coreKeywords: [
            'peacekeeping', 'peacebuilding', 'political affairs', 'political officer',
            'political analysis', 'political advisor', 'conflict prevention',
            'mediation', 'conflict resolution', 'peace operations', 'security council',
            'disarmament', 'stabilization', 'ceasefire', 'DDR', 'security sector reform',
            'security risk', 'security management', 'security analyst', 'security analysis',
            'risk management', 'threat assessment', 'security assessment',
            'security officer', 'security coordinator', 'security advisor',
            'field security', 'staff security', 'crisis management',
            'sanctions', 'sanctions expert', 'sanctions regime', 'arms embargo',
            'firearms', 'weapons', 'UNODC', 'law enforcement', 'crime prevention',
            'counter-terrorism', 'terrorism', 'organized crime', 'drug trafficking',
            'paz', 'seguridad', 'mantenimiento de la paz', 'asuntos políticos',
            'gestión de riesgos de seguridad', 'análisis de seguridad',
            'armas', 'sanciones', 'prevención del delito',
            'paix', 'sécurité', 'maintien de la paix', 'affaires politiques',
            'gestion des risques de sécurité', 'analyse de sécurité',
            'sanctions', 'armes'
        ],
        supportKeywords: [
            'conflict analysis', 'peace processes', 'political dialogue', 'reconciliation',
            'transitional justice', 'election monitoring', 'political transition',
            'security assessment', 'peace agreement', 'political settlement',
            'threat analysis', 'security briefing', 'security training',
            'post-conflict', 'illicit', 'trafficking', 'border security'
        ],
        contextPairs: [
            ['political', 'affairs'], ['peace', 'operations'], ['conflict', 'prevention'],
            ['security', 'council'], ['peace', 'building'], ['political', 'analysis'],
            ['security', 'risk'], ['security', 'management'], ['risk', 'management'],
            ['sanctions', 'regime'], ['law', 'enforcement'], ['organized', 'crime']
        ]
    },
    {
        id: 'humanitarian-emergency',
        name: 'Humanitarian & Emergency',
        coreKeywords: [
            'humanitarian', 'emergency', 'crisis', 'disaster', 'response', 'relief',
            'refugee', 'UNHCR', 'recovery', 'resilience', 'humanitarian aid',
            'disaster risk reduction', 'emergency preparedness', 'humanitarian coordination',
            'humanitarian assistance', 'displacement', 'migration'
        ],
        supportKeywords: [
            'emergency response', 'disaster management', 'risk reduction', 'early warning',
            'contingency planning', 'protection', 'shelter', 'WASH',
            'logistics', 'humanitarian access', 'camp management'
        ],
        contextPairs: [
            ['humanitarian', 'assistance'], ['emergency', 'response'], ['disaster', 'relief'],
            ['humanitarian', 'coordination'], ['risk', 'reduction']
        ]
    },
    {
        id: 'governance-rule-of-law',
        name: 'Governance & Rule of Law',
        coreKeywords: [
            'governance', 'rule of law', 'elections', 'democracy',
            'democratic governance', 'public administration', 'institutional',
            'anti-corruption', 'transparency', 'accountability', 'public sector',
            'institutional development', 'public management', 'regulatory', 'legislative',
            'gobernanza', 'gobernabilidad', 'gobernabilidad democrática', 'estado de derecho',
            'elecciones', 'democracia', 'administración pública', 'institucional',
            'anticorrupción', 'transparencia', 'rendición de cuentas', 'sector público',
            'gestión pública', 'fortalecimiento institucional', 'gestión institucional',
            'contratación pública', 'compras públicas',
            'gouvernance', 'état de droit', 'élections', 'démocratie',
            'administration publique', 'transparence',
            'governança', 'estado de direito', 'eleições', 'democracia',
            'administração pública', 'transparência'
        ],
        supportKeywords: [
            'public policy', 'governance reform', 'institutional capacity',
            'public service', 'civil service', 'decentralization', 'local governance',
            'participatory governance', 'e-governance', 'regulatory framework',
            'reforma del estado', 'modernización del estado', 'servicio civil',
            'urban', 'urban planning', 'urban development', 'urban planner',
            'city planning', 'city-wide planning', 'regional planning',
            'territorial', 'land use', 'housing', 'human settlements',
            'slum upgrading', 'informal settlements', 'urbanization',
            'housing policy', 'housing policies', 'housing development',
            'urban governance', 'urban policy', 'land management',
            'desarrollo urbano', 'planificación territorial', 'ordenamiento territorial',
            'planificación urbana', 'asentamientos humanos', 'vivienda',
            'política de vivienda', 'políticas de vivienda', 'desarrollo habitacional'
        ],
        contextPairs: [
            ['democratic', 'governance'], ['public', 'administration'],
            ['good', 'governance'], ['institutional', 'strengthening'],
            ['gobernabilidad', 'democrática'], ['administración', 'pública'],
            ['contratación', 'pública'], ['gestión', 'pública'],
            ['urban', 'planning'], ['urban', 'development'], ['desarrollo', 'urbano'],
            ['planificación', 'territorial']
        ]
    },
    {
        id: 'legal-compliance',
        name: 'Legal & Compliance',
        coreKeywords: [
            'legal', 'lawyer', 'attorney', 'counsel', 'legal officer', 'legal advisor',
            'legal affairs', 'legal counsel', 'legal specialist', 'legal expert',
            'compliance', 'compliance officer', 'ethics', 'ethics officer',
            'international law', 'contract', 'contracts', 'contractual',
            'litigation', 'arbitration', 'dispute resolution', 'legal framework',
            'treaty', 'treaties', 'convention', 'conventions', 'legal analysis',
            'jurisprudence', 'legal review', 'legal services', 'legal support',
            'intellectual property', 'IP law', 'corporate law', 'labor law',
            'human rights law', 'humanitarian law', 'criminal law', 'civil law',
            'legal', 'abogado', 'jurídico', 'asesor legal', 'asesoría jurídica',
            'derecho', 'derecho internacional', 'derecho ambiental', 'derecho constitucional',
            'derecho administrativo', 'contrato', 'contratos', 'litigio', 'arbitraje',
            'cumplimiento', 'ética', 'normativo', 'regulatorio', 'legislativo',
            'asuntos legales', 'asuntos jurídicos', 'asuntos contenciosos', 'asuntos consultivos',
            'peritos', 'perito', 'juicios', 'jurisdicción', 'protocolo',
            'juridique', 'avocat', 'conseiller juridique', 'droit', 'droit international',
            'contrat', 'conformité', 'éthique',
            'jurídico', 'advogado', 'assessor jurídico', 'direito', 'direito internacional',
            'contrato', 'conformidade', 'ética'
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
            'investigation', 'misconduct', 'disciplinary', 'sanctions',
            'análisis normativo', 'elaboración de contratos', 'auditoría'
        ],
        contextPairs: [
            ['legal', 'officer'], ['legal', 'advisor'], ['legal', 'counsel'],
            ['legal', 'affairs'], ['international', 'law'], ['legal', 'framework'],
            ['compliance', 'officer'], ['ethics', 'officer'], ['legal', 'analysis'],
            ['contract', 'management'], ['legal', 'review'], ['due', 'diligence'],
            ['asuntos', 'jurídicos'], ['derecho', 'ambiental'], ['asuntos', 'contenciosos']
        ]
    },
    {
        id: 'economic-affairs-trade',
        name: 'Economic Affairs & Trade',
        coreKeywords: [
            'economic', 'development', 'finance', 'investment', 'trade', 'private sector',
            'entrepreneurship', 'market', 'financial inclusion', 'poverty reduction',
            'economic growth', 'microfinance', 'banking', 'financial services',
            'economic policy', 'fiscal', 'monetary', 'employment', 'job creation',
            'finance intern', 'finance assistant', 'finance officer', 'finance analyst',
            'financial analyst', 'budget analyst', 'budget officer', 'budget assistant',
            'treasury', 'treasurer', 'accounts', 'accounting', 'accountant',
            'financial management', 'financial reporting', 'financial planning',
            'finance and budget', 'finance and budget assistant', 'budget and finance',
            'financial officer', 'finance associate', 'budget associate',
            'economic research', 'economic analyst', 'research assistant', 'economic affairs',
            'statistics', 'statistical', 'statistician', 'statistics division',
            'statistical analysis', 'economic statistics', 'data statistician',
            'tax', 'taxation', 'tax policy', 'tax publications', 'international tax',
            'tax law', 'fiscal policy', 'revenue', 'customs',
            'economía', 'económico', 'desarrollo económico', 'investigación económica',
            'asistente de investigación', 'apoyo de investigación', 'análisis económico',
            'comercio', 'inversión', 'sector privado', 'emprendimiento', 'finanzas',
            'política industrial', 'cadenas de valor', 'insumo producto', 'matriz',
            'macroeconomía', 'microeconomía', 'reducción de pobreza', 'pobreza',
            'crecimiento económico', 'desarrollo productivo',
            'estadística', 'estadísticas', 'impuestos', 'tributario', 'fiscal',
            'économie', 'économique', 'développement économique', 'recherche économique',
            'commerce', 'investissement', 'politique industrielle',
            'statistique', 'statistiques', 'impôts', 'fiscal',
            'economia', 'econômico', 'desenvolvimento econômico', 'pesquisa econômica',
            'comércio', 'investimento', 'setor privado',
            'estatística', 'estatísticas', 'impostos'
        ],
        supportKeywords: [
            'sustainable development', 'inclusive growth', 'value chain', 'business development',
            'financial literacy', 'access to finance', 'economic empowerment',
            'livelihood', 'income generation', 'economic analysis', 'macroeconomic',
            'análisis de datos', 'estadística', 'modelación', 'prospectiva',
            'statistics', 'statistical', 'statistician', 'data analysis', 'quantitative',
            'statistical analysis', 'statistics division', 'economic statistics',
            'tax', 'taxation', 'fiscal', 'revenue', 'customs duties',
            'tax policy', 'tax publications', 'international tax',
            'pricing', 'pricing agent', 'cost analysis', 'price analysis',
            'market analysis', 'economic evaluation'
        ],
        contextPairs: [
            ['economic', 'development'], ['private', 'sector'], ['financial', 'inclusion'],
            ['poverty', 'reduction'], ['economic', 'growth'], ['job', 'creation'],
            ['desarrollo', 'económico'], ['investigación', 'económica'], ['análisis', 'económico'],
            ['cadenas', 'valor'], ['politique', 'industrielle'],
            ['statistics', 'division'], ['tax', 'policy'], ['price', 'analysis'],
            ['finance', 'intern'], ['finance', 'assistant'], ['finance', 'officer'],
            ['budget', 'analyst'], ['financial', 'management'], ['financial', 'analyst']
        ]
    },
    {
        id: 'policy-strategic-planning',
        name: 'Policy & Strategic Planning',
        coreKeywords: [
            'policy', 'strategy', 'planning', 'analysis', 'coordination', 'strategic planning',
            'policy development', 'policy analysis', 'strategic analysis', 'research',
            'policy research', 'strategic coordination', 'planning officer', 'policy officer',
            'project analyst', 'programme analyst', 'research analyst', 'analyst',
            'policy analyst', 'planning analyst', 'strategic analyst',
            'monitoring', 'evaluation', 'M&E', 'monitoreo', 'evaluación', 'monitoreo y evaluación',
            'monitoring and evaluation', 'programme monitoring', 'results-based management',
            'RBM', 'indicator', 'indicators', 'baseline', 'impact assessment', 'outcome',
            'política', 'políticas públicas', 'planificación estratégica', 'investigación',
            'análisis de políticas', 'coordinación estratégica', 'políticas',
            'plan de acción', 'seguimiento', 'indicadores', 'evaluación de impacto',
            'analista de proyecto', 'analista de programa',
            'politique', 'stratégie', 'planification', 'suivi', 'évaluation',
            'suivi et évaluation', 'politique publique', 'analyste',
            'política', 'estratégia', 'planejamento', 'monitoramento', 'avaliação',
            'analista de projeto', 'analista de programa'
        ],
        supportKeywords: [
            'policy coordination', 'strategic direction', 'policy implementation',
            'strategic initiatives', 'policy review', 'strategic assessment',
            'planning coordination', 'policy advisory', 'strategic advisory',
            'programme evaluation', 'project evaluation', 'evidence-based', 'learning',
            'resultados', 'planificación', 'gestión basada en resultados'
        ],
        contextPairs: [
            ['policy', 'development'], ['strategic', 'planning'], ['policy', 'analysis'],
            ['strategic', 'analysis'], ['policy', 'coordination'],
            ['monitoring', 'evaluation'], ['monitoreo', 'evaluación'], ['suivi', 'évaluation'],
            ['políticas', 'públicas'], ['plan', 'acción']
        ]
    },
    {
        id: 'communications-partnerships',
        name: 'Communications & Partnerships',
        coreKeywords: [
            'communication', 'communications', 'advocacy', 'media', 'public information',
            'outreach', 'awareness', 'campaign', 'social media', 'journalism', 'partnership',
            'public relations', 'stakeholder engagement', 'knowledge sharing',
            'partnerships', 'donor relations', 'resource mobilization',
            'grants', 'grants coordinator', 'grants manager', 'grants officer',
            'fundraising', 'fund raising', 'donor', 'donors', 'proposal writing',
            'graphic design', 'graphic designer', 'visual communication', 'creative',
            'adobe', 'illustrator', 'photoshop', 'design', 'branding',
            'comunicación', 'comunicaciones', 'incidencia', 'medios', 'información pública',
            'difusión', 'sensibilización', 'campaña', 'redes sociales', 'alianzas',
            'relaciones públicas', 'movilización de recursos', 'donantes', 'asociaciones',
            'subvenciones', 'diseño gráfico',
            'communication', 'plaidoyer', 'médias', 'sensibilisation', 'partenariat',
            'partenariats', 'mobilisation des ressources', 'relations publiques',
            'conception graphique', 'subventions',
            'comunicação', 'mídia', 'parceria', 'parcerias', 'mobilização de recursos',
            'design gráfico', 'subsídios'
        ],
        supportKeywords: [
            'strategic communication', 'behavior change', 'social mobilization',
            'community engagement', 'multimedia', 'digital communication',
            'advocacy strategy', 'messaging', 'storytelling', 'fundraising',
            'comunicación estratégica', 'cambio de comportamiento', 'movilización social',
            'digital media', 'media support', 'social media management', 'content creation',
            'video production', 'photography', 'videography', 'multimedia production',
            'web content', 'digital content', 'online communication'
        ],
        contextPairs: [
            ['strategic', 'communication'], ['public', 'information'], ['social', 'media'],
            ['stakeholder', 'engagement'], ['advocacy', 'campaign'],
            ['movilización', 'recursos'], ['relaciones', 'públicas'],
            ['digital', 'media'], ['media', 'support'], ['content', 'creation']
        ]
    },
    {
        id: 'operations-administration',
        name: 'Operations & Administration',
        coreKeywords: [
            'administrative', 'administration', 'administrative support', 'staff assistant',
            'office management', 'HR', 'human resources', 'human resource', 'finance', 'procurement',
            'facilities', 'travel', 'support', 'operational', 'budget management',
            'financial analysis', 'budget', 'financial management', 'accounting',
            'human resource assistant', 'HR assistant', 'recruitment assistant',
            'personnel', 'staffing', 'talent acquisition',
            'team assistant', 'office assistant', 'clerk', 'filing clerk',
            'administrative assistant', 'executive assistant', 'personal assistant',
            'programme assistant', 'project assistant', 'programme associate', 'project associate',
            'programme officer', 'project officer', 'programme manager', 'project manager',
            'programme support', 'project support', 'programme coordination', 'project coordination',
            'fitness instructor', 'fitness', 'gym', 'recreation', 'wellness',
            'firefighter', 'fire fighter', 'fire safety', 'sapeur-pompier', 'pompier',
            'security assistant', 'security guard', 'security officer',
            'mason', 'carpenter', 'electrician', 'plumber', 'maintenance worker',
            'cleaner', 'janitor', 'custodian', 'building services',
            'asistente de proyecto', 'asociado de proyecto', 'asistente administrativo',
            'gestión de proyectos', 'gestión administrativa', 'gestión financiera',
            'auxiliar administrativo', 'auxiliar operativo', 'coordinador de proyecto',
            'apoyo administrativo', 'apoyo de proyecto', 'recursos humanos', 'adquisiciones',
            'presupuesto', 'contabilidad', 'planificación presupuestaria', 'gestión de recursos',
            'asistente de seguridad', 'instructor de fitness',
            'assistant de programme', 'associé de programme', 'assistant administratif',
            'gestion de projet', 'gestion administrative', 'gestion financière',
            'ressources humaines', 'approvisionnement', 'budget',
            'assistant de sécurité', 'sécurité',
            'assistente de projeto', 'associado de projeto', 'assistente administrativo',
            'gestão de projetos', 'gestão administrativa', 'gestão financeira',
            'recursos humanos', 'aquisições', 'orçamento'
        ],
        supportKeywords: [
            'project management', 'resource management', 'vendor management',
            'contract management', 'quality assurance', 'compliance',
            'business continuity', 'risk management', 'asset management',
            'control documental', 'seguimiento', 'logística', 'eventos', 'viajes',
            'elaboración de informes', 'elaboración de contratos', 'archivo',
            'conference', 'conference services', 'meeting services', 'event management',
            'conference assistant', 'meeting coordination', 'event coordination',
            'archivist', 'archives', 'archival', 'records management', 'documentation',
            'filing', 'document management', 'record keeping', 'processing archivist',
            'library', 'librarian', 'information management', 'archiving',
            'HVAC', 'heating', 'ventilation', 'air conditioning', 'refrigeration',
            'facility', 'facilities', 'maintenance', 'building', 'construction',
            'mason', 'masonry', 'carpentry', 'plumbing', 'electrical',
            'fire safety', 'firefighter', 'security guard', 'security officer',
            'fitness instructor', 'gym', 'recreation', 'cleaner', 'janitor',
            'civil engineering', 'mechanical engineering', 'electrical engineering',
            'engineer', 'engineering', 'architect', 'architecture', 'infrastructure',
            'electrical engineer', 'mechanical engineer', 'construction management',
            'site supervision', 'construction project', 'site engineer',
            'solar system', 'solar', 'installation', 'technician',
            'electrical mechanical', 'long term agreement',
            'vehicle technician', 'vehicle maintenance', 'mechanic', 'automotive',
            'heavy equipment', 'equipment repair', 'machinery', 'forklift',
            'refurbishment', 'vehicle repair', 'equipment maintenance',
            'heavy-duty', 'truck', 'excavator', 'bulldozer', 'crane',
            'lifeguard', 'swimming instructor', 'swimming', 'pool', 'aquatic',
            'recreation officer', 'sports', 'athletics', 'physical training',
            'aquatic safety', 'wellness', 'fitness',
            'sapeur-pompier', 'pompier', 'sécurité', 'maçon', 'ingénieur civil',
            'chauffage', 'climatisation', 'archiviste',
            'technicien véhicule', 'maître-nageur', 'instructeur de natation',
            'ingeniero eléctrico', 'ingeniero mecánico', 'técnico de vehículos',
            'salvavidas', 'instructor de natación', 'mantenimiento de equipos',
            'safety', 'sécurité incendie', 'gestion des interventions'
        ],
        contextPairs: [
            ['human', 'resources'], ['project', 'management'], ['budget', 'management'],
            ['operations', 'management'], ['facility', 'management'],
            ['gestión', 'proyectos'], ['gestión', 'administrativa'], ['recursos', 'humanos'],
            ['programme', 'assistant'], ['project', 'associate'], ['programme', 'support'],
            ['civil', 'engineering'], ['building', 'maintenance'], ['fire', 'safety'],
            ['conference', 'services'], ['records', 'management'], ['air', 'conditioning']
        ]
    },
    {
        id: 'supply-chain-logistics',
        name: 'Supply Chain & Logistics',
        coreKeywords: [
            'logistics', 'supply chain', 'supply', 'warehouse', 'distribution',
            'fleet management', 'transport', 'shipping', 'freight', 'customs',
            'inventory', 'procurement logistics', 'supply planning', 'logistics coordination',
            'driver', 'chauffeur', 'vehicle', 'transport officer', 'fleet',
            'conductor', 'chofer', 'logística', 'cadena de suministro', 'almacén',
            'distribución', 'transporte', 'inventario', 'flota',
            'chauffeur', 'conducteur', 'logistique', 'chaîne d\'approvisionnement',
            'transport', 'entrepôt', 'distribution',
            'motorista', 'logística', 'cadeia de suprimentos', 'transporte'
        ],
        supportKeywords: [
            'vendor management', 'supplier relations', 'inventory management',
            'distribution management', 'transportation management', 'warehousing',
            'logistics planning', 'demand planning', 'cold chain', 'humanitarian logistics',
            'vehicle maintenance', 'road safety', 'defensive driving', 'GPS navigation',
            'fleet maintenance', 'vehicle technician', 'mechanic', 'automotive',
            'heavy equipment', 'equipment repair', 'refurbishment'
        ],
        contextPairs: [
            ['supply', 'chain'], ['supply', 'management'], ['logistics', 'coordination'],
            ['fleet', 'management'], ['distribution', 'management'],
            ['vehicle', 'maintenance'], ['cadena', 'suministro']
        ]
    },
    {
        id: 'translation-interpretation',
        name: 'Translation & Interpretation',
        coreKeywords: [
            'translator', 'interpreter', 'translation', 'interpretation', 'linguistic',
            'language', 'bilingual', 'multilingual', 'localization', 'linguist',
            'language specialist', 'consecutive interpretation', 'simultaneous interpretation'
        ],
        supportKeywords: [
            'language skills', 'fluency', 'native speaker', 'language proficiency',
            'cultural adaptation', 'terminology', 'glossary', 'translation memory',
            'linguistic review', 'proofreading', 'transcription'
        ],
        contextPairs: [
            ['language', 'services'], ['translation', 'interpretation'], ['linguistic', 'support'],
            ['language', 'specialist'], ['consecutive', 'interpretation']
        ]
    }
];
const LEADERSHIP_GRADES = ['D-2', 'D2', 'D-1', 'D1', 'ASG', 'USG', 'SG', 'DSG', 'P5', 'P6', 'P7'];
const LEADERSHIP_TITLE_INDICATORS = [
    'resident coordinator', 'country director', 'regional director',
    'deputy director general', 'assistant director general', 'director general',
    'assistant secretary-general', 'under-secretary-general', 'secretary-general',
    'executive secretary', 'administrator', 'high commissioner',
    'special representative', 'deputy special representative'
];
class JobClassificationService {
    classifyJob(job) {
        const scores = new Map();
        const reasoning = [];
        const titleLower = (job.title || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        const labelsLower = (job.job_labels || '').toLowerCase();
        const combinedText = `${titleLower} ${descLower} ${labelsLower}`;
        if (this.isLeadershipPosition(job.up_grade, job.title)) {
            return {
                primary: 'leadership-executive',
                confidence: 95,
                secondary: [],
                reasoning: ['Classified as leadership based on grade or title pattern']
            };
        }
        for (const category of JOB_CLASSIFICATION_DICTIONARY) {
            let score = 0;
            for (const keyword of category.coreKeywords) {
                if (titleLower.includes(keyword.toLowerCase())) {
                    score += 30;
                    reasoning.push(`Title contains "${keyword}" for ${category.name}`);
                }
                else if (labelsLower.includes(keyword.toLowerCase())) {
                    score += 15;
                }
                else if (descLower.includes(keyword.toLowerCase())) {
                    score += 5;
                }
            }
            for (const keyword of category.supportKeywords) {
                if (combinedText.includes(keyword.toLowerCase())) {
                    score += 3;
                }
            }
            for (const pair of category.contextPairs) {
                if (pair && pair.length >= 2) {
                    const word1 = pair[0];
                    const word2 = pair[1];
                    if (word1 && word2 && combinedText.includes(word1.toLowerCase()) && combinedText.includes(word2.toLowerCase())) {
                        score += 10;
                    }
                }
            }
            if (score > 0) {
                scores.set(category.id, score);
            }
        }
        const sortedScores = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1]);
        if (sortedScores.length === 0) {
            return {
                primary: 'operations-administration',
                confidence: 30,
                secondary: [],
                reasoning: ['No strong category match found, defaulting to Operations']
            };
        }
        const topEntry = sortedScores[0];
        const topScore = topEntry ? topEntry[1] : 0;
        const maxPossible = 100;
        const confidence = Math.min(95, Math.round((topScore / maxPossible) * 100));
        const secondary = sortedScores.slice(1, 4).map(entry => ({
            category: entry[0],
            confidence: Math.round((entry[1] / maxPossible) * 100)
        }));
        return {
            primary: topEntry ? topEntry[0] : 'operations-administration',
            confidence,
            secondary,
            reasoning: reasoning.slice(0, 5)
        };
    }
    isLeadershipPosition(grade, title) {
        if (grade) {
            const gradeUpper = grade.toUpperCase().trim();
            if (['ASG', 'USG', 'SG', 'DSG'].includes(gradeUpper))
                return true;
            if (/^D[-]?[12]$/.test(gradeUpper))
                return true;
            if (gradeUpper === 'NOD')
                return true;
            const pMatch = gradeUpper.match(/^P[-]?([0-9]+)$/);
            if (pMatch && pMatch[1] && parseInt(pMatch[1]) >= 5)
                return true;
            const psaMatch = gradeUpper.match(/^(N)?PSA[-]?([0-9]+)$/);
            if (psaMatch && psaMatch[2] && parseInt(psaMatch[2]) >= 10)
                return true;
        }
        const titleLower = (title || '').toLowerCase();
        return LEADERSHIP_TITLE_INDICATORS.some(indicator => titleLower.includes(indicator));
    }
    getSeniorityLevel(grade, title) {
        if (!grade)
            return 'Unknown';
        const gradeUpper = grade.toUpperCase().trim();
        if (['ASG', 'USG', 'SG', 'DSG'].includes(gradeUpper))
            return 'Executive';
        if (/^D[-]?[12]$/.test(gradeUpper))
            return 'Executive';
        const pMatch = gradeUpper.match(/^P[-]?([0-9]+)$/);
        if (pMatch && pMatch[1]) {
            const level = parseInt(pMatch[1]);
            if (level >= 5)
                return 'Senior';
            if (level >= 3)
                return 'Mid-Level';
            return 'Entry';
        }
        if (gradeUpper.startsWith('NO')) {
            if (gradeUpper === 'NOD')
                return 'Senior';
            if (gradeUpper === 'NOC')
                return 'Mid-Level';
            return 'Entry';
        }
        if (gradeUpper.startsWith('G') || gradeUpper.startsWith('GS')) {
            const gsMatch = gradeUpper.match(/[GS][-]?([0-9]+)/);
            if (gsMatch && gsMatch[1]) {
                const level = parseInt(gsMatch[1]);
                if (level >= 6)
                    return 'Senior';
                if (level >= 4)
                    return 'Mid-Level';
                return 'Entry';
            }
        }
        if (gradeUpper.includes('INTERN'))
            return 'Intern';
        if (gradeUpper.includes('CONSULT'))
            return 'Consultant';
        if (gradeUpper.includes('UNV') || gradeUpper.includes('VOLUNTEER'))
            return 'Volunteer';
        return 'Unknown';
    }
    getCategoryById(id) {
        return JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === id);
    }
    getAllCategories() {
        return JOB_CLASSIFICATION_DICTIONARY;
    }
}
exports.JobClassificationService = JobClassificationService;
exports.default = JobClassificationService;
//# sourceMappingURL=JobClassificationService.js.map