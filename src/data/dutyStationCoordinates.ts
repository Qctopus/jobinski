/**
 * Duty Station Coordinates
 * Geographic coordinates for UN duty stations worldwide
 * Used for map visualization in the Geography Intelligence tab
 * 
 * Format: [longitude, latitude] (GeoJSON standard)
 */

export interface DutyStationCoord {
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  locationType: 'HQ' | 'Regional' | 'Field' | 'Home-based';
}

// HQ Locations (Major UN headquarters cities)
export const HQ_LOCATIONS = new Set([
  'new york', 'geneva', 'vienna', 'rome', 'nairobi', 'paris',
  'the hague', 'montreal', 'bonn', 'madrid', 'copenhagen',
  'washington', 'london', 'brussels'
]);

// Regional hub locations
export const REGIONAL_HUB_LOCATIONS = new Set([
  'bangkok', 'addis ababa', 'santiago', 'beirut', 'dakar',
  'johannesburg', 'panama city', 'istanbul', 'amman', 'cairo',
  'kathmandu', 'lima', 'pretoria', 'new delhi', 'jakarta',
  'abuja', 'bogota', 'mexico city', 'manila', 'kuala lumpur'
]);

/**
 * Comprehensive duty station coordinates database
 * Organized by region for easier maintenance
 */
export const DUTY_STATION_COORDINATES: Map<string, DutyStationCoord> = new Map([
  // ==================== UN HEADQUARTERS ====================
  ['new york', { name: 'New York', country: 'United States', coordinates: [-74.006, 40.7128], locationType: 'HQ' }],
  ['geneva', { name: 'Geneva', country: 'Switzerland', coordinates: [6.1432, 46.2044], locationType: 'HQ' }],
  ['vienna', { name: 'Vienna', country: 'Austria', coordinates: [16.3738, 48.2082], locationType: 'HQ' }],
  ['nairobi', { name: 'Nairobi', country: 'Kenya', coordinates: [36.8219, -1.2921], locationType: 'HQ' }],
  ['rome', { name: 'Rome', country: 'Italy', coordinates: [12.4964, 41.9028], locationType: 'HQ' }],
  ['paris', { name: 'Paris', country: 'France', coordinates: [2.3522, 48.8566], locationType: 'HQ' }],
  ['the hague', { name: 'The Hague', country: 'Netherlands', coordinates: [4.3007, 52.0705], locationType: 'HQ' }],
  ['montreal', { name: 'Montreal', country: 'Canada', coordinates: [-73.5673, 45.5017], locationType: 'HQ' }],
  ['bonn', { name: 'Bonn', country: 'Germany', coordinates: [7.0982, 50.7374], locationType: 'HQ' }],
  ['madrid', { name: 'Madrid', country: 'Spain', coordinates: [-3.7038, 40.4168], locationType: 'HQ' }],
  ['copenhagen', { name: 'Copenhagen', country: 'Denmark', coordinates: [12.5683, 55.6761], locationType: 'HQ' }],
  ['washington', { name: 'Washington D.C.', country: 'United States', coordinates: [-77.0369, 38.9072], locationType: 'HQ' }],
  ['london', { name: 'London', country: 'United Kingdom', coordinates: [-0.1276, 51.5074], locationType: 'HQ' }],
  ['brussels', { name: 'Brussels', country: 'Belgium', coordinates: [4.3517, 50.8503], locationType: 'HQ' }],

  // ==================== REGIONAL HUBS ====================
  ['bangkok', { name: 'Bangkok', country: 'Thailand', coordinates: [100.5018, 13.7563], locationType: 'Regional' }],
  ['addis ababa', { name: 'Addis Ababa', country: 'Ethiopia', coordinates: [38.7578, 9.0054], locationType: 'Regional' }],
  ['santiago', { name: 'Santiago', country: 'Chile', coordinates: [-70.6693, -33.4489], locationType: 'Regional' }],
  ['beirut', { name: 'Beirut', country: 'Lebanon', coordinates: [35.4956, 33.8886], locationType: 'Regional' }],
  ['dakar', { name: 'Dakar', country: 'Senegal', coordinates: [-17.4467, 14.7167], locationType: 'Regional' }],
  ['johannesburg', { name: 'Johannesburg', country: 'South Africa', coordinates: [28.0473, -26.2041], locationType: 'Regional' }],
  ['panama city', { name: 'Panama City', country: 'Panama', coordinates: [-79.5199, 8.9824], locationType: 'Regional' }],
  ['istanbul', { name: 'Istanbul', country: 'Turkey', coordinates: [28.9784, 41.0082], locationType: 'Regional' }],
  ['amman', { name: 'Amman', country: 'Jordan', coordinates: [35.9106, 31.9539], locationType: 'Regional' }],
  ['cairo', { name: 'Cairo', country: 'Egypt', coordinates: [31.2357, 30.0444], locationType: 'Regional' }],
  ['kathmandu', { name: 'Kathmandu', country: 'Nepal', coordinates: [85.324, 27.7172], locationType: 'Regional' }],
  ['lima', { name: 'Lima', country: 'Peru', coordinates: [-77.0428, -12.0464], locationType: 'Regional' }],
  ['pretoria', { name: 'Pretoria', country: 'South Africa', coordinates: [28.1881, -25.7461], locationType: 'Regional' }],
  ['new delhi', { name: 'New Delhi', country: 'India', coordinates: [77.209, 28.6139], locationType: 'Regional' }],
  ['jakarta', { name: 'Jakarta', country: 'Indonesia', coordinates: [106.8456, -6.2088], locationType: 'Regional' }],
  ['abuja', { name: 'Abuja', country: 'Nigeria', coordinates: [7.4951, 9.0579], locationType: 'Regional' }],
  ['bogota', { name: 'Bogota', country: 'Colombia', coordinates: [-74.0721, 4.711], locationType: 'Regional' }],
  ['mexico city', { name: 'Mexico City', country: 'Mexico', coordinates: [-99.1332, 19.4326], locationType: 'Regional' }],
  ['manila', { name: 'Manila', country: 'Philippines', coordinates: [120.9842, 14.5995], locationType: 'Regional' }],
  ['kuala lumpur', { name: 'Kuala Lumpur', country: 'Malaysia', coordinates: [101.6869, 3.139], locationType: 'Regional' }],

  // ==================== SUB-SAHARAN AFRICA ====================
  // East Africa
  ['juba', { name: 'Juba', country: 'South Sudan', coordinates: [31.5825, 4.8594], locationType: 'Field' }],
  ['malakal', { name: 'Malakal', country: 'South Sudan', coordinates: [31.6562, 9.5414], locationType: 'Field' }],
  ['bentiu', { name: 'Bentiu', country: 'South Sudan', coordinates: [29.8293, 9.2302], locationType: 'Field' }],
  ['bor', { name: 'Bor', country: 'South Sudan', coordinates: [31.5521, 6.2089], locationType: 'Field' }],
  ['wau', { name: 'Wau', country: 'South Sudan', coordinates: [27.9932, 7.7027], locationType: 'Field' }],
  ['kampala', { name: 'Kampala', country: 'Uganda', coordinates: [32.5825, 0.3476], locationType: 'Field' }],
  ['entebbe', { name: 'Entebbe', country: 'Uganda', coordinates: [32.4435, 0.0636], locationType: 'Field' }],
  ['kigali', { name: 'Kigali', country: 'Rwanda', coordinates: [30.0619, -1.9403], locationType: 'Field' }],
  ['bujumbura', { name: 'Bujumbura', country: 'Burundi', coordinates: [29.3639, -3.3792], locationType: 'Field' }],
  ['dar es salaam', { name: 'Dar es Salaam', country: 'Tanzania', coordinates: [39.2083, -6.7924], locationType: 'Field' }],
  ['arusha', { name: 'Arusha', country: 'Tanzania', coordinates: [36.6827, -3.3869], locationType: 'Field' }],
  ['mogadishu', { name: 'Mogadishu', country: 'Somalia', coordinates: [45.3182, 2.0469], locationType: 'Field' }],
  ['hargeisa', { name: 'Hargeisa', country: 'Somalia', coordinates: [44.064, 9.56], locationType: 'Field' }],
  ['djibouti', { name: 'Djibouti', country: 'Djibouti', coordinates: [43.1456, 11.5721], locationType: 'Field' }],
  ['asmara', { name: 'Asmara', country: 'Eritrea', coordinates: [38.9318, 15.3229], locationType: 'Field' }],
  ['mombasa', { name: 'Mombasa', country: 'Kenya', coordinates: [39.6682, -4.0435], locationType: 'Field' }],
  ['dadaab', { name: 'Dadaab', country: 'Kenya', coordinates: [40.3088, 0.0488], locationType: 'Field' }],
  ['kakuma', { name: 'Kakuma', country: 'Kenya', coordinates: [34.8516, 3.7126], locationType: 'Field' }],

  // West Africa
  ['lagos', { name: 'Lagos', country: 'Nigeria', coordinates: [3.3792, 6.5244], locationType: 'Field' }],
  ['maiduguri', { name: 'Maiduguri', country: 'Nigeria', coordinates: [13.1536, 11.8469], locationType: 'Field' }],
  ['accra', { name: 'Accra', country: 'Ghana', coordinates: [-0.187, 5.6037], locationType: 'Field' }],
  ['abidjan', { name: 'Abidjan', country: "Cote d'Ivoire", coordinates: [-4.0083, 5.3599], locationType: 'Field' }],
  ['monrovia', { name: 'Monrovia', country: 'Liberia', coordinates: [-10.8047, 6.2907], locationType: 'Field' }],
  ['freetown', { name: 'Freetown', country: 'Sierra Leone', coordinates: [-13.2317, 8.484], locationType: 'Field' }],
  ['conakry', { name: 'Conakry', country: 'Guinea', coordinates: [-13.7, 9.509], locationType: 'Field' }],
  ['bissau', { name: 'Bissau', country: 'Guinea-Bissau', coordinates: [-15.598, 11.8636], locationType: 'Field' }],
  ['bamako', { name: 'Bamako', country: 'Mali', coordinates: [-8.0029, 12.6392], locationType: 'Field' }],
  ['ouagadougou', { name: 'Ouagadougou', country: 'Burkina Faso', coordinates: [-1.5197, 12.3714], locationType: 'Field' }],
  ['niamey', { name: 'Niamey', country: 'Niger', coordinates: [2.1098, 13.5116], locationType: 'Field' }],
  ['nouakchott', { name: 'Nouakchott', country: 'Mauritania', coordinates: [-15.9785, 18.0735], locationType: 'Field' }],
  ['cotonou', { name: 'Cotonou', country: 'Benin', coordinates: [2.3158, 6.3703], locationType: 'Field' }],
  ['lome', { name: 'Lome', country: 'Togo', coordinates: [1.2255, 6.1375], locationType: 'Field' }],
  ['banjul', { name: 'Banjul', country: 'Gambia', coordinates: [-16.5885, 13.4549], locationType: 'Field' }],
  ['praia', { name: 'Praia', country: 'Cape Verde', coordinates: [-23.5087, 14.933], locationType: 'Field' }],
  ['gao', { name: 'Gao', country: 'Mali', coordinates: [-0.0403, 16.2667], locationType: 'Field' }],
  ['mopti', { name: 'Mopti', country: 'Mali', coordinates: [-4.197, 14.4974], locationType: 'Field' }],
  ['timbuktu', { name: 'Timbuktu', country: 'Mali', coordinates: [-3.0074, 16.7666], locationType: 'Field' }],
  ['diffa', { name: 'Diffa', country: 'Niger', coordinates: [12.6089, 13.3154], locationType: 'Field' }],
  ['agadez', { name: 'Agadez', country: 'Niger', coordinates: [7.9911, 16.9737], locationType: 'Field' }],

  // Central Africa
  ['kinshasa', { name: 'Kinshasa', country: 'Democratic Republic of the Congo', coordinates: [15.2663, -4.4419], locationType: 'Field' }],
  ['goma', { name: 'Goma', country: 'Democratic Republic of the Congo', coordinates: [29.2288, -1.6587], locationType: 'Field' }],
  ['bukavu', { name: 'Bukavu', country: 'Democratic Republic of the Congo', coordinates: [28.8603, -2.5083], locationType: 'Field' }],
  ['lubumbashi', { name: 'Lubumbashi', country: 'Democratic Republic of the Congo', coordinates: [27.4794, -11.6647], locationType: 'Field' }],
  ['bunia', { name: 'Bunia', country: 'Democratic Republic of the Congo', coordinates: [30.2507, 1.5658], locationType: 'Field' }],
  ['kananga', { name: 'Kananga', country: 'Democratic Republic of the Congo', coordinates: [22.4166, -5.896], locationType: 'Field' }],
  ['bangui', { name: 'Bangui', country: 'Central African Republic', coordinates: [18.5582, 4.3947], locationType: 'Field' }],
  ['brazzaville', { name: 'Brazzaville', country: 'Congo', coordinates: [15.2832, -4.2634], locationType: 'Field' }],
  ['libreville', { name: 'Libreville', country: 'Gabon', coordinates: [9.4673, 0.4162], locationType: 'Field' }],
  ['yaounde', { name: 'Yaounde', country: 'Cameroon', coordinates: [11.5021, 3.8480], locationType: 'Field' }],
  ['douala', { name: 'Douala', country: 'Cameroon', coordinates: [9.7679, 4.0511], locationType: 'Field' }],
  ['ndjamena', { name: "N'Djamena", country: 'Chad', coordinates: [15.0444, 12.1348], locationType: 'Field' }],
  ['abeche', { name: 'Abeche', country: 'Chad', coordinates: [20.8324, 13.8292], locationType: 'Field' }],
  ['malabo', { name: 'Malabo', country: 'Equatorial Guinea', coordinates: [8.7737, 3.7523], locationType: 'Field' }],

  // Southern Africa
  ['cape town', { name: 'Cape Town', country: 'South Africa', coordinates: [18.4241, -33.9249], locationType: 'Field' }],
  ['durban', { name: 'Durban', country: 'South Africa', coordinates: [31.0218, -29.8587], locationType: 'Field' }],
  ['maputo', { name: 'Maputo', country: 'Mozambique', coordinates: [32.5732, -25.9692], locationType: 'Field' }],
  ['pemba', { name: 'Pemba', country: 'Mozambique', coordinates: [40.5176, -12.9739], locationType: 'Field' }],
  ['lusaka', { name: 'Lusaka', country: 'Zambia', coordinates: [28.2871, -15.3875], locationType: 'Field' }],
  ['harare', { name: 'Harare', country: 'Zimbabwe', coordinates: [31.0534, -17.8292], locationType: 'Field' }],
  ['lilongwe', { name: 'Lilongwe', country: 'Malawi', coordinates: [33.787, -13.9626], locationType: 'Field' }],
  ['antananarivo', { name: 'Antananarivo', country: 'Madagascar', coordinates: [47.5361, -18.8792], locationType: 'Field' }],
  ['windhoek', { name: 'Windhoek', country: 'Namibia', coordinates: [17.0858, -22.5609], locationType: 'Field' }],
  ['gaborone', { name: 'Gaborone', country: 'Botswana', coordinates: [25.9201, -24.6282], locationType: 'Field' }],
  ['maseru', { name: 'Maseru', country: 'Lesotho', coordinates: [27.4869, -29.3151], locationType: 'Field' }],
  ['mbabane', { name: 'Mbabane', country: 'Eswatini', coordinates: [31.1367, -26.3054], locationType: 'Field' }],
  ['moroni', { name: 'Moroni', country: 'Comoros', coordinates: [43.2551, -11.7022], locationType: 'Field' }],
  ['luanda', { name: 'Luanda', country: 'Angola', coordinates: [13.2343, -8.8383], locationType: 'Field' }],
  ['port louis', { name: 'Port Louis', country: 'Mauritius', coordinates: [57.4989, -20.1609], locationType: 'Field' }],

  // ==================== MIDDLE EAST & NORTH AFRICA ====================
  ['baghdad', { name: 'Baghdad', country: 'Iraq', coordinates: [44.3661, 33.3152], locationType: 'Field' }],
  ['erbil', { name: 'Erbil', country: 'Iraq', coordinates: [44.0088, 36.1911], locationType: 'Field' }],
  ['basra', { name: 'Basra', country: 'Iraq', coordinates: [47.7833, 30.5085], locationType: 'Field' }],
  ['mosul', { name: 'Mosul', country: 'Iraq', coordinates: [43.1189, 36.3409], locationType: 'Field' }],
  ['damascus', { name: 'Damascus', country: 'Syria', coordinates: [36.2765, 33.5138], locationType: 'Field' }],
  ['aleppo', { name: 'Aleppo', country: 'Syria', coordinates: [37.1343, 36.2021], locationType: 'Field' }],
  ['homs', { name: 'Homs', country: 'Syria', coordinates: [36.7167, 34.7324], locationType: 'Field' }],
  ['qamishli', { name: 'Qamishli', country: 'Syria', coordinates: [41.2263, 37.0522], locationType: 'Field' }],
  ['sanaa', { name: "Sana'a", country: 'Yemen', coordinates: [44.2075, 15.3694], locationType: 'Field' }],
  ['aden', { name: 'Aden', country: 'Yemen', coordinates: [45.0356, 12.788], locationType: 'Field' }],
  ['hodeidah', { name: 'Hodeidah', country: 'Yemen', coordinates: [42.9511, 14.7978], locationType: 'Field' }],
  ['tehran', { name: 'Tehran', country: 'Iran', coordinates: [51.389, 35.6892], locationType: 'Field' }],
  ['tripoli', { name: 'Tripoli', country: 'Libya', coordinates: [13.1913, 32.8872], locationType: 'Field' }],
  ['benghazi', { name: 'Benghazi', country: 'Libya', coordinates: [20.0686, 32.1167], locationType: 'Field' }],
  ['algiers', { name: 'Algiers', country: 'Algeria', coordinates: [3.0588, 36.7538], locationType: 'Field' }],
  ['tunis', { name: 'Tunis', country: 'Tunisia', coordinates: [10.1815, 36.8065], locationType: 'Field' }],
  ['rabat', { name: 'Rabat', country: 'Morocco', coordinates: [-6.8498, 33.9716], locationType: 'Field' }],
  ['riyadh', { name: 'Riyadh', country: 'Saudi Arabia', coordinates: [46.6753, 24.7136], locationType: 'Field' }],
  ['jeddah', { name: 'Jeddah', country: 'Saudi Arabia', coordinates: [39.1728, 21.4858], locationType: 'Field' }],
  ['dubai', { name: 'Dubai', country: 'United Arab Emirates', coordinates: [55.2708, 25.2048], locationType: 'Field' }],
  ['abu dhabi', { name: 'Abu Dhabi', country: 'United Arab Emirates', coordinates: [54.3773, 24.4539], locationType: 'Field' }],
  ['doha', { name: 'Doha', country: 'Qatar', coordinates: [51.5074, 25.2854], locationType: 'Field' }],
  ['kuwait city', { name: 'Kuwait City', country: 'Kuwait', coordinates: [47.9774, 29.3759], locationType: 'Field' }],
  ['manama', { name: 'Manama', country: 'Bahrain', coordinates: [50.5577, 26.2285], locationType: 'Field' }],
  ['muscat', { name: 'Muscat', country: 'Oman', coordinates: [58.3829, 23.5880], locationType: 'Field' }],
  ['tel aviv', { name: 'Tel Aviv', country: 'Israel', coordinates: [34.7818, 32.0853], locationType: 'Field' }],
  ['jerusalem', { name: 'Jerusalem', country: 'Israel/Palestine', coordinates: [35.2137, 31.7683], locationType: 'Field' }],
  ['ramallah', { name: 'Ramallah', country: 'West Bank', coordinates: [35.2061, 31.9038], locationType: 'Field' }],
  ['gaza', { name: 'Gaza', country: 'Gaza', coordinates: [34.4668, 31.5017], locationType: 'Field' }],
  ['gaziantep', { name: 'Gaziantep', country: 'Turkey', coordinates: [37.3825, 37.0594], locationType: 'Field' }],
  ['ankara', { name: 'Ankara', country: 'Turkey', coordinates: [32.8597, 39.9334], locationType: 'Field' }],

  // ==================== ASIA & PACIFIC ====================
  // South Asia
  ['dhaka', { name: 'Dhaka', country: 'Bangladesh', coordinates: [90.4125, 23.8103], locationType: 'Field' }],
  ["cox's bazar", { name: "Cox's Bazar", country: 'Bangladesh', coordinates: [91.9847, 21.4272], locationType: 'Field' }],
  ['islamabad', { name: 'Islamabad', country: 'Pakistan', coordinates: [73.0479, 33.6844], locationType: 'Field' }],
  ['karachi', { name: 'Karachi', country: 'Pakistan', coordinates: [67.0011, 24.8607], locationType: 'Field' }],
  ['peshawar', { name: 'Peshawar', country: 'Pakistan', coordinates: [71.5249, 34.0151], locationType: 'Field' }],
  ['quetta', { name: 'Quetta', country: 'Pakistan', coordinates: [67.0011, 30.1798], locationType: 'Field' }],
  ['mumbai', { name: 'Mumbai', country: 'India', coordinates: [72.8777, 19.0760], locationType: 'Field' }],
  ['kolkata', { name: 'Kolkata', country: 'India', coordinates: [88.3639, 22.5726], locationType: 'Field' }],
  ['colombo', { name: 'Colombo', country: 'Sri Lanka', coordinates: [79.8612, 6.9271], locationType: 'Field' }],
  ['thimphu', { name: 'Thimphu', country: 'Bhutan', coordinates: [89.6386, 27.4728], locationType: 'Field' }],
  ['male', { name: 'Male', country: 'Maldives', coordinates: [73.5093, 4.1755], locationType: 'Field' }],

  // Central Asia
  ['kabul', { name: 'Kabul', country: 'Afghanistan', coordinates: [69.1723, 34.5281], locationType: 'Field' }],
  ['herat', { name: 'Herat', country: 'Afghanistan', coordinates: [62.1998, 34.3529], locationType: 'Field' }],
  ['kandahar', { name: 'Kandahar', country: 'Afghanistan', coordinates: [65.7101, 31.6289], locationType: 'Field' }],
  ['mazar-i-sharif', { name: 'Mazar-i-Sharif', country: 'Afghanistan', coordinates: [67.1006, 36.7069], locationType: 'Field' }],
  ['dushanbe', { name: 'Dushanbe', country: 'Tajikistan', coordinates: [68.7870, 38.5598], locationType: 'Field' }],
  ['bishkek', { name: 'Bishkek', country: 'Kyrgyzstan', coordinates: [74.5698, 42.8746], locationType: 'Field' }],
  ['tashkent', { name: 'Tashkent', country: 'Uzbekistan', coordinates: [69.2401, 41.2995], locationType: 'Field' }],
  ['ashgabat', { name: 'Ashgabat', country: 'Turkmenistan', coordinates: [58.3833, 37.9601], locationType: 'Field' }],
  ['almaty', { name: 'Almaty', country: 'Kazakhstan', coordinates: [76.9286, 43.2220], locationType: 'Field' }],
  ['astana', { name: 'Astana', country: 'Kazakhstan', coordinates: [71.4491, 51.1605], locationType: 'Field' }],

  // Southeast Asia
  ['yangon', { name: 'Yangon', country: 'Myanmar', coordinates: [96.1951, 16.8661], locationType: 'Field' }],
  ['naypyidaw', { name: 'Naypyidaw', country: 'Myanmar', coordinates: [96.1297, 19.7633], locationType: 'Field' }],
  ['sittwe', { name: 'Sittwe', country: 'Myanmar', coordinates: [92.8987, 20.1527], locationType: 'Field' }],
  ['phnom penh', { name: 'Phnom Penh', country: 'Cambodia', coordinates: [104.9282, 11.5564], locationType: 'Field' }],
  ['vientiane', { name: 'Vientiane', country: 'Laos', coordinates: [102.6331, 17.9757], locationType: 'Field' }],
  ['hanoi', { name: 'Hanoi', country: 'Vietnam', coordinates: [105.8342, 21.0278], locationType: 'Field' }],
  ['ho chi minh city', { name: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6297, 10.8231], locationType: 'Field' }],
  ['singapore', { name: 'Singapore', country: 'Singapore', coordinates: [103.8198, 1.3521], locationType: 'Field' }],
  ['dili', { name: 'Dili', country: 'Timor-Leste', coordinates: [125.5736, -8.5569], locationType: 'Field' }],

  // East Asia
  ['beijing', { name: 'Beijing', country: 'China', coordinates: [116.4074, 39.9042], locationType: 'Field' }],
  ['shanghai', { name: 'Shanghai', country: 'China', coordinates: [121.4737, 31.2304], locationType: 'Field' }],
  ['seoul', { name: 'Seoul', country: 'South Korea', coordinates: [126.9780, 37.5665], locationType: 'Field' }],
  ['pyongyang', { name: 'Pyongyang', country: 'North Korea', coordinates: [125.7552, 39.0392], locationType: 'Field' }],
  ['ulaanbaatar', { name: 'Ulaanbaatar', country: 'Mongolia', coordinates: [106.9057, 47.8864], locationType: 'Field' }],
  ['tokyo', { name: 'Tokyo', country: 'Japan', coordinates: [139.6917, 35.6895], locationType: 'Field' }],

  // Pacific
  ['suva', { name: 'Suva', country: 'Fiji', coordinates: [178.4419, -18.1416], locationType: 'Field' }],
  ['port moresby', { name: 'Port Moresby', country: 'Papua New Guinea', coordinates: [147.1803, -9.4438], locationType: 'Field' }],
  ['honiara', { name: 'Honiara', country: 'Solomon Islands', coordinates: [159.9729, -9.4456], locationType: 'Field' }],
  ['port vila', { name: 'Port Vila', country: 'Vanuatu', coordinates: [168.3273, -17.7334], locationType: 'Field' }],
  ['apia', { name: 'Apia', country: 'Samoa', coordinates: [-171.7518, -13.8507], locationType: 'Field' }],
  ['nukualofa', { name: "Nuku'alofa", country: 'Tonga', coordinates: [-175.2026, -21.2114], locationType: 'Field' }],
  ['tarawa', { name: 'Tarawa', country: 'Kiribati', coordinates: [172.9717, 1.3282], locationType: 'Field' }],
  ['majuro', { name: 'Majuro', country: 'Marshall Islands', coordinates: [171.3803, 7.0897], locationType: 'Field' }],

  // ==================== LATIN AMERICA & CARIBBEAN ====================
  ['brasilia', { name: 'Brasilia', country: 'Brazil', coordinates: [-47.9292, -15.7801], locationType: 'Field' }],
  ['sao paulo', { name: 'Sao Paulo', country: 'Brazil', coordinates: [-46.6333, -23.5505], locationType: 'Field' }],
  ['rio de janeiro', { name: 'Rio de Janeiro', country: 'Brazil', coordinates: [-43.1729, -22.9068], locationType: 'Field' }],
  ['buenos aires', { name: 'Buenos Aires', country: 'Argentina', coordinates: [-58.3816, -34.6037], locationType: 'Field' }],
  ['caracas', { name: 'Caracas', country: 'Venezuela', coordinates: [-66.9036, 10.4806], locationType: 'Field' }],
  ['quito', { name: 'Quito', country: 'Ecuador', coordinates: [-78.4678, -0.1807], locationType: 'Field' }],
  ['la paz', { name: 'La Paz', country: 'Bolivia', coordinates: [-68.1193, -16.4897], locationType: 'Field' }],
  ['asuncion', { name: 'Asuncion', country: 'Paraguay', coordinates: [-57.5759, -25.2637], locationType: 'Field' }],
  ['montevideo', { name: 'Montevideo', country: 'Uruguay', coordinates: [-56.1645, -34.9011], locationType: 'Field' }],
  ['guatemala city', { name: 'Guatemala City', country: 'Guatemala', coordinates: [-90.5069, 14.6349], locationType: 'Field' }],
  ['tegucigalpa', { name: 'Tegucigalpa', country: 'Honduras', coordinates: [-87.2068, 14.0723], locationType: 'Field' }],
  ['san salvador', { name: 'San Salvador', country: 'El Salvador', coordinates: [-89.1872, 13.6929], locationType: 'Field' }],
  ['managua', { name: 'Managua', country: 'Nicaragua', coordinates: [-86.2362, 12.1150], locationType: 'Field' }],
  ['san jose', { name: 'San Jose', country: 'Costa Rica', coordinates: [-84.0907, 9.9281], locationType: 'Field' }],
  ['havana', { name: 'Havana', country: 'Cuba', coordinates: [-82.3666, 23.1136], locationType: 'Field' }],
  ['kingston', { name: 'Kingston', country: 'Jamaica', coordinates: [-76.7936, 18.0179], locationType: 'Field' }],
  ['port-au-prince', { name: 'Port-au-Prince', country: 'Haiti', coordinates: [-72.3288, 18.5944], locationType: 'Field' }],
  ['santo domingo', { name: 'Santo Domingo', country: 'Dominican Republic', coordinates: [-69.9312, 18.4861], locationType: 'Field' }],
  ['bridgetown', { name: 'Bridgetown', country: 'Barbados', coordinates: [-59.5997, 13.1067], locationType: 'Field' }],
  ['port of spain', { name: 'Port of Spain', country: 'Trinidad and Tobago', coordinates: [-61.5087, 10.6596], locationType: 'Field' }],
  ['cucuta', { name: 'Cucuta', country: 'Colombia', coordinates: [-72.5051, 7.8939], locationType: 'Field' }],
  ['cali', { name: 'Cali', country: 'Colombia', coordinates: [-76.5320, 3.4516], locationType: 'Field' }],
  ['medellin', { name: 'Medellin', country: 'Colombia', coordinates: [-75.5636, 6.2476], locationType: 'Field' }],
  ['tapachula', { name: 'Tapachula', country: 'Mexico', coordinates: [-92.2626, 14.9035], locationType: 'Field' }],
  ['tijuana', { name: 'Tijuana', country: 'Mexico', coordinates: [-117.0382, 32.5149], locationType: 'Field' }],

  // ==================== EUROPE & CIS ====================
  ['kyiv', { name: 'Kyiv', country: 'Ukraine', coordinates: [30.5234, 50.4501], locationType: 'Field' }],
  ['lviv', { name: 'Lviv', country: 'Ukraine', coordinates: [24.0297, 49.8397], locationType: 'Field' }],
  ['kharkiv', { name: 'Kharkiv', country: 'Ukraine', coordinates: [36.2310, 49.9935], locationType: 'Field' }],
  ['odesa', { name: 'Odesa', country: 'Ukraine', coordinates: [30.7233, 46.4825], locationType: 'Field' }],
  ['odessa', { name: 'Odessa', country: 'Ukraine', coordinates: [30.7233, 46.4825], locationType: 'Field' }], // Alternate spelling
  ['dnipro', { name: 'Dnipro', country: 'Ukraine', coordinates: [35.0462, 48.4647], locationType: 'Field' }],
  ['moscow', { name: 'Moscow', country: 'Russia', coordinates: [37.6173, 55.7558], locationType: 'Field' }],
  ['minsk', { name: 'Minsk', country: 'Belarus', coordinates: [27.5615, 53.9006], locationType: 'Field' }],
  ['chisinau', { name: 'Chisinau', country: 'Moldova', coordinates: [28.8638, 47.0105], locationType: 'Field' }],
  ['tbilisi', { name: 'Tbilisi', country: 'Georgia', coordinates: [44.7833, 41.7151], locationType: 'Field' }],
  ['yerevan', { name: 'Yerevan', country: 'Armenia', coordinates: [44.5152, 40.1792], locationType: 'Field' }],
  ['baku', { name: 'Baku', country: 'Azerbaijan', coordinates: [49.8671, 40.4093], locationType: 'Field' }],
  ['sarajevo', { name: 'Sarajevo', country: 'Bosnia and Herzegovina', coordinates: [18.4131, 43.8563], locationType: 'Field' }],
  ['pristina', { name: 'Pristina', country: 'Kosovo', coordinates: [21.1655, 42.6629], locationType: 'Field' }],
  ['belgrade', { name: 'Belgrade', country: 'Serbia', coordinates: [20.4651, 44.7866], locationType: 'Field' }],
  ['skopje', { name: 'Skopje', country: 'North Macedonia', coordinates: [21.4254, 41.9973], locationType: 'Field' }],
  ['podgorica', { name: 'Podgorica', country: 'Montenegro', coordinates: [19.2636, 42.4304], locationType: 'Field' }],
  ['tirana', { name: 'Tirana', country: 'Albania', coordinates: [19.8187, 41.3275], locationType: 'Field' }],

  // ==================== SUDAN REGION ====================
  ['khartoum', { name: 'Khartoum', country: 'Sudan', coordinates: [32.5599, 15.5007], locationType: 'Field' }],
  ['el fasher', { name: 'El Fasher', country: 'Sudan', coordinates: [25.3615, 13.6281], locationType: 'Field' }],
  ['nyala', { name: 'Nyala', country: 'Sudan', coordinates: [24.8902, 12.0492], locationType: 'Field' }],
  ['el geneina', { name: 'El Geneina', country: 'Sudan', coordinates: [22.4478, 13.4505], locationType: 'Field' }],
  ['kassala', { name: 'Kassala', country: 'Sudan', coordinates: [36.3996, 15.4543], locationType: 'Field' }],
  ['port sudan', { name: 'Port Sudan', country: 'Sudan', coordinates: [37.2159, 19.6158], locationType: 'Field' }],
  ['kadugli', { name: 'Kadugli', country: 'Sudan', coordinates: [29.7178, 11.0109], locationType: 'Field' }],
]);

/**
 * Country capital coordinates for fallback
 */
export const COUNTRY_CAPITAL_COORDINATES: Map<string, [number, number]> = new Map([
  ['afghanistan', [69.1723, 34.5281]],
  ['albania', [19.8187, 41.3275]],
  ['algeria', [3.0588, 36.7538]],
  ['angola', [13.2343, -8.8383]],
  ['argentina', [-58.3816, -34.6037]],
  ['armenia', [44.5152, 40.1792]],
  ['australia', [149.1300, -35.2809]],
  ['austria', [16.3738, 48.2082]],
  ['azerbaijan', [49.8671, 40.4093]],
  ['bangladesh', [90.4125, 23.8103]],
  ['belarus', [27.5615, 53.9006]],
  ['belgium', [4.3517, 50.8503]],
  ['benin', [2.3158, 6.3703]],
  ['bhutan', [89.6386, 27.4728]],
  ['bolivia', [-68.1193, -16.4897]],
  ['bosnia and herzegovina', [18.4131, 43.8563]],
  ['botswana', [25.9201, -24.6282]],
  ['brazil', [-47.9292, -15.7801]],
  ['burkina faso', [-1.5197, 12.3714]],
  ['burundi', [29.3639, -3.3792]],
  ['cambodia', [104.9282, 11.5564]],
  ['cameroon', [11.5021, 3.8480]],
  ['canada', [-75.6972, 45.4215]],
  ['central african republic', [18.5582, 4.3947]],
  ['chad', [15.0444, 12.1348]],
  ['chile', [-70.6693, -33.4489]],
  ['china', [116.4074, 39.9042]],
  ['colombia', [-74.0721, 4.711]],
  ['comoros', [43.2551, -11.7022]],
  ['congo', [15.2832, -4.2634]],
  ['democratic republic of the congo', [15.2663, -4.4419]],
  ['costa rica', [-84.0907, 9.9281]],
  ["cote d'ivoire", [-4.0083, 5.3599]],
  ['cuba', [-82.3666, 23.1136]],
  ['djibouti', [43.1456, 11.5721]],
  ['dominican republic', [-69.9312, 18.4861]],
  ['ecuador', [-78.4678, -0.1807]],
  ['egypt', [31.2357, 30.0444]],
  ['el salvador', [-89.1872, 13.6929]],
  ['eritrea', [38.9318, 15.3229]],
  ['eswatini', [31.1367, -26.3054]],
  ['ethiopia', [38.7578, 9.0054]],
  ['fiji', [178.4419, -18.1416]],
  ['france', [2.3522, 48.8566]],
  ['gabon', [9.4673, 0.4162]],
  ['gambia', [-16.5885, 13.4549]],
  ['georgia', [44.7833, 41.7151]],
  ['germany', [13.4050, 52.5200]],
  ['ghana', [-0.187, 5.6037]],
  ['guatemala', [-90.5069, 14.6349]],
  ['guinea', [-13.7, 9.509]],
  ['guinea-bissau', [-15.598, 11.8636]],
  ['haiti', [-72.3288, 18.5944]],
  ['honduras', [-87.2068, 14.0723]],
  ['india', [77.209, 28.6139]],
  ['indonesia', [106.8456, -6.2088]],
  ['iran', [51.389, 35.6892]],
  ['iraq', [44.3661, 33.3152]],
  ['israel', [35.2137, 31.7683]],
  ['italy', [12.4964, 41.9028]],
  ['jamaica', [-76.7936, 18.0179]],
  ['japan', [139.6917, 35.6895]],
  ['jordan', [35.9106, 31.9539]],
  ['kazakhstan', [71.4491, 51.1605]],
  ['kenya', [36.8219, -1.2921]],
  ['kyrgyzstan', [74.5698, 42.8746]],
  ['laos', [102.6331, 17.9757]],
  ['lebanon', [35.4956, 33.8886]],
  ['lesotho', [27.4869, -29.3151]],
  ['liberia', [-10.8047, 6.2907]],
  ['libya', [13.1913, 32.8872]],
  ['madagascar', [47.5361, -18.8792]],
  ['malawi', [33.787, -13.9626]],
  ['malaysia', [101.6869, 3.139]],
  ['maldives', [73.5093, 4.1755]],
  ['mali', [-8.0029, 12.6392]],
  ['mauritania', [-15.9785, 18.0735]],
  ['mexico', [-99.1332, 19.4326]],
  ['moldova', [28.8638, 47.0105]],
  ['mongolia', [106.9057, 47.8864]],
  ['montenegro', [19.2636, 42.4304]],
  ['morocco', [-6.8498, 33.9716]],
  ['mozambique', [32.5732, -25.9692]],
  ['myanmar', [96.1951, 16.8661]],
  ['namibia', [17.0858, -22.5609]],
  ['nepal', [85.324, 27.7172]],
  ['netherlands', [4.9041, 52.3676]],
  ['nicaragua', [-86.2362, 12.1150]],
  ['niger', [2.1098, 13.5116]],
  ['nigeria', [7.4951, 9.0579]],
  ['north korea', [125.7552, 39.0392]],
  ['north macedonia', [21.4254, 41.9973]],
  ['pakistan', [73.0479, 33.6844]],
  ['panama', [-79.5199, 8.9824]],
  ['papua new guinea', [147.1803, -9.4438]],
  ['paraguay', [-57.5759, -25.2637]],
  ['peru', [-77.0428, -12.0464]],
  ['philippines', [120.9842, 14.5995]],
  ['poland', [21.0122, 52.2297]],
  ['qatar', [51.5074, 25.2854]],
  ['russia', [37.6173, 55.7558]],
  ['rwanda', [30.0619, -1.9403]],
  ['saudi arabia', [46.6753, 24.7136]],
  ['senegal', [-17.4467, 14.7167]],
  ['serbia', [20.4651, 44.7866]],
  ['sierra leone', [-13.2317, 8.484]],
  ['singapore', [103.8198, 1.3521]],
  ['somalia', [45.3182, 2.0469]],
  ['south africa', [28.0473, -26.2041]],
  ['south korea', [126.9780, 37.5665]],
  ['south sudan', [31.5825, 4.8594]],
  ['spain', [-3.7038, 40.4168]],
  ['sri lanka', [79.8612, 6.9271]],
  ['sudan', [32.5599, 15.5007]],
  ['sweden', [18.0686, 59.3293]],
  ['switzerland', [7.4474, 46.9481]],
  ['syria', [36.2765, 33.5138]],
  ['tajikistan', [68.7870, 38.5598]],
  ['tanzania', [39.2083, -6.7924]],
  ['thailand', [100.5018, 13.7563]],
  ['timor-leste', [125.5736, -8.5569]],
  ['togo', [1.2255, 6.1375]],
  ['trinidad and tobago', [-61.5087, 10.6596]],
  ['tunisia', [10.1815, 36.8065]],
  ['turkey', [32.8597, 39.9334]],
  ['türkiye', [32.8597, 39.9334]], // Modern official name
  ['turkiye', [32.8597, 39.9334]], // Without special char
  ['turkmenistan', [58.3833, 37.9601]],
  ['uganda', [32.5825, 0.3476]],
  ['ukraine', [30.5234, 50.4501]],
  ['united arab emirates', [54.3773, 24.4539]],
  ['united kingdom', [-0.1276, 51.5074]],
  ['united states', [-77.0369, 38.9072]],
  ['uruguay', [-56.1645, -34.9011]],
  ['uzbekistan', [69.2401, 41.2995]],
  ['venezuela', [-66.9036, 10.4806]],
  ['vietnam', [105.8342, 21.0278]],
  ['yemen', [44.2075, 15.3694]],
  ['zambia', [28.2871, -15.3875]],
  ['zimbabwe', [31.0534, -17.8292]],
  ['west bank', [35.2061, 31.9038]],
  ['gaza', [34.4668, 31.5017]],
  ['palestine', [35.2061, 31.9038]],
]);

/**
 * Get coordinates for a duty station
 * Falls back to country capital if station not found
 */
/**
 * Normalize a string for matching - removes diacritics and special characters
 */
function normalizeForMatching(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    // Normalize unicode characters (removes diacritics)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace common Turkish characters
    .replace(/ü/g, 'u')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g');
}

export function getDutyStationCoordinates(
  dutyStation: string,
  dutyCountry: string
): { coordinates: [number, number]; locationType: 'HQ' | 'Regional' | 'Field' | 'Home-based'; matchType: 'station' | 'country' | 'default' } {
  const normalizedStation = normalizeForMatching(dutyStation);
  const normalizedCountry = normalizeForMatching(dutyCountry);
  
  // Check for home-based
  if (normalizedStation.includes('home') || normalizedStation.includes('remote') || normalizedStation.includes('telecommut')) {
    // For home-based, use country capital
    const countryCoords = COUNTRY_CAPITAL_COORDINATES.get(normalizedCountry);
    if (countryCoords) {
      return { coordinates: countryCoords, locationType: 'Home-based', matchType: 'country' };
    }
    // Try with normalized country name
    for (const [country, coords] of COUNTRY_CAPITAL_COORDINATES.entries()) {
      if (normalizeForMatching(country) === normalizedCountry) {
        return { coordinates: coords, locationType: 'Home-based', matchType: 'country' };
      }
    }
    return { coordinates: [0, 0], locationType: 'Home-based', matchType: 'default' };
  }
  
  // Try exact station match
  const stationMatch = DUTY_STATION_COORDINATES.get(normalizedStation);
  if (stationMatch) {
    return { coordinates: stationMatch.coordinates, locationType: stationMatch.locationType, matchType: 'station' };
  }
  
  // Try partial station match (but require minimum 4 characters to avoid false matches)
  if (normalizedStation.length >= 4) {
    for (const [station, data] of DUTY_STATION_COORDINATES.entries()) {
      // Only match if the station name is reasonably similar (not just a substring)
      if (station.length >= 4 && (normalizedStation.includes(station) || station.includes(normalizedStation))) {
        return { coordinates: data.coordinates, locationType: data.locationType, matchType: 'station' };
      }
    }
  }
  
  // Try country capital - first try exact match
  const exactCountryMatch = COUNTRY_CAPITAL_COORDINATES.get(normalizedCountry);
  if (exactCountryMatch) {
    const locationType = HQ_LOCATIONS.has(normalizedStation) ? 'HQ' : 
                        REGIONAL_HUB_LOCATIONS.has(normalizedStation) ? 'Regional' : 'Field';
    return { coordinates: exactCountryMatch, locationType, matchType: 'country' };
  }
  
  // Try country capital with partial match
  for (const [country, coords] of COUNTRY_CAPITAL_COORDINATES.entries()) {
    const normalizedKey = normalizeForMatching(country);
    if (normalizedCountry.includes(normalizedKey) || normalizedKey.includes(normalizedCountry)) {
      // Determine location type based on whether it's an HQ or Regional hub country
      const locationType = HQ_LOCATIONS.has(normalizedStation) ? 'HQ' : 
                          REGIONAL_HUB_LOCATIONS.has(normalizedStation) ? 'Regional' : 'Field';
      return { coordinates: coords, locationType, matchType: 'country' };
    }
  }
  
  // Default fallback - return [0, 0] to signal unknown (will be handled by caller)
  // [0, 20] was previously used but it places markers in the Atlantic Ocean
  return { coordinates: [0, 0], locationType: 'Field', matchType: 'default' };
}

/**
 * Classify location type
 */
export function classifyLocationType(dutyStation: string): 'HQ' | 'Regional' | 'Field' | 'Home-based' {
  const station = (dutyStation || '').toLowerCase().trim();
  
  if (station.includes('home') || station.includes('remote') || station.includes('telecommut')) {
    return 'Home-based';
  }
  
  if (HQ_LOCATIONS.has(station)) {
    return 'HQ';
  }
  
  if (REGIONAL_HUB_LOCATIONS.has(station)) {
    return 'Regional';
  }
  
  // Check partial matches for HQ
  for (const hq of HQ_LOCATIONS) {
    if (station.includes(hq)) return 'HQ';
  }
  
  // Check partial matches for Regional
  for (const hub of REGIONAL_HUB_LOCATIONS) {
    if (station.includes(hub)) return 'Regional';
  }
  
  return 'Field';
}


