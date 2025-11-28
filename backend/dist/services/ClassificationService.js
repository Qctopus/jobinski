"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificationService = void 0;
const JOB_CLASSIFICATION_DICTIONARY = [
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
        ]
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
            'innovation', 'platform', 'system', 'database', 'web', 'mobile', 'app',
            'technical', 'coding', 'algorithm', 'API', 'integration', 'infrastructure',
            'DevOps', 'agile', 'scrum', 'user experience', 'UX', 'UI', 'digital literacy',
            'e-governance', 'smart city', 'IoT', 'internet of things'
        ],
        contextPairs: [
            ['data', 'analysis'], ['digital', 'transformation'], ['IT', 'systems'],
            ['software', 'development'], ['cyber', 'security'], ['machine', 'learning'],
            ['artificial', 'intelligence'], ['cloud', 'computing'], ['big', 'data']
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
    },
    {
        id: 'peace-security',
        name: 'Peace & Security',
        description: 'Peacekeeping, political affairs, disarmament, security sector reform, conflict prevention',
        color: '#1E40AF',
        coreKeywords: [
            'peace', 'security', 'peacekeeping', 'peacebuilding', 'political affairs',
            'political analysis', 'political officer', 'political advisor', 'conflict prevention',
            'mediation', 'conflict resolution', 'peace operations', 'security council',
            'disarmament', 'stabilization', 'ceasefire', 'DDR', 'security sector reform',
            'political reporting', 'political coordination', 'political research', 'military',
            'police', 'uniformed personnel'
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
        ]
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
        ]
    },
    {
        id: 'governance-rule-of-law',
        name: 'Governance & Rule of Law',
        description: 'Democratic governance, justice, rule of law, elections, public administration',
        color: '#6366F1',
        coreKeywords: [
            'governance', 'rule of law', 'justice', 'elections', 'democracy',
            'democratic governance', 'public administration', 'institutional',
            'anti-corruption', 'transparency', 'accountability', 'public sector',
            'institutional development', 'public management', 'regulatory', 'legislative',
            'electoral', 'judicial', 'courts', 'justice sector'
        ],
        supportKeywords: [
            'public policy', 'governance reform', 'institutional capacity',
            'public service', 'civil service', 'decentralization', 'local governance',
            'participatory governance', 'e-governance', 'regulatory framework',
            'institutional strengthening', 'good governance', 'government relations',
            'electoral assistance', 'justice reform'
        ],
        contextPairs: [
            ['rule', 'law'], ['democratic', 'governance'], ['public', 'administration'],
            ['good', 'governance'], ['institutional', 'strengthening'], ['governance', 'reform'],
            ['public', 'sector'], ['justice', 'sector'], ['electoral', 'assistance']
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
    }
];
const LEADERSHIP_GRADES = [
    'D-2', 'D2', 'D-1', 'D1', 'ASG', 'USG', 'SG', 'DSG', 'P5', 'P6', 'P7'
];
function isLeadershipGrade(grade) {
    if (!grade)
        return false;
    const gradeUpper = grade.toUpperCase().trim();
    if (['ASG', 'USG', 'SG', 'DSG'].includes(gradeUpper))
        return true;
    if (gradeUpper.match(/^D[-]?[12]$/))
        return true;
    if (gradeUpper === 'NOD')
        return true;
    const pMatch = gradeUpper.match(/^P[-]?([0-9]+)$/);
    if (pMatch) {
        const pLevel = parseInt(pMatch[1] || '0');
        return pLevel >= 5 && pLevel <= 7;
    }
    const psaMatch = gradeUpper.match(/^PSA[-]?([0-9]+)$/);
    if (psaMatch) {
        const psaLevel = parseInt(psaMatch[1] || '0');
        return psaLevel >= 10;
    }
    const npsaMatch = gradeUpper.match(/^NPSA[-]?([0-9]+)$/);
    if (npsaMatch) {
        const npsaLevel = parseInt(npsaMatch[1] || '0');
        return npsaLevel >= 10;
    }
    return false;
}
const LEADERSHIP_TITLE_INDICATORS = [
    'resident coordinator', 'country director', 'regional director',
    'deputy director general', 'assistant director general', 'director general',
    'assistant secretary-general', 'under-secretary-general', 'secretary-general',
    'executive secretary', 'administrator', 'high commissioner',
    'special representative', 'deputy special representative'
];
const STOP_WORDS = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'a', 'an', 'as', 'if', 'when',
    'where', 'why', 'how', 'what', 'who', 'which', 'than', 'so', 'very', 'just'
]);
class ClassificationService {
    static getInstance() {
        if (!ClassificationService.instance) {
            ClassificationService.instance = new ClassificationService();
        }
        return ClassificationService.instance;
    }
    classifyJob(job) {
        const startTime = Date.now();
        try {
            const content = this.extractJobContent(job);
            const leadershipOverride = this.checkLeadershipOverride(job, content);
            if (leadershipOverride && leadershipOverride.isLeadership) {
                const result = this.createResult('leadership-executive', 95, content, [`Leadership override: ${leadershipOverride.reason}`]);
                console.log(`Job classified via leadership override in ${Date.now() - startTime}ms: leadership-executive (95%)`);
                return result;
            }
            const categoryScores = this.scoreAllCategories(content);
            const sortedScores = categoryScores.sort((a, b) => b.score - a.score);
            const primaryCategory = sortedScores[0];
            const secondaryCategories = sortedScores.slice(1, 3)
                .filter(s => s.score > 30)
                .map(s => ({
                category: s.categoryId,
                confidence: Math.round(s.score)
            }));
            const flags = this.generateFlags(sortedScores, content);
            const reasoning = this.generateReasoning(primaryCategory, content);
            const result = {
                primary: primaryCategory?.categoryId || 'Other',
                confidence: Math.round(primaryCategory?.score || 0),
                secondary: secondaryCategories,
                reasoning,
                flags
            };
            console.log(`Job classified via keyword scoring in ${Date.now() - startTime}ms: ${primaryCategory?.categoryId || 'Other'} (${result.confidence}%)`);
            return result;
        }
        catch (error) {
            console.error('Classification failed:', error);
            return this.createFallbackResult();
        }
    }
    checkLeadershipOverride(job, content) {
        if (job.up_grade && job.up_grade.trim()) {
            if (isLeadershipGrade(job.up_grade)) {
                return { isLeadership: true, reason: `Leadership grade ${job.up_grade} detected` };
            }
            else {
                return null;
            }
        }
        const titleText = content.title.toLowerCase();
        for (const indicator of LEADERSHIP_TITLE_INDICATORS) {
            if (titleText.includes(indicator.toLowerCase())) {
                return { isLeadership: true, reason: `Leadership title "${indicator}" detected` };
            }
        }
        return null;
    }
    createResult(category, confidence, content, reasoning) {
        return {
            primary: category,
            confidence,
            secondary: [],
            reasoning,
            flags: {
                ambiguous: false,
                lowConfidence: confidence < 40,
                emergingTerms: [],
                hybridCandidate: false
            }
        };
    }
    extractJobContent(job) {
        const title = (job.title || '').toLowerCase();
        const description = (job.description || '').toLowerCase();
        const jobLabels = (job.job_labels || '').split(',').map(label => label.trim().toLowerCase());
        const combined = `${title} ${description} ${jobLabels.join(' ')}`;
        return { title, description, jobLabels, combined };
    }
    scoreAllCategories(content) {
        return JOB_CLASSIFICATION_DICTIONARY.map(category => {
            const score = this.scoreCategory(category, content);
            const matches = this.findMatches(category, content);
            return {
                categoryId: category.id,
                score,
                matches
            };
        });
    }
    scoreCategory(category, content) {
        let score = 0;
        category.coreKeywords.forEach((keyword) => {
            const count = this.countKeywordOccurrences(keyword, content.combined);
            if (count > 0) {
                score += count * 40;
            }
        });
        category.supportKeywords.forEach((keyword) => {
            const count = this.countKeywordOccurrences(keyword, content.combined);
            if (count > 0) {
                score += count * 20;
            }
        });
        category.contextPairs.forEach((pair) => {
            if (pair.length === 2) {
                const [word1, word2] = pair;
                if (content.combined.includes(word1) && content.combined.includes(word2)) {
                    score += 25;
                }
            }
        });
        category.coreKeywords.forEach((keyword) => {
            if (content.title.includes(keyword)) {
                score += 20;
            }
        });
        return Math.max(0, Math.min(100, score));
    }
    countKeywordOccurrences(keyword, text) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }
    findMatches(category, content) {
        const matches = [];
        category.coreKeywords.forEach((keyword) => {
            if (content.combined.includes(keyword)) {
                matches.push(`core:${keyword}`);
            }
        });
        category.supportKeywords.forEach((keyword) => {
            if (content.combined.includes(keyword)) {
                matches.push(`support:${keyword}`);
            }
        });
        return matches.slice(0, 10);
    }
    generateFlags(sortedScores, content) {
        const flags = {};
        if (sortedScores[0].score < 40) {
            flags.lowConfidence = true;
        }
        if (sortedScores.length > 1 && sortedScores[1].score > 60) {
            flags.ambiguous = true;
        }
        const words = content.combined.split(/\s+/)
            .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
            .slice(0, 20);
        const knownWords = new Set();
        JOB_CLASSIFICATION_DICTIONARY.forEach(cat => {
            cat.coreKeywords.forEach(keyword => knownWords.add(keyword));
            cat.supportKeywords.forEach(keyword => knownWords.add(keyword));
        });
        const emergingTerms = words.filter((word) => !knownWords.has(word));
        if (emergingTerms.length > 3) {
            flags.emergingTerms = emergingTerms.slice(0, 5);
        }
        return flags;
    }
    generateReasoning(primaryCategory, content) {
        const reasoning = [];
        const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === primaryCategory.categoryId);
        if (category) {
            reasoning.push(`Classified as ${category.name} based on keyword analysis`);
            if (primaryCategory.score > 80) {
                reasoning.push('High confidence classification with strong keyword matches');
            }
            else if (primaryCategory.score > 60) {
                reasoning.push('Moderate confidence classification');
            }
            else {
                reasoning.push('Low confidence classification - manual review recommended');
            }
        }
        return reasoning;
    }
    createFallbackResult() {
        return {
            primary: 'operations-administration',
            confidence: 25,
            secondary: [],
            reasoning: ['Fallback classification due to processing error'],
            flags: { lowConfidence: true, ambiguous: false, emergingTerms: [], hybridCandidate: false }
        };
    }
}
exports.ClassificationService = ClassificationService;
//# sourceMappingURL=ClassificationService.js.map