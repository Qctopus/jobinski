/**
 * ICSC Hardship Duty Station Classifications
 * Effective January 2025
 * 
 * Classification Levels:
 * - H = Headquarters locations (no hardship)
 * - A = Minimal hardship
 * - B = Low hardship
 * - C = Moderate hardship
 * - D = High hardship
 * - E = Extreme hardship (most difficult duty stations)
 */

export type HardshipClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'U';

export interface DutyStationClassification {
  station: string;
  country: string;
  hardshipClass: HardshipClass;
}

// Hardship colors for visualization
export const HARDSHIP_COLORS: Record<HardshipClass, string> = {
  'A': '#10B981', // Green - Minimal
  'B': '#3B82F6', // Blue - Low
  'C': '#F59E0B', // Amber - Moderate
  'D': '#F97316', // Orange - High
  'E': '#EF4444', // Red - Extreme
  'H': '#6B7280', // Gray - HQ (no hardship)
  'U': '#9CA3AF', // Light Gray - Unclassified
};

export const HARDSHIP_LABELS: Record<HardshipClass, string> = {
  'A': 'Minimal Hardship',
  'B': 'Low Hardship',
  'C': 'Moderate Hardship',
  'D': 'High Hardship',
  'E': 'Extreme Hardship',
  'H': 'Headquarters',
  'U': 'Unclassified',
};

export const HARDSHIP_SHORT_LABELS: Record<HardshipClass, string> = {
  'A': 'Class A',
  'B': 'Class B',
  'C': 'Class C',
  'D': 'Class D',
  'E': 'Class E',
  'H': 'HQ',
  'U': 'N/A',
};

// Complete ICSC duty station classifications
// Key format: "station_name" in lowercase
// Country is stored for context
export const ICSC_CLASSIFICATIONS: Map<string, { country: string; hardshipClass: HardshipClass }> = new Map([
  // AFGHANISTAN - All E
  ['bamyan', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['faizabad', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['gardez', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['herat', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['jalalabad', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['kabul', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['kandahar', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['khowst', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['kunduz', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['lashkar gah', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['maymana', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['faryab', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['mazar-i-sharif', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['mazar i sharif', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['pul-i-kumri', { country: 'Afghanistan', hardshipClass: 'E' }],
  ['tirinkot', { country: 'Afghanistan', hardshipClass: 'E' }],
  
  // ALBANIA
  ['tirana', { country: 'Albania', hardshipClass: 'A' }],
  
  // ALGERIA
  ['algiers', { country: 'Algeria', hardshipClass: 'A' }],
  ['tindouf', { country: 'Algeria', hardshipClass: 'E' }],
  
  // ANGOLA
  ['benguela', { country: 'Angola', hardshipClass: 'C' }],
  ['dundo', { country: 'Angola', hardshipClass: 'D' }],
  ['luanda', { country: 'Angola', hardshipClass: 'B' }],
  
  // ANTIGUA AND BARBUDA
  ['st. johns', { country: 'Antigua and Barbuda', hardshipClass: 'A' }],
  ['st johns', { country: 'Antigua and Barbuda', hardshipClass: 'A' }],
  
  // ARGENTINA
  ['buenos aires', { country: 'Argentina', hardshipClass: 'A' }],
  
  // ARMENIA
  ['yerevan', { country: 'Armenia', hardshipClass: 'A' }],
  
  // ARUBA
  ['oranjestad', { country: 'Aruba', hardshipClass: 'A' }],
  
  // AZERBAIJAN
  ['baku', { country: 'Azerbaijan', hardshipClass: 'A' }],
  
  // BAHAMAS
  ['nassau', { country: 'Bahamas', hardshipClass: 'A' }],
  
  // BAHRAIN
  ['manama', { country: 'Bahrain', hardshipClass: 'A' }],
  
  // BANGLADESH
  ['bhasan char', { country: 'Bangladesh', hardshipClass: 'E' }],
  ["cox's bazaar", { country: 'Bangladesh', hardshipClass: 'D' }],
  ['cox bazar', { country: 'Bangladesh', hardshipClass: 'D' }],
  ['coxs bazaar', { country: 'Bangladesh', hardshipClass: 'D' }],
  ['dhaka', { country: 'Bangladesh', hardshipClass: 'C' }],
  ['rangpur', { country: 'Bangladesh', hardshipClass: 'C' }],
  
  // BARBADOS
  ['bridgetown', { country: 'Barbados', hardshipClass: 'A' }],
  
  // BELARUS
  ['minsk', { country: 'Belarus', hardshipClass: 'A' }],
  
  // BELIZE
  ['belize city', { country: 'Belize', hardshipClass: 'A' }],
  ['belmopan', { country: 'Belize', hardshipClass: 'A' }],
  
  // BENIN
  ['cotonou', { country: 'Benin', hardshipClass: 'B' }],
  ['natitingou', { country: 'Benin', hardshipClass: 'C' }],
  
  // BHUTAN
  ['thimphu', { country: 'Bhutan', hardshipClass: 'C' }],
  
  // BOLIVIA
  ['la paz', { country: 'Bolivia', hardshipClass: 'A' }],
  
  // BOSNIA AND HERZEGOVINA
  ['sarajevo', { country: 'Bosnia and Herzegovina', hardshipClass: 'A' }],
  
  // BOTSWANA
  ['dukwi', { country: 'Botswana', hardshipClass: 'D' }],
  ['gaberone', { country: 'Botswana', hardshipClass: 'A' }],
  ['gaborone', { country: 'Botswana', hardshipClass: 'A' }],
  
  // BRAZIL
  ['boa vista', { country: 'Brazil', hardshipClass: 'B' }],
  ['brasilia', { country: 'Brazil', hardshipClass: 'A' }],
  ['manaus', { country: 'Brazil', hardshipClass: 'A' }],
  ['rio de janeiro', { country: 'Brazil', hardshipClass: 'A' }],
  ['sao paulo', { country: 'Brazil', hardshipClass: 'A' }],
  
  // BURKINA FASO
  ['bobo-dioulasso', { country: 'Burkina Faso', hardshipClass: 'D' }],
  ['bobo dioulasso', { country: 'Burkina Faso', hardshipClass: 'D' }],
  ['dori', { country: 'Burkina Faso', hardshipClass: 'E' }],
  ['fada', { country: 'Burkina Faso', hardshipClass: 'E' }],
  ['kaya', { country: 'Burkina Faso', hardshipClass: 'E' }],
  ['ouagadougou', { country: 'Burkina Faso', hardshipClass: 'D' }],
  ['ouahigouya', { country: 'Burkina Faso', hardshipClass: 'E' }],
  
  // BURUNDI
  ['bujumbura', { country: 'Burundi', hardshipClass: 'C' }],
  ['gitega', { country: 'Burundi', hardshipClass: 'C' }],
  ['makamba', { country: 'Burundi', hardshipClass: 'D' }],
  ['muyinga', { country: 'Burundi', hardshipClass: 'D' }],
  ['ngozi', { country: 'Burundi', hardshipClass: 'D' }],
  ['ruyigi', { country: 'Burundi', hardshipClass: 'D' }],
  
  // CAMBODIA
  ['phnom penh', { country: 'Cambodia', hardshipClass: 'B' }],
  
  // CAMEROON
  ['bamenda', { country: 'Cameroon', hardshipClass: 'D' }],
  ['bertoua', { country: 'Cameroon', hardshipClass: 'C' }],
  ['buea', { country: 'Cameroon', hardshipClass: 'D' }],
  ['douala', { country: 'Cameroon', hardshipClass: 'A' }],
  ['kousseri', { country: 'Cameroon', hardshipClass: 'E' }],
  ['maroua', { country: 'Cameroon', hardshipClass: 'E' }],
  ['meiganga', { country: 'Cameroon', hardshipClass: 'D' }],
  ['ngaoundere', { country: 'Cameroon', hardshipClass: 'B' }],
  ['yaounde', { country: 'Cameroon', hardshipClass: 'B' }],
  
  // CAPE VERDE
  ['praia', { country: 'Cape Verde', hardshipClass: 'A' }],
  
  // CENTRAL AFRICAN REPUBLIC
  ['alindao', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bambari', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bangassou', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bangui', { country: 'Central African Republic', hardshipClass: 'D' }],
  ['berberati', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['birao', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bossangoa', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['soumbe', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bouar', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['bria', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['kaga-bandoro', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['mongoumba', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['ndele', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['obo', { country: 'Central African Republic', hardshipClass: 'E' }],
  ['paoua', { country: 'Central African Republic', hardshipClass: 'E' }],
  
  // CHAD
  ['abeche', { country: 'Chad', hardshipClass: 'E' }],
  ['adre', { country: 'Chad', hardshipClass: 'E' }],
  ['am djarass', { country: 'Chad', hardshipClass: 'E' }],
  ['baga sola', { country: 'Chad', hardshipClass: 'E' }],
  ['bol', { country: 'Chad', hardshipClass: 'E' }],
  ['farchana', { country: 'Chad', hardshipClass: 'E' }],
  ['faya-largeau', { country: 'Chad', hardshipClass: 'E' }],
  ['gore', { country: 'Chad', hardshipClass: 'E' }],
  ['gozbeida', { country: 'Chad', hardshipClass: 'E' }],
  ['hadjer hadid', { country: 'Chad', hardshipClass: 'E' }],
  ['iriba', { country: 'Chad', hardshipClass: 'E' }],
  ['mao', { country: 'Chad', hardshipClass: 'E' }],
  ['maro', { country: 'Chad', hardshipClass: 'E' }],
  ['massakory', { country: 'Chad', hardshipClass: 'E' }],
  ['mongo', { country: 'Chad', hardshipClass: 'E' }],
  ['moundou', { country: 'Chad', hardshipClass: 'E' }],
  ['moussoro', { country: 'Chad', hardshipClass: 'E' }],
  ['ndjamena', { country: 'Chad', hardshipClass: 'D' }],
  ["n'djamena", { country: 'Chad', hardshipClass: 'D' }],
  
  // CHILE
  ['santiago', { country: 'Chile', hardshipClass: 'A' }],
  
  // CHINA
  ['beijing', { country: 'China', hardshipClass: 'A' }],
  ['guangzhou', { country: 'China', hardshipClass: 'A' }],
  ['macao', { country: 'China', hardshipClass: 'A' }],
  ['macau', { country: 'China', hardshipClass: 'A' }],
  
  // COLOMBIA
  ['apartado', { country: 'Colombia', hardshipClass: 'B' }],
  ['arauca', { country: 'Colombia', hardshipClass: 'C' }],
  ['barrancabermeja', { country: 'Colombia', hardshipClass: 'B' }],
  ['barranquilla', { country: 'Colombia', hardshipClass: 'A' }],
  ['bogota', { country: 'Colombia', hardshipClass: 'A' }],
  ['cali', { country: 'Colombia', hardshipClass: 'A' }],
  ['cartagena', { country: 'Colombia', hardshipClass: 'A' }],
  ['cucuta', { country: 'Colombia', hardshipClass: 'B' }],
  ['dabeiba', { country: 'Colombia', hardshipClass: 'D' }],
  ['el bordo', { country: 'Colombia', hardshipClass: 'C' }],
  ['florencia', { country: 'Colombia', hardshipClass: 'B' }],
  ['fonseca', { country: 'Colombia', hardshipClass: 'D' }],
  ['gaitania', { country: 'Colombia', hardshipClass: 'C' }],
  ['planadas', { country: 'Colombia', hardshipClass: 'C' }],
  ['icononzo', { country: 'Colombia', hardshipClass: 'C' }],
  ['medellin', { country: 'Colombia', hardshipClass: 'A' }],
  ['mesetas', { country: 'Colombia', hardshipClass: 'D' }],
  ['mocoa', { country: 'Colombia', hardshipClass: 'C' }],
  ['monteria', { country: 'Colombia', hardshipClass: 'A' }],
  ['neiva', { country: 'Colombia', hardshipClass: 'A' }],
  ['pasto', { country: 'Colombia', hardshipClass: 'A' }],
  ['popayan', { country: 'Colombia', hardshipClass: 'A' }],
  ['puerto asis', { country: 'Colombia', hardshipClass: 'C' }],
  ['putumayo', { country: 'Colombia', hardshipClass: 'C' }],
  ['quibdo', { country: 'Colombia', hardshipClass: 'C' }],
  ['san jose del guaviare', { country: 'Colombia', hardshipClass: 'C' }],
  ['san vicente del caguan', { country: 'Colombia', hardshipClass: 'D' }],
  ['santander de quilichao', { country: 'Colombia', hardshipClass: 'C' }],
  ['sincelejo', { country: 'Colombia', hardshipClass: 'B' }],
  ['tibu', { country: 'Colombia', hardshipClass: 'D' }],
  ['tumaco', { country: 'Colombia', hardshipClass: 'C' }],
  ['valledupar', { country: 'Colombia', hardshipClass: 'B' }],
  ['villavicencio', { country: 'Colombia', hardshipClass: 'A' }],
  ['vista hermosa', { country: 'Colombia', hardshipClass: 'D' }],
  ['yarumal', { country: 'Colombia', hardshipClass: 'C' }],
  
  // COMOROS
  ['moroni', { country: 'Comoros', hardshipClass: 'D' }],
  ['grande comore', { country: 'Comoros', hardshipClass: 'D' }],
  
  // CONGO
  ['betou', { country: 'Congo', hardshipClass: 'E' }],
  ['brazzaville', { country: 'Congo', hardshipClass: 'B' }],
  
  // CONGO, DEM. REP.
  ['aru', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['baraka', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['beni', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['bukavu', { country: 'Democratic Republic of the Congo', hardshipClass: 'D' }],
  ['bunia', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['dungu', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['faradje', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['gbadolite', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['goma', { country: 'Democratic Republic of the Congo', hardshipClass: 'D' }],
  ['isiro', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['kalemie', { country: 'Democratic Republic of the Congo', hardshipClass: 'D' }],
  ['kananga', { country: 'Democratic Republic of the Congo', hardshipClass: 'D' }],
  ['kinshasa', { country: 'Democratic Republic of the Congo', hardshipClass: 'C' }],
  ['kisangani', { country: 'Democratic Republic of the Congo', hardshipClass: 'D' }],
  ['libenge', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['lubumbashi', { country: 'Democratic Republic of the Congo', hardshipClass: 'C' }],
  ['mbandaka', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['tshikapa', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['uvira', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  ['yakoma', { country: 'Democratic Republic of the Congo', hardshipClass: 'E' }],
  
  // COSTA RICA
  ['ciudad neily', { country: 'Costa Rica', hardshipClass: 'B' }],
  ['san jose', { country: 'Costa Rica', hardshipClass: 'A' }],
  ['upala', { country: 'Costa Rica', hardshipClass: 'B' }],
  
  // COTE D'IVOIRE
  ['abidjan', { country: "Cote d'Ivoire", hardshipClass: 'B' }],
  ['bondoukou', { country: "Cote d'Ivoire", hardshipClass: 'E' }],
  ['ferkessedougou', { country: "Cote d'Ivoire", hardshipClass: 'C' }],
  
  // CUBA
  ['havana', { country: 'Cuba', hardshipClass: 'B' }],
  
  // DJIBOUTI
  ['ali-sabieh', { country: 'Djibouti', hardshipClass: 'D' }],
  ['djibouti', { country: 'Djibouti', hardshipClass: 'C' }],
  ['obock', { country: 'Djibouti', hardshipClass: 'D' }],
  ['tadjourah', { country: 'Djibouti', hardshipClass: 'D' }],
  
  // DOMINICA
  ['roseau', { country: 'Dominica', hardshipClass: 'B' }],
  
  // DOMINICAN REPUBLIC
  ['santo domingo', { country: 'Dominican Republic', hardshipClass: 'A' }],
  
  // ECUADOR
  ['guayaquil', { country: 'Ecuador', hardshipClass: 'A' }],
  ['manta', { country: 'Ecuador', hardshipClass: 'B' }],
  ['quito', { country: 'Ecuador', hardshipClass: 'A' }],
  
  // EGYPT
  ['alexandria', { country: 'Egypt', hardshipClass: 'A' }],
  ['cairo', { country: 'Egypt', hardshipClass: 'A' }],
  
  // EL SALVADOR
  ['san salvador', { country: 'El Salvador', hardshipClass: 'A' }],
  
  // EQUATORIAL GUINEA
  ['malabo', { country: 'Equatorial Guinea', hardshipClass: 'C' }],
  
  // ERITREA
  ['asmara', { country: 'Eritrea', hardshipClass: 'D' }],
  
  // ESWATINI
  ['mbabane', { country: 'Eswatini', hardshipClass: 'A' }],
  
  // ETHIOPIA
  ['adama', { country: 'Ethiopia', hardshipClass: 'C' }],
  ['nazareth', { country: 'Ethiopia', hardshipClass: 'C' }],
  ['addis ababa', { country: 'Ethiopia', hardshipClass: 'B' }],
  ['assosa', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['awassa', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['sidamo', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['axum', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['bahir dar', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['bokh', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['debark', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['dese', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['dire dawa', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['dollo addo', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['fugnido', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['gambella', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['gode', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['gondar', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['jijiga', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['mekele', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['melkadida', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['metemma', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['nekemte', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['semera', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['sherkole', { country: 'Ethiopia', hardshipClass: 'E' }],
  ['shire', { country: 'Ethiopia', hardshipClass: 'D' }],
  ['endaselassie', { country: 'Ethiopia', hardshipClass: 'D' }],
  
  // FIJI
  ['suva', { country: 'Fiji', hardshipClass: 'B' }],
  
  // GABON
  ['libreville', { country: 'Gabon', hardshipClass: 'A' }],
  
  // GAMBIA
  ['banjul', { country: 'Gambia', hardshipClass: 'B' }],
  
  // GAZA
  ['gaza', { country: 'Gaza', hardshipClass: 'E' }],
  ['gaza town', { country: 'Gaza', hardshipClass: 'E' }],
  ['gaza city', { country: 'Gaza', hardshipClass: 'E' }],
  
  // GEORGIA
  ['gali', { country: 'Georgia', hardshipClass: 'D' }],
  ['sukhumi', { country: 'Georgia', hardshipClass: 'C' }],
  ['tbilisi', { country: 'Georgia', hardshipClass: 'A' }],
  
  // GHANA
  ['accra', { country: 'Ghana', hardshipClass: 'B' }],
  ['bolgatanga', { country: 'Ghana', hardshipClass: 'D' }],
  ['tamale', { country: 'Ghana', hardshipClass: 'B' }],
  
  // GRENADA
  ["st. george's", { country: 'Grenada', hardshipClass: 'A' }],
  ['st georges', { country: 'Grenada', hardshipClass: 'A' }],
  
  // GUATEMALA
  ['esquipulas', { country: 'Guatemala', hardshipClass: 'C' }],
  ['guatemala city', { country: 'Guatemala', hardshipClass: 'A' }],
  ['huehuetenango', { country: 'Guatemala', hardshipClass: 'C' }],
  ['puerto barrios', { country: 'Guatemala', hardshipClass: 'C' }],
  ['santa elena', { country: 'Guatemala', hardshipClass: 'B' }],
  ['tecun uman', { country: 'Guatemala', hardshipClass: 'C' }],
  
  // GUINEA
  ['conakry', { country: 'Guinea', hardshipClass: 'C' }],
  ['kankan', { country: 'Guinea', hardshipClass: 'D' }],
  ['labe', { country: 'Guinea', hardshipClass: 'D' }],
  ['nzerekore', { country: 'Guinea', hardshipClass: 'D' }],
  
  // GUINEA BISSAU
  ['bissau', { country: 'Guinea Bissau', hardshipClass: 'E' }],
  
  // GUYANA
  ['georgetown', { country: 'Guyana', hardshipClass: 'A' }],
  
  // HAITI
  ['les cayes', { country: 'Haiti', hardshipClass: 'E' }],
  ['port-au-prince', { country: 'Haiti', hardshipClass: 'E' }],
  ['port au prince', { country: 'Haiti', hardshipClass: 'E' }],
  
  // HONDURAS
  ['san pedro sula', { country: 'Honduras', hardshipClass: 'B' }],
  ['tegucigalpa', { country: 'Honduras', hardshipClass: 'B' }],
  
  // INDIA
  ['bhopal', { country: 'India', hardshipClass: 'B' }],
  ['bhubaneswar', { country: 'India', hardshipClass: 'B' }],
  ['calcutta', { country: 'India', hardshipClass: 'B' }],
  ['kolkata', { country: 'India', hardshipClass: 'B' }],
  ['hyderabad', { country: 'India', hardshipClass: 'B' }],
  ['jaipur', { country: 'India', hardshipClass: 'B' }],
  ['lucknow', { country: 'India', hardshipClass: 'B' }],
  ['mumbai', { country: 'India', hardshipClass: 'B' }],
  ['bombay', { country: 'India', hardshipClass: 'B' }],
  ['new delhi', { country: 'India', hardshipClass: 'B' }],
  ['delhi', { country: 'India', hardshipClass: 'B' }],
  ['patna', { country: 'India', hardshipClass: 'B' }],
  
  // INDONESIA
  ['jakarta', { country: 'Indonesia', hardshipClass: 'A' }],
  ['makassar', { country: 'Indonesia', hardshipClass: 'A' }],
  ['medan', { country: 'Indonesia', hardshipClass: 'A' }],
  
  // IRAN
  ['isfahan', { country: 'Iran', hardshipClass: 'C' }],
  ['kerman', { country: 'Iran', hardshipClass: 'C' }],
  ['mashad', { country: 'Iran', hardshipClass: 'C' }],
  ['shiraz', { country: 'Iran', hardshipClass: 'C' }],
  ['tehran', { country: 'Iran', hardshipClass: 'B' }],
  
  // IRAQ
  ['arbil', { country: 'Iraq', hardshipClass: 'C' }],
  ['erbil', { country: 'Iraq', hardshipClass: 'C' }],
  ['baghdad', { country: 'Iraq', hardshipClass: 'E' }],
  ['basrah', { country: 'Iraq', hardshipClass: 'D' }],
  ['basra', { country: 'Iraq', hardshipClass: 'D' }],
  ['dohuk', { country: 'Iraq', hardshipClass: 'D' }],
  ['kirkuk', { country: 'Iraq', hardshipClass: 'E' }],
  ['mosul', { country: 'Iraq', hardshipClass: 'E' }],
  ['sulaymaniah', { country: 'Iraq', hardshipClass: 'D' }],
  
  // ISRAEL
  ['tel aviv', { country: 'Israel', hardshipClass: 'B' }],
  ['tiberias', { country: 'Israel', hardshipClass: 'B' }],
  
  // JERUSALEM
  ['jerusalem', { country: 'Jerusalem', hardshipClass: 'B' }],
  ['east jerusalem', { country: 'West Bank', hardshipClass: 'B' }],
  
  // JAMAICA
  ['kingston', { country: 'Jamaica', hardshipClass: 'A' }],
  
  // JORDAN
  ['amman', { country: 'Jordan', hardshipClass: 'A' }],
  ['azraq', { country: 'Jordan', hardshipClass: 'C' }],
  ['irbid', { country: 'Jordan', hardshipClass: 'B' }],
  ['mafraq', { country: 'Jordan', hardshipClass: 'B' }],
  
  // KAZAKHSTAN
  ['almaty', { country: 'Kazakhstan', hardshipClass: 'A' }],
  ['astana', { country: 'Kazakhstan', hardshipClass: 'A' }],
  ['nur-sultan', { country: 'Kazakhstan', hardshipClass: 'A' }],
  
  // KENYA
  ['alinjugur', { country: 'Kenya', hardshipClass: 'E' }],
  ['dadaab', { country: 'Kenya', hardshipClass: 'E' }],
  ['kakuma', { country: 'Kenya', hardshipClass: 'E' }],
  ['mombasa', { country: 'Kenya', hardshipClass: 'B' }],
  ['nairobi', { country: 'Kenya', hardshipClass: 'B' }],
  
  // KIRIBATI
  ['tarawa', { country: 'Kiribati', hardshipClass: 'D' }],
  
  // KOREA, DEM. PEO. REP. OF
  ['pyongyang', { country: 'North Korea', hardshipClass: 'E' }],
  
  // KOREA, REPUBLIC OF
  ['seoul', { country: 'South Korea', hardshipClass: 'A' }],
  ['incheon', { country: 'South Korea', hardshipClass: 'A' }],
  
  // KUWAIT
  ['kuwait', { country: 'Kuwait', hardshipClass: 'A' }],
  ['kuwait city', { country: 'Kuwait', hardshipClass: 'A' }],
  
  // KYRGYZSTAN
  ['bishkek', { country: 'Kyrgyzstan', hardshipClass: 'B' }],
  
  // LAO PDR
  ['vientiane', { country: 'Laos', hardshipClass: 'B' }],
  
  // LEBANON
  ['al qoubaiyat', { country: 'Lebanon', hardshipClass: 'D' }],
  ['kobayat', { country: 'Lebanon', hardshipClass: 'D' }],
  ['beirut', { country: 'Lebanon', hardshipClass: 'D' }],
  ['tripoli', { country: 'Lebanon', hardshipClass: 'D' }],
  ['tyre', { country: 'Lebanon', hardshipClass: 'E' }],
  ['sur', { country: 'Lebanon', hardshipClass: 'E' }],
  ['naqoura', { country: 'Lebanon', hardshipClass: 'E' }],
  ['zahle', { country: 'Lebanon', hardshipClass: 'D' }],
  
  // LESOTHO
  ['maseru', { country: 'Lesotho', hardshipClass: 'C' }],
  
  // LIBERIA
  ['monrovia', { country: 'Liberia', hardshipClass: 'C' }],
  
  // LIBYA
  ['benghazi', { country: 'Libya', hardshipClass: 'E' }],
  ['tripoli', { country: 'Libya', hardshipClass: 'E' }],
  
  // MADAGASCAR
  ['amboasary sud', { country: 'Madagascar', hardshipClass: 'D' }],
  ['ambovombe', { country: 'Madagascar', hardshipClass: 'D' }],
  ['ampanihy', { country: 'Madagascar', hardshipClass: 'D' }],
  ['antananarivo', { country: 'Madagascar', hardshipClass: 'B' }],
  ['bekily', { country: 'Madagascar', hardshipClass: 'D' }],
  ['manakara', { country: 'Madagascar', hardshipClass: 'C' }],
  ['morondava', { country: 'Madagascar', hardshipClass: 'C' }],
  ['toliara', { country: 'Madagascar', hardshipClass: 'C' }],
  ['tulear', { country: 'Madagascar', hardshipClass: 'C' }],
  
  // MALAWI
  ['blantyre', { country: 'Malawi', hardshipClass: 'B' }],
  ['lilongwe', { country: 'Malawi', hardshipClass: 'B' }],
  
  // MALAYSIA
  ['kuala lumpur', { country: 'Malaysia', hardshipClass: 'A' }],
  
  // MALDIVES
  ['male', { country: 'Maldives', hardshipClass: 'B' }],
  
  // MALI
  ['bamako', { country: 'Mali', hardshipClass: 'D' }],
  ['gao', { country: 'Mali', hardshipClass: 'E' }],
  ['kidal', { country: 'Mali', hardshipClass: 'E' }],
  ['menaka', { country: 'Mali', hardshipClass: 'E' }],
  ['mopti', { country: 'Mali', hardshipClass: 'E' }],
  ['segou', { country: 'Mali', hardshipClass: 'E' }],
  ['sikasso', { country: 'Mali', hardshipClass: 'D' }],
  ['tessalit', { country: 'Mali', hardshipClass: 'E' }],
  ['tombouctou', { country: 'Mali', hardshipClass: 'E' }],
  ['timbuktu', { country: 'Mali', hardshipClass: 'E' }],
  
  // MARSHALL ISLANDS
  ['majuro', { country: 'Marshall Islands', hardshipClass: 'C' }],
  
  // MAURITANIA
  ['bassikounou', { country: 'Mauritania', hardshipClass: 'E' }],
  ['nema', { country: 'Mauritania', hardshipClass: 'D' }],
  ['nouadhibou', { country: 'Mauritania', hardshipClass: 'D' }],
  ['nouakchott', { country: 'Mauritania', hardshipClass: 'D' }],
  
  // MAURITIUS
  ['port louis', { country: 'Mauritius', hardshipClass: 'A' }],
  
  // MEXICO
  ['ciudad juarez', { country: 'Mexico', hardshipClass: 'A' }],
  ['mexico city', { country: 'Mexico', hardshipClass: 'A' }],
  ['monterrey', { country: 'Mexico', hardshipClass: 'A' }],
  ['tapachula', { country: 'Mexico', hardshipClass: 'A' }],
  ['tenosique', { country: 'Mexico', hardshipClass: 'C' }],
  ['tijuana', { country: 'Mexico', hardshipClass: 'A' }],
  ['tuxtla gutierrez', { country: 'Mexico', hardshipClass: 'A' }],
  
  // MICRONESIA
  ['pohnpei', { country: 'Micronesia', hardshipClass: 'C' }],
  ['ponape', { country: 'Micronesia', hardshipClass: 'C' }],
  
  // MOLDOVA
  ['chisinau', { country: 'Moldova', hardshipClass: 'A' }],
  
  // MONGOLIA
  ['ulan bator', { country: 'Mongolia', hardshipClass: 'B' }],
  ['ulaanbaatar', { country: 'Mongolia', hardshipClass: 'B' }],
  
  // MONTENEGRO
  ['podgorica', { country: 'Montenegro', hardshipClass: 'A' }],
  
  // MOROCCO
  ['rabat', { country: 'Morocco', hardshipClass: 'A' }],
  
  // MOZAMBIQUE
  ['beira', { country: 'Mozambique', hardshipClass: 'C' }],
  ['maputo', { country: 'Mozambique', hardshipClass: 'B' }],
  ['nampula', { country: 'Mozambique', hardshipClass: 'C' }],
  ['pemba', { country: 'Mozambique', hardshipClass: 'D' }],
  
  // MYANMAR
  ['hpa an', { country: 'Myanmar', hardshipClass: 'D' }],
  ['maungdaw', { country: 'Myanmar', hardshipClass: 'E' }],
  ['myitkyina', { country: 'Myanmar', hardshipClass: 'E' }],
  ['nay pyi taw', { country: 'Myanmar', hardshipClass: 'D' }],
  ['naypyidaw', { country: 'Myanmar', hardshipClass: 'D' }],
  ['sittwe', { country: 'Myanmar', hardshipClass: 'D' }],
  ['yangon', { country: 'Myanmar', hardshipClass: 'D' }],
  ['rangoon', { country: 'Myanmar', hardshipClass: 'D' }],
  
  // NAMIBIA
  ['windhoek', { country: 'Namibia', hardshipClass: 'A' }],
  
  // NAURU
  ['yaren', { country: 'Nauru', hardshipClass: 'D' }],
  
  // NEPAL
  ['kathmandu', { country: 'Nepal', hardshipClass: 'B' }],
  
  // NICARAGUA
  ['managua', { country: 'Nicaragua', hardshipClass: 'A' }],
  
  // NIGER
  ['abala', { country: 'Niger', hardshipClass: 'E' }],
  ['agades', { country: 'Niger', hardshipClass: 'E' }],
  ['agadez', { country: 'Niger', hardshipClass: 'E' }],
  ['diffa', { country: 'Niger', hardshipClass: 'E' }],
  ['madaoua', { country: 'Niger', hardshipClass: 'E' }],
  ['maradi', { country: 'Niger', hardshipClass: 'E' }],
  ['niamey', { country: 'Niger', hardshipClass: 'E' }],
  ['ouallam', { country: 'Niger', hardshipClass: 'E' }],
  ['tahoua', { country: 'Niger', hardshipClass: 'E' }],
  ['tillabery', { country: 'Niger', hardshipClass: 'E' }],
  ['zinder', { country: 'Niger', hardshipClass: 'E' }],
  
  // NIGERIA
  ['abuja', { country: 'Nigeria', hardshipClass: 'B' }],
  ['adikpo', { country: 'Nigeria', hardshipClass: 'D' }],
  ['akure', { country: 'Nigeria', hardshipClass: 'D' }],
  ['bauchi', { country: 'Nigeria', hardshipClass: 'E' }],
  ['calabar', { country: 'Nigeria', hardshipClass: 'C' }],
  ['damaturu', { country: 'Nigeria', hardshipClass: 'D' }],
  ['enugu', { country: 'Nigeria', hardshipClass: 'C' }],
  ['ikom', { country: 'Nigeria', hardshipClass: 'D' }],
  ['kaduna', { country: 'Nigeria', hardshipClass: 'D' }],
  ['kano', { country: 'Nigeria', hardshipClass: 'C' }],
  ['katsina', { country: 'Nigeria', hardshipClass: 'D' }],
  ['lagos', { country: 'Nigeria', hardshipClass: 'B' }],
  ['maiduguri', { country: 'Nigeria', hardshipClass: 'E' }],
  ['minna', { country: 'Nigeria', hardshipClass: 'D' }],
  ['mubi', { country: 'Nigeria', hardshipClass: 'D' }],
  ['ogoja', { country: 'Nigeria', hardshipClass: 'D' }],
  ['port harcourt', { country: 'Nigeria', hardshipClass: 'C' }],
  ['sokoto', { country: 'Nigeria', hardshipClass: 'E' }],
  ['takum', { country: 'Nigeria', hardshipClass: 'D' }],
  ['yola', { country: 'Nigeria', hardshipClass: 'D' }],
  
  // OCCUPIED SYRIAN GOLAN
  ['golan', { country: 'Occupied Syrian Golan', hardshipClass: 'B' }],
  
  // OMAN
  ['muscat', { country: 'Oman', hardshipClass: 'A' }],
  ['salalah', { country: 'Oman', hardshipClass: 'A' }],
  
  // PAKISTAN
  ['hyderabad', { country: 'Pakistan', hardshipClass: 'C' }],
  ['islamabad', { country: 'Pakistan', hardshipClass: 'B' }],
  ['rawalpindi', { country: 'Pakistan', hardshipClass: 'B' }],
  ['karachi', { country: 'Pakistan', hardshipClass: 'C' }],
  ['lahore', { country: 'Pakistan', hardshipClass: 'C' }],
  ['multan', { country: 'Pakistan', hardshipClass: 'C' }],
  ['peshawar', { country: 'Pakistan', hardshipClass: 'E' }],
  ['quetta', { country: 'Pakistan', hardshipClass: 'E' }],
  
  // PALAU
  ['koror', { country: 'Palau', hardshipClass: 'B' }],
  
  // PANAMA
  ['meteti', { country: 'Panama', hardshipClass: 'C' }],
  ['panama city', { country: 'Panama', hardshipClass: 'A' }],
  
  // PAPUA NEW GUINEA
  ['buka', { country: 'Papua New Guinea', hardshipClass: 'E' }],
  ['mendi', { country: 'Papua New Guinea', hardshipClass: 'E' }],
  ['port moresby', { country: 'Papua New Guinea', hardshipClass: 'D' }],
  ['wewak', { country: 'Papua New Guinea', hardshipClass: 'D' }],
  
  // PARAGUAY
  ['asuncion', { country: 'Paraguay', hardshipClass: 'A' }],
  
  // PERU
  ['lima', { country: 'Peru', hardshipClass: 'A' }],
  ['tumbes', { country: 'Peru', hardshipClass: 'B' }],
  
  // PHILIPPINES
  ['cotabato city', { country: 'Philippines', hardshipClass: 'C' }],
  ['manila', { country: 'Philippines', hardshipClass: 'A' }],
  
  // QATAR
  ['doha', { country: 'Qatar', hardshipClass: 'A' }],
  
  // RUSSIAN FEDERATION
  ['moscow', { country: 'Russia', hardshipClass: 'A' }],
  
  // RWANDA
  ['huye', { country: 'Rwanda', hardshipClass: 'B' }],
  ['butare', { country: 'Rwanda', hardshipClass: 'B' }],
  ['kabarore', { country: 'Rwanda', hardshipClass: 'C' }],
  ['karongi', { country: 'Rwanda', hardshipClass: 'C' }],
  ['kibuye', { country: 'Rwanda', hardshipClass: 'C' }],
  ['kigali', { country: 'Rwanda', hardshipClass: 'A' }],
  ['kirehe', { country: 'Rwanda', hardshipClass: 'C' }],
  ['nyamata', { country: 'Rwanda', hardshipClass: 'B' }],
  
  // SAMOA
  ['apia', { country: 'Samoa', hardshipClass: 'B' }],
  
  // SAO TOME AND PRINCIPE
  ['sao tome', { country: 'Sao Tome and Principe', hardshipClass: 'D' }],
  
  // SAUDI ARABIA
  ['al-hofuf', { country: 'Saudi Arabia', hardshipClass: 'A' }],
  ['jeddah', { country: 'Saudi Arabia', hardshipClass: 'A' }],
  ['riyadh', { country: 'Saudi Arabia', hardshipClass: 'A' }],
  
  // SENEGAL
  ['dakar', { country: 'Senegal', hardshipClass: 'A' }],
  
  // SERBIA
  ['belgrade', { country: 'Serbia', hardshipClass: 'A' }],
  ['mitrovica', { country: 'Serbia', hardshipClass: 'C' }],
  ['peja', { country: 'Serbia', hardshipClass: 'B' }],
  ['pec', { country: 'Serbia', hardshipClass: 'B' }],
  ['pristina', { country: 'Serbia', hardshipClass: 'B' }],
  
  // SEYCHELLES
  ['mahe', { country: 'Seychelles', hardshipClass: 'A' }],
  ['port victoria', { country: 'Seychelles', hardshipClass: 'A' }],
  
  // SIERRA LEONE
  ['freetown', { country: 'Sierra Leone', hardshipClass: 'C' }],
  
  // SINGAPORE
  ['singapore', { country: 'Singapore', hardshipClass: 'A' }],
  
  // SOLOMON ISLANDS
  ['honiara', { country: 'Solomon Islands', hardshipClass: 'D' }],
  
  // SOMALIA
  ['baidoa', { country: 'Somalia', hardshipClass: 'E' }],
  ['belet uen', { country: 'Somalia', hardshipClass: 'E' }],
  ['berbera', { country: 'Somalia', hardshipClass: 'E' }],
  ['boosaaso', { country: 'Somalia', hardshipClass: 'E' }],
  ['bender cassim', { country: 'Somalia', hardshipClass: 'E' }],
  ['dolow', { country: 'Somalia', hardshipClass: 'E' }],
  ['galkacyo', { country: 'Somalia', hardshipClass: 'E' }],
  ['garowe', { country: 'Somalia', hardshipClass: 'E' }],
  ['hargeisa', { country: 'Somalia', hardshipClass: 'E' }],
  ['jowhar', { country: 'Somalia', hardshipClass: 'E' }],
  ['kisimaio', { country: 'Somalia', hardshipClass: 'E' }],
  ['kismaayo', { country: 'Somalia', hardshipClass: 'E' }],
  ['mogadishu', { country: 'Somalia', hardshipClass: 'E' }],
  ['mogadiscio', { country: 'Somalia', hardshipClass: 'E' }],
  
  // SOUTH AFRICA
  ['cape town', { country: 'South Africa', hardshipClass: 'A' }],
  ['durban', { country: 'South Africa', hardshipClass: 'A' }],
  ['johannesburg', { country: 'South Africa', hardshipClass: 'A' }],
  ['pretoria', { country: 'South Africa', hardshipClass: 'A' }],
  
  // SOUTH SUDAN
  ['aweil', { country: 'South Sudan', hardshipClass: 'E' }],
  ['bentiu', { country: 'South Sudan', hardshipClass: 'E' }],
  ['paryang', { country: 'South Sudan', hardshipClass: 'E' }],
  ['yida', { country: 'South Sudan', hardshipClass: 'E' }],
  ['bor', { country: 'South Sudan', hardshipClass: 'E' }],
  ['bunj', { country: 'South Sudan', hardshipClass: 'E' }],
  ['maban', { country: 'South Sudan', hardshipClass: 'E' }],
  ['jam-jang', { country: 'South Sudan', hardshipClass: 'E' }],
  ['juba', { country: 'South Sudan', hardshipClass: 'E' }],
  ['kapoeta', { country: 'South Sudan', hardshipClass: 'E' }],
  ['kuajok', { country: 'South Sudan', hardshipClass: 'E' }],
  ['malakal', { country: 'South Sudan', hardshipClass: 'E' }],
  ['pibor', { country: 'South Sudan', hardshipClass: 'E' }],
  ['renk', { country: 'South Sudan', hardshipClass: 'E' }],
  ['rumbek', { country: 'South Sudan', hardshipClass: 'E' }],
  ['torit', { country: 'South Sudan', hardshipClass: 'E' }],
  ['wau', { country: 'South Sudan', hardshipClass: 'E' }],
  ['yambio', { country: 'South Sudan', hardshipClass: 'E' }],
  ['yei', { country: 'South Sudan', hardshipClass: 'E' }],
  
  // SRI LANKA
  ['colombo', { country: 'Sri Lanka', hardshipClass: 'C' }],
  
  // ST. KITTS AND NEVIS
  ['basseterre', { country: 'St. Kitts and Nevis', hardshipClass: 'A' }],
  
  // ST. LUCIA
  ['castries', { country: 'St. Lucia', hardshipClass: 'A' }],
  
  // ST. VINCENT-GRENADINES
  ['kingstown', { country: 'St. Vincent and the Grenadines', hardshipClass: 'A' }],
  
  // SUDAN
  ['abyei', { country: 'Sudan', hardshipClass: 'E' }],
  ['atbara', { country: 'Sudan', hardshipClass: 'E' }],
  ['damazine', { country: 'Sudan', hardshipClass: 'E' }],
  ['ed daein', { country: 'Sudan', hardshipClass: 'E' }],
  ['el fasher', { country: 'Sudan', hardshipClass: 'E' }],
  ['el gedaref', { country: 'Sudan', hardshipClass: 'E' }],
  ['el geneina', { country: 'Sudan', hardshipClass: 'E' }],
  ['golo', { country: 'Sudan', hardshipClass: 'E' }],
  ['kadugli', { country: 'Sudan', hardshipClass: 'E' }],
  ['kassala', { country: 'Sudan', hardshipClass: 'E' }],
  ['khartoum', { country: 'Sudan', hardshipClass: 'E' }],
  ['khashm el girba', { country: 'Sudan', hardshipClass: 'E' }],
  ['kosti', { country: 'Sudan', hardshipClass: 'E' }],
  ['nyala', { country: 'Sudan', hardshipClass: 'E' }],
  ['port sudan', { country: 'Sudan', hardshipClass: 'E' }],
  ['wad medani', { country: 'Sudan', hardshipClass: 'E' }],
  ['wadi halfa', { country: 'Sudan', hardshipClass: 'E' }],
  
  // SURINAME
  ['paramaribo', { country: 'Suriname', hardshipClass: 'A' }],
  
  // SYRIAN ARAB REPUBLIC
  ['aleppo', { country: 'Syria', hardshipClass: 'E' }],
  ['damascus', { country: 'Syria', hardshipClass: 'E' }],
  ['camp faouar', { country: 'Syria', hardshipClass: 'E' }],
  ['homs', { country: 'Syria', hardshipClass: 'E' }],
  ['lattakia', { country: 'Syria', hardshipClass: 'E' }],
  ['qamishli', { country: 'Syria', hardshipClass: 'E' }],
  ['sweida', { country: 'Syria', hardshipClass: 'E' }],
  ['tartous', { country: 'Syria', hardshipClass: 'E' }],
  
  // TAJIKISTAN
  ['dushanbe', { country: 'Tajikistan', hardshipClass: 'B' }],
  
  // TANZANIA
  ['arusha', { country: 'Tanzania', hardshipClass: 'B' }],
  ['dar es salaam', { country: 'Tanzania', hardshipClass: 'B' }],
  ['dodoma', { country: 'Tanzania', hardshipClass: 'B' }],
  ['kasulu', { country: 'Tanzania', hardshipClass: 'D' }],
  ['kibondo', { country: 'Tanzania', hardshipClass: 'D' }],
  ['kigoma', { country: 'Tanzania', hardshipClass: 'C' }],
  ['zanzibar', { country: 'Tanzania', hardshipClass: 'B' }],
  
  // THAILAND
  ['ban mae sot', { country: 'Thailand', hardshipClass: 'B' }],
  ['mae sot', { country: 'Thailand', hardshipClass: 'B' }],
  ['bangkok', { country: 'Thailand', hardshipClass: 'A' }],
  ['mae hong son', { country: 'Thailand', hardshipClass: 'B' }],
  
  // NORTH MACEDONIA
  ['skopje', { country: 'North Macedonia', hardshipClass: 'A' }],
  
  // TIMOR-LESTE
  ['dili', { country: 'Timor-Leste', hardshipClass: 'C' }],
  
  // TOGO
  ['dapaong', { country: 'Togo', hardshipClass: 'D' }],
  ['lama kara', { country: 'Togo', hardshipClass: 'C' }],
  ['lome', { country: 'Togo', hardshipClass: 'A' }],
  
  // TONGA
  ["nuku'alofa", { country: 'Tonga', hardshipClass: 'B' }],
  ['nukualofa', { country: 'Tonga', hardshipClass: 'B' }],
  
  // TRINIDAD AND TOBAGO
  ['port-of-spain', { country: 'Trinidad and Tobago', hardshipClass: 'A' }],
  ['port of spain', { country: 'Trinidad and Tobago', hardshipClass: 'A' }],
  
  // TUNISIA
  ['tunis', { country: 'Tunisia', hardshipClass: 'A' }],
  ['zarzis', { country: 'Tunisia', hardshipClass: 'A' }],
  
  // TÜRKIYE
  ['adana', { country: 'Turkey', hardshipClass: 'A' }],
  ['ankara', { country: 'Turkey', hardshipClass: 'A' }],
  ['gaziantep', { country: 'Turkey', hardshipClass: 'C' }],
  ['istanbul', { country: 'Turkey', hardshipClass: 'A' }],
  ['mersin', { country: 'Turkey', hardshipClass: 'A' }],
  ['sanliurfa', { country: 'Turkey', hardshipClass: 'C' }],
  
  // TURKMENISTAN
  ['ashkhabad', { country: 'Turkmenistan', hardshipClass: 'C' }],
  ['ashgabat', { country: 'Turkmenistan', hardshipClass: 'C' }],
  
  // TUVALU
  ['funafuti', { country: 'Tuvalu', hardshipClass: 'C' }],
  
  // UGANDA
  ['adjumani', { country: 'Uganda', hardshipClass: 'E' }],
  ['arua', { country: 'Uganda', hardshipClass: 'C' }],
  ['gulu', { country: 'Uganda', hardshipClass: 'C' }],
  ['kampala', { country: 'Uganda', hardshipClass: 'B' }],
  ['entebbe', { country: 'Uganda', hardshipClass: 'B' }],
  ['kiryandongo', { country: 'Uganda', hardshipClass: 'E' }],
  ['kisoro', { country: 'Uganda', hardshipClass: 'D' }],
  ['kyaka ii', { country: 'Uganda', hardshipClass: 'E' }],
  ['kyangwali', { country: 'Uganda', hardshipClass: 'E' }],
  ['kyenjojo', { country: 'Uganda', hardshipClass: 'D' }],
  ['lamwo', { country: 'Uganda', hardshipClass: 'D' }],
  ['mbarara', { country: 'Uganda', hardshipClass: 'C' }],
  ['moroto', { country: 'Uganda', hardshipClass: 'E' }],
  ['moyo', { country: 'Uganda', hardshipClass: 'E' }],
  ['nakivale', { country: 'Uganda', hardshipClass: 'E' }],
  ['rwamwanja', { country: 'Uganda', hardshipClass: 'E' }],
  ['yumbe', { country: 'Uganda', hardshipClass: 'E' }],
  
  // UKRAINE
  ['dnipro', { country: 'Ukraine', hardshipClass: 'E' }],
  ['kharkiv', { country: 'Ukraine', hardshipClass: 'E' }],
  ['kyiv', { country: 'Ukraine', hardshipClass: 'D' }],
  ['kiev', { country: 'Ukraine', hardshipClass: 'D' }],
  ['lviv', { country: 'Ukraine', hardshipClass: 'D' }],
  ['mykolaiv', { country: 'Ukraine', hardshipClass: 'E' }],
  ['odesa', { country: 'Ukraine', hardshipClass: 'D' }],
  ['odessa', { country: 'Ukraine', hardshipClass: 'D' }],
  ['poltava', { country: 'Ukraine', hardshipClass: 'D' }],
  ['uzhhorod', { country: 'Ukraine', hardshipClass: 'D' }],
  ['vinnytsia', { country: 'Ukraine', hardshipClass: 'D' }],
  
  // UNITED ARAB EMIRATES
  ['abu dhabi', { country: 'United Arab Emirates', hardshipClass: 'A' }],
  ['dubai', { country: 'United Arab Emirates', hardshipClass: 'A' }],
  
  // URUGUAY
  ['montevideo', { country: 'Uruguay', hardshipClass: 'A' }],
  
  // UZBEKISTAN
  ['tashkent', { country: 'Uzbekistan', hardshipClass: 'A' }],
  ['termez', { country: 'Uzbekistan', hardshipClass: 'B' }],
  
  // VANUATU
  ['port vila', { country: 'Vanuatu', hardshipClass: 'B' }],
  
  // VENEZUELA
  ['caracas', { country: 'Venezuela', hardshipClass: 'C' }],
  ['ciudad guayana', { country: 'Venezuela', hardshipClass: 'D' }],
  ['guasdualito', { country: 'Venezuela', hardshipClass: 'D' }],
  ['maracaibo', { country: 'Venezuela', hardshipClass: 'D' }],
  ['san antonio del tachira', { country: 'Venezuela', hardshipClass: 'D' }],
  ['san cristobal', { country: 'Venezuela', hardshipClass: 'D' }],
  
  // VIETNAM
  ['hanoi', { country: 'Vietnam', hardshipClass: 'A' }],
  ['ho-chi-minh-ville', { country: 'Vietnam', hardshipClass: 'A' }],
  ['ho chi minh city', { country: 'Vietnam', hardshipClass: 'A' }],
  ['saigon', { country: 'Vietnam', hardshipClass: 'A' }],
  
  // WEST BANK
  ['ramallah', { country: 'West Bank', hardshipClass: 'C' }],
  
  // WESTERN SAHARA
  ['laayoune', { country: 'Western Sahara', hardshipClass: 'D' }],
  
  // YEMEN
  ['aden', { country: 'Yemen', hardshipClass: 'E' }],
  ['al-mokha', { country: 'Yemen', hardshipClass: 'E' }],
  ['hajjah', { country: 'Yemen', hardshipClass: 'E' }],
  ['hodeidah', { country: 'Yemen', hardshipClass: 'E' }],
  ['ibb', { country: 'Yemen', hardshipClass: 'E' }],
  ['marib', { country: 'Yemen', hardshipClass: 'E' }],
  ['mukalla', { country: 'Yemen', hardshipClass: 'E' }],
  ["sa'ada", { country: 'Yemen', hardshipClass: 'E' }],
  ['saada', { country: 'Yemen', hardshipClass: 'E' }],
  ["sana'a", { country: 'Yemen', hardshipClass: 'E' }],
  ['sanaa', { country: 'Yemen', hardshipClass: 'E' }],
  
  // ZAMBIA
  ['kawambwa', { country: 'Zambia', hardshipClass: 'E' }],
  ['lusaka', { country: 'Zambia', hardshipClass: 'B' }],
  ['nchelenge', { country: 'Zambia', hardshipClass: 'D' }],
  ['solwezi', { country: 'Zambia', hardshipClass: 'C' }],
  
  // ZIMBABWE
  ['harare', { country: 'Zimbabwe', hardshipClass: 'C' }],
  ['tongogara', { country: 'Zimbabwe', hardshipClass: 'D' }],
]);

// Default hardship class for country capitals not in the main list
export const COUNTRY_DEFAULT_CLASSIFICATIONS: Map<string, HardshipClass> = new Map([
  ['afghanistan', 'E'],
  ['albania', 'A'],
  ['algeria', 'A'],
  ['angola', 'B'],
  ['argentina', 'A'],
  ['armenia', 'A'],
  ['azerbaijan', 'A'],
  ['bahrain', 'A'],
  ['bangladesh', 'C'],
  ['barbados', 'A'],
  ['belarus', 'A'],
  ['belize', 'A'],
  ['benin', 'B'],
  ['bhutan', 'C'],
  ['bolivia', 'A'],
  ['bosnia and herzegovina', 'A'],
  ['botswana', 'A'],
  ['brazil', 'A'],
  ['burkina faso', 'D'],
  ['burundi', 'C'],
  ['cambodia', 'B'],
  ['cameroon', 'B'],
  ['cape verde', 'A'],
  ['central african republic', 'D'],
  ['chad', 'D'],
  ['chile', 'A'],
  ['china', 'A'],
  ['colombia', 'A'],
  ['comoros', 'D'],
  ['congo', 'B'],
  ['democratic republic of the congo', 'C'],
  ['drc', 'C'],
  ['costa rica', 'A'],
  ["cote d'ivoire", 'B'],
  ['ivory coast', 'B'],
  ['cuba', 'B'],
  ['djibouti', 'C'],
  ['dominica', 'B'],
  ['dominican republic', 'A'],
  ['ecuador', 'A'],
  ['egypt', 'A'],
  ['el salvador', 'A'],
  ['equatorial guinea', 'C'],
  ['eritrea', 'D'],
  ['eswatini', 'A'],
  ['swaziland', 'A'],
  ['ethiopia', 'B'],
  ['fiji', 'B'],
  ['gabon', 'A'],
  ['gambia', 'B'],
  ['georgia', 'A'],
  ['ghana', 'B'],
  ['grenada', 'A'],
  ['guatemala', 'A'],
  ['guinea', 'C'],
  ['guinea bissau', 'E'],
  ['guyana', 'A'],
  ['haiti', 'E'],
  ['honduras', 'B'],
  ['india', 'B'],
  ['indonesia', 'A'],
  ['iran', 'B'],
  ['iraq', 'D'],
  ['israel', 'B'],
  ['jamaica', 'A'],
  ['jordan', 'A'],
  ['kazakhstan', 'A'],
  ['kenya', 'B'],
  ['kiribati', 'D'],
  ['north korea', 'E'],
  ['south korea', 'A'],
  ['korea', 'A'],
  ['kuwait', 'A'],
  ['kyrgyzstan', 'B'],
  ['laos', 'B'],
  ['lebanon', 'D'],
  ['lesotho', 'C'],
  ['liberia', 'C'],
  ['libya', 'E'],
  ['madagascar', 'B'],
  ['malawi', 'B'],
  ['malaysia', 'A'],
  ['maldives', 'B'],
  ['mali', 'D'],
  ['marshall islands', 'C'],
  ['mauritania', 'D'],
  ['mauritius', 'A'],
  ['mexico', 'A'],
  ['micronesia', 'C'],
  ['moldova', 'A'],
  ['mongolia', 'B'],
  ['montenegro', 'A'],
  ['morocco', 'A'],
  ['mozambique', 'B'],
  ['myanmar', 'D'],
  ['namibia', 'A'],
  ['nauru', 'D'],
  ['nepal', 'B'],
  ['nicaragua', 'A'],
  ['niger', 'E'],
  ['nigeria', 'B'],
  ['oman', 'A'],
  ['pakistan', 'B'],
  ['palau', 'B'],
  ['panama', 'A'],
  ['papua new guinea', 'D'],
  ['paraguay', 'A'],
  ['peru', 'A'],
  ['philippines', 'A'],
  ['qatar', 'A'],
  ['russia', 'A'],
  ['russian federation', 'A'],
  ['rwanda', 'A'],
  ['samoa', 'B'],
  ['sao tome and principe', 'D'],
  ['saudi arabia', 'A'],
  ['senegal', 'A'],
  ['serbia', 'A'],
  ['seychelles', 'A'],
  ['sierra leone', 'C'],
  ['singapore', 'A'],
  ['solomon islands', 'D'],
  ['somalia', 'E'],
  ['south africa', 'A'],
  ['south sudan', 'E'],
  ['sri lanka', 'C'],
  ['sudan', 'E'],
  ['suriname', 'A'],
  ['syria', 'E'],
  ['syrian arab republic', 'E'],
  ['tajikistan', 'B'],
  ['tanzania', 'B'],
  ['thailand', 'A'],
  ['north macedonia', 'A'],
  ['macedonia', 'A'],
  ['timor-leste', 'C'],
  ['east timor', 'C'],
  ['togo', 'A'],
  ['tonga', 'B'],
  ['trinidad and tobago', 'A'],
  ['tunisia', 'A'],
  ['turkey', 'A'],
  ['turkiye', 'A'],
  ['turkmenistan', 'C'],
  ['tuvalu', 'C'],
  ['uganda', 'B'],
  ['ukraine', 'D'],
  ['united arab emirates', 'A'],
  ['uae', 'A'],
  ['uruguay', 'A'],
  ['uzbekistan', 'A'],
  ['vanuatu', 'B'],
  ['venezuela', 'C'],
  ['vietnam', 'A'],
  ['yemen', 'E'],
  ['zambia', 'B'],
  ['zimbabwe', 'C'],
  ['palestine', 'C'],
  ['west bank', 'C'],
  ['gaza', 'E'],
]);

// UN Regional groupings
export const UN_REGIONS: Record<string, string[]> = {
  'Sub-Saharan Africa': [
    'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 'cameroon', 'cape verde',
    'central african republic', 'chad', 'comoros', "cote d'ivoire", 'ivory coast', 
    'democratic republic of the congo', 'drc', 'congo', 'djibouti', 'equatorial guinea',
    'eritrea', 'eswatini', 'swaziland', 'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea',
    'guinea bissau', 'kenya', 'lesotho', 'liberia', 'madagascar', 'malawi', 'mali',
    'mauritania', 'mauritius', 'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda',
    'sao tome and principe', 'senegal', 'seychelles', 'sierra leone', 'somalia', 
    'south africa', 'south sudan', 'sudan', 'tanzania', 'togo', 'uganda', 'zambia', 'zimbabwe'
  ],
  'Asia & Pacific': [
    'afghanistan', 'bangladesh', 'bhutan', 'cambodia', 'china', 'fiji', 'india', 'indonesia',
    'japan', 'kiribati', 'north korea', 'south korea', 'korea', 'laos', 'malaysia', 'maldives',
    'marshall islands', 'micronesia', 'mongolia', 'myanmar', 'nauru', 'nepal', 'pakistan',
    'palau', 'papua new guinea', 'philippines', 'samoa', 'singapore', 'solomon islands',
    'sri lanka', 'thailand', 'timor-leste', 'east timor', 'tonga', 'tuvalu', 'vanuatu', 'vietnam'
  ],
  'Middle East & North Africa': [
    'algeria', 'bahrain', 'egypt', 'iran', 'iraq', 'israel', 'jordan', 'kuwait', 'lebanon',
    'libya', 'morocco', 'oman', 'palestine', 'west bank', 'gaza', 'qatar', 'saudi arabia',
    'syria', 'syrian arab republic', 'tunisia', 'turkey', 'turkiye', 'united arab emirates',
    'uae', 'yemen'
  ],
  'Latin America & Caribbean': [
    'antigua and barbuda', 'argentina', 'bahamas', 'barbados', 'belize', 'bolivia', 'brazil',
    'chile', 'colombia', 'costa rica', 'cuba', 'dominica', 'dominican republic', 'ecuador',
    'el salvador', 'grenada', 'guatemala', 'guyana', 'haiti', 'honduras', 'jamaica', 'mexico',
    'nicaragua', 'panama', 'paraguay', 'peru', 'st. kitts and nevis', 'st. lucia',
    'st. vincent and the grenadines', 'suriname', 'trinidad and tobago', 'uruguay', 'venezuela'
  ],
  'Europe & CIS': [
    'albania', 'armenia', 'azerbaijan', 'belarus', 'bosnia and herzegovina', 'georgia',
    'kazakhstan', 'kyrgyzstan', 'moldova', 'mongolia', 'montenegro', 'north macedonia',
    'macedonia', 'russia', 'russian federation', 'serbia', 'tajikistan', 'turkmenistan',
    'ukraine', 'uzbekistan'
  ],
  'Western Europe & Others': [
    'australia', 'austria', 'belgium', 'canada', 'cyprus', 'czech republic', 'czechia',
    'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'iceland',
    'ireland', 'italy', 'japan', 'latvia', 'lithuania', 'luxembourg', 'malta', 'netherlands',
    'new zealand', 'norway', 'poland', 'portugal', 'slovakia', 'slovenia', 'spain', 'sweden',
    'switzerland', 'united kingdom', 'uk', 'united states', 'usa', 'us'
  ]
};

/**
 * Get the UN region for a country
 */
export function getUNRegion(country: string): string {
  const normalizedCountry = (country || '').toLowerCase().trim();
  
  for (const [region, countries] of Object.entries(UN_REGIONS)) {
    if (countries.some(c => normalizedCountry.includes(c) || c.includes(normalizedCountry))) {
      return region;
    }
  }
  
  return 'Other';
}

/**
 * Get the hardship classification for a duty station
 */
export function getHardshipClassification(
  dutyStation: string, 
  dutyCountry: string
): { hardshipClass: HardshipClass; matchType: 'station' | 'country' | 'default' } {
  const normalizedStation = (dutyStation || '').toLowerCase().trim();
  const normalizedCountry = (dutyCountry || '').toLowerCase().trim();
  
  // Try exact station match first
  const stationMatch = ICSC_CLASSIFICATIONS.get(normalizedStation);
  if (stationMatch) {
    return { hardshipClass: stationMatch.hardshipClass, matchType: 'station' };
  }
  
  // Try partial station match
  for (const [station, classification] of ICSC_CLASSIFICATIONS.entries()) {
    if (normalizedStation.includes(station) || station.includes(normalizedStation)) {
      return { hardshipClass: classification.hardshipClass, matchType: 'station' };
    }
  }
  
  // Try country default
  for (const [country, hardshipClass] of COUNTRY_DEFAULT_CLASSIFICATIONS.entries()) {
    if (normalizedCountry.includes(country) || country.includes(normalizedCountry)) {
      return { hardshipClass, matchType: 'country' };
    }
  }
  
  // Default to unclassified
  return { hardshipClass: 'U', matchType: 'default' };
}





