"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgencyLogo = getAgencyLogo;
exports.getAgencyLogoAbsolutePath = getAgencyLogoAbsolutePath;
exports.getAgencyColor = getAgencyColor;
const AGENCY_LOGO_MAP = {
    'UNDP': 'UNDP.png',
    'UNICEF': 'UNICEF.png',
    'UNHCR': 'UNHCR.png',
    'WFP': 'WFP.png',
    'WHO': 'WHO.png',
    'UNESCO': 'UNESCO.png',
    'UNFPA': 'UNFPA.png',
    'UNEP': 'UNEP.png',
    'FAO': 'FAO.png',
    'ILO': 'ILO.png',
    'IFAD': 'IFAD.png',
    'ICAO': 'ICAO.png',
    'UPU': 'UPU.png',
    'ITC': 'ITC.png',
    'UNCDF': 'UNCDF.png',
    'UNCTAD': 'UNCTAD.png',
    'UNOCHA': 'UNOCHA.png',
    'UNODC': 'UNODC.png',
    'UNRWA': 'UNRWA.png',
    'UN Women': 'UNWomen.png',
    'UNWomen': 'UNWomen.png',
    'UN Volunteers': 'UNVolunteers.png',
    'UNVolunteers': 'UNVolunteers.png',
    'UN-Habitat': 'UN-Habitat.png',
    'UNOHCHR': 'UNOHCHR.png',
    'UNICRI': 'UNICRI.png',
    'UNJSPF': 'UNJSPF.png',
    'UNAMA': 'UNAMA.png',
    'UNGC': 'UNGC.png',
    'UN Secretariat': 'UN.png',
    'UNOG': 'UNOG.png',
    'UNON': 'UNON.png',
    'UNOV': 'UNOV.png',
    'DESA': 'DESA.png',
    'DGC': 'DGC.png',
    'DOS': 'DOS.png',
    'DPO': 'DPO.png',
    'DPPA': 'DPPA.png',
    'OICT': 'OICT.png',
    'OIOS': 'OIOS.png',
    'ECA': 'ECA.png',
    'ECE': 'ECE.png',
    'ECLAC': 'ECLAC.png',
    'ESCAP': 'ESCAP.png',
    'ESCWA': 'ESCWA.png',
    'ECOSOC': 'ECOSOC.png',
    'International Court of Justice': 'International Court of Justice.png',
};
function getAgencyLogo(agencyName) {
    if (!agencyName)
        return null;
    const logoFile = AGENCY_LOGO_MAP[agencyName];
    if (logoFile) {
        return `/logo/logo/${logoFile}`;
    }
    const keys = Object.keys(AGENCY_LOGO_MAP);
    for (const key of keys) {
        if (agencyName.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(agencyName.toLowerCase())) {
            return `/logo/logo/${AGENCY_LOGO_MAP[key]}`;
        }
    }
    if (agencyName.toLowerCase().includes('secretariat') ||
        agencyName.toLowerCase().includes('united nations')) {
        return '/logo/logo/UN.png';
    }
    return null;
}
function getAgencyLogoAbsolutePath(agencyName, publicDir) {
    const relativePath = getAgencyLogo(agencyName);
    if (!relativePath)
        return null;
    return `${publicDir}${relativePath}`;
}
function getAgencyColor(agencyName) {
    const colors = {
        'UNDP': { primary: '#0468B1', secondary: '#1A9AD8' },
        'UNICEF': { primary: '#1CABE2', secondary: '#00AEEF' },
        'UNHCR': { primary: '#0072BC', secondary: '#00A3E0' },
        'WFP': { primary: '#E51937', secondary: '#F7941D' },
        'WHO': { primary: '#009EDB', secondary: '#00A3A3' },
        'UNESCO': { primary: '#006EB5', secondary: '#00B2A9' },
        'UNFPA': { primary: '#FF6B00', secondary: '#FDB714' },
        'UNEP': { primary: '#00A651', secondary: '#8DC63F' },
        'FAO': { primary: '#006B3F', secondary: '#87C540' },
        'ILO': { primary: '#002F6C', secondary: '#4A90A4' },
    };
    for (const [key, color] of Object.entries(colors)) {
        if (agencyName.toLowerCase().includes(key.toLowerCase())) {
            return color;
        }
    }
    return { primary: '#009EDB', secondary: '#1A9AD8' };
}
//# sourceMappingURL=agencyLogos.js.map