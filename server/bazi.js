import { calculateBaziChart } from '@openfate/bazi-engine';

const hourAliases = [
    { keys: ['子', '子時', '23', '0', '00'], hour: 0 },
    { keys: ['丑', '丑時', '1', '01', '2', '02'], hour: 2 },
    { keys: ['寅', '寅時', '3', '03', '4', '04'], hour: 4 },
    { keys: ['卯', '卯時', '5', '05', '6', '06'], hour: 6 },
    { keys: ['辰', '辰時', '7', '07', '8', '08'], hour: 8 },
    { keys: ['巳', '巳時', '9', '09', '10'], hour: 10 },
    { keys: ['午', '午時', '11', '12'], hour: 12 },
    { keys: ['未', '未時', '13', '14'], hour: 14 },
    { keys: ['申', '申時', '15', '16'], hour: 16 },
    { keys: ['酉', '酉時', '17', '18'], hour: 18 },
    { keys: ['戌', '戌時', '19', '20'], hour: 20 },
    { keys: ['亥', '亥時', '21', '22'], hour: 22 },
];

export const normalizeBirthYear = (value) => {
    const raw = String(value || '').trim();
    const match = raw.match(/\d+/);
    if (!match) return null;
    const year = Number(match[0]);
    if (!Number.isFinite(year)) return null;
    return year < 1000 ? year + 1911 : year;
};

export const normalizeBirthNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    if (!match) return null;
    const num = Number(match[0]);
    return Number.isFinite(num) ? num : null;
};

export const normalizeBirthHour = (value) => {
    const raw = String(value || '').trim();
    if (!raw || raw.includes('吉時') || raw.includes('不限')) return 12;
    const direct = raw.match(/\d+/);
    if (direct) {
        const hour = Number(direct[0]);
        if (Number.isFinite(hour)) return Math.max(0, Math.min(23, hour));
    }
    const alias = hourAliases.find((item) => item.keys.some((key) => raw.startsWith(key) || raw.includes(key)));
    return alias?.hour ?? 12;
};

const normalizeGender = (value) => String(value || '').toUpperCase() === 'F' ? 'female' : 'male';

export const calculateOpenFateBazi = (input = {}) => {
    const year = normalizeBirthYear(input.year ?? input.birthYear);
    const month = normalizeBirthNumber(input.month ?? input.birthMonth);
    const day = normalizeBirthNumber(input.day ?? input.birthDay);
    const hour = normalizeBirthHour(input.hour ?? input.birthHour);

    if (!year || !month || !day) {
        const error = new Error('Birth year, month and day are required.');
        error.status = 400;
        throw error;
    }

    const chart = calculateBaziChart({
        year,
        month,
        day,
        hour,
        minute: normalizeBirthNumber(input.minute) ?? 0,
        gender: normalizeGender(input.gender),
        calendarType: input.calendarType || 'lunar',
        isLeapMonth: Boolean(input.isLeapMonth),
        longitude: Number(input.longitude ?? 121.5654),
        timezone: Number(input.timezone ?? 8),
        timezoneId: input.timezoneId || 'Asia/Taipei',
        dstOffset: Number(input.dstOffset ?? 0),
        enableTrueSolarTime: input.enableTrueSolarTime !== false,
        dayBoundaryMode: input.dayBoundaryMode || 'ZI_HOUR_23',
    });

    return {
        input: {
            year,
            month,
            day,
            hour,
            calendarType: input.calendarType || 'lunar',
            gender: normalizeGender(input.gender),
        },
        chart,
        attribution: {
            brand: 'OpenFate.ai',
            url: 'https://openfate.ai',
            engine: '@openfate/bazi-engine',
            mcp: '@openfate/bazi-mcp',
        },
    };
};
