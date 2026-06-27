/**
 * BaZi Shen Sha (Symbolic Stars) Calculator
 * Based on traditional relationships between Day Master (Day Gan), Year Pillar (Year Gan/Zhi), and other pillars.
 */

// Helper: Get Branch Index
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/**
 * Calculate Shen Sha for a single pillar
 * @param pillarZhi The Earthly Branch of the pillar to check
 * @param pillarGan The Heavenly Stem of the pillar to check
 * @param dayGan The Day Master
 * @param yearGan The Year Stem
 * @param yearZhi The Year Branch
 * @param monthZhi The Month Branch
 * @param dayZhi The Day Branch
 * @param fullChartStems (Optional) All four stems for San Qi check
 */
export const getShenShaForPillar = (
    pillarZhi: string, 
    pillarGan: string,
    dayGan: string, 
    yearGan: string,
    yearZhi: string, 
    monthZhi: string, 
    dayZhi: string,
    fullChartStems: string[] = [],
    fullChartBranches: string[] = [], // New: Need full branches for some stars
    gender: 'M' | 'F' = 'M', // New: Gender for Yuan Chen
    yearNaYin: string = '', // New: For Tong Zi
    dayNaYin: string = ''   // New: For Tong Zi
) => {
    const starList: string[] = [];
    const nobleStems = [dayGan, yearGan]; 

    // --- 1. Stem Based Stars (Using Day Master & Year Stem) ---

    // Tian Yi Gui Ren (天乙貴人)
    const tianYiMap: Record<string, string[]> = {
        '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
        '乙': ['子', '申'], '己': ['子', '申'],
        '丙': ['亥', '酉'], '丁': ['亥', '酉'],
        '壬': ['巳', '卯'], '癸': ['巳', '卯'],
        '辛': ['寅', '午']
    };
    nobleStems.forEach(s => {
        if (tianYiMap[s]?.includes(pillarZhi)) starList.push('天乙貴人');
    });

    // Kong Wang (空亡) - Based on Day & Year Pillars
    const getKongWang = (gan: string, zhi: string) => {
        const xun = [
            ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉'], // 戌亥
            ['甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未'], // 申酉
            ['甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳'], // 午未
            ['甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯'], // 辰巳
            ['甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'], // 寅卯
            ['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'], // 子丑
        ];
        const kwMap = [['戌', '亥'], ['申', '酉'], ['午', '未'], ['辰', '巳'], ['寅', '卯'], ['子', '丑']];
        const gz = gan + zhi;
        for (let i = 0; i < xun.length; i++) {
            if (xun[i].includes(gz)) return kwMap[i];
        }
        return [];
    };
    const dayKW = getKongWang(dayGan, dayZhi);
    const yearKW = getKongWang(yearGan, yearZhi);
    if (dayKW.includes(pillarZhi)) starList.push('空亡');
    if (yearKW.includes(pillarZhi)) starList.push('空亡');

    // Wen Chang Gui Ren (文昌貴人)
    const wenChangMap: Record<string, string> = {
        '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', 
        '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
    };
    nobleStems.forEach(s => {
        if (wenChangMap[s] === pillarZhi) starList.push('文昌貴人');
    });

    // Lu Shen (祿神)
    const luShenMap: Record<string, string> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午',
        '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
    };
    nobleStems.forEach(s => {
        if (luShenMap[s] === pillarZhi) starList.push('祿神');
    });

    // An Lu (暗祿) - Traditional hidden prosperity
    const anLuMap: Record<string, string> = {
        '甲': '亥', '乙': '戌', '丙': '申', '丁': '未', '戊': '申',
        '己': '未', '庚': '巳', '辛': '辰', '壬': '寅', '癸': '丑'
    };
    nobleStems.forEach(s => {
        if (anLuMap[s] === pillarZhi) starList.push('暗祿');
    });

    // Guo Yin Gui Ren (國印貴人)
    const guoYinMap: Record<string, string> = {
        '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
        '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申'
    };
    nobleStems.forEach(s => {
        if (guoYinMap[s] === pillarZhi) starList.push('國印貴人');
    });

    // Yang Ren (羊刃) & Yin Ren (陰刃/飛刃)
    const yangRenMap: Record<string, string> = {
        '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
        '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥' 
    };
    if (yangRenMap[dayGan] === pillarZhi) starList.push('羊刃');

    // Liu Xia (流霞)
    const liuXiaMap: Record<string, string> = {
        '甲': '酉', '乙': '未', '丙': '子', '丁': '巳', '戊': '午',
        '己': '辰', '庚': '亥', '辛': '卯', '壬': '寅', '癸': '戌'
    };
    nobleStems.forEach(s => {
        if (liuXiaMap[s] === pillarZhi) starList.push('流霞');
    });

    // Hong Yan (紅艷煞)
    const hongYanMap: Record<string, string[]> = {
        '甲': ['午'], '乙': ['申'], '丙': ['寅'], '丁': ['未'], '戊': ['辰'],
        '己': ['辰'], '庚': ['戌'], '辛': ['酉'], '壬': ['子'], '癸': ['申']
    };
    if (hongYanMap[dayGan]?.includes(pillarZhi)) starList.push('紅艷煞');

    // Fu Xing (福星貴人)
    const fuXingMap: Record<string, string[]> = {
        '甲': ['子', '戌'], '乙': ['亥', '酉'], '丙': ['子', '寅'], '丁': ['亥'], '戊': ['申'],
        '己': ['未'], '庚': ['午'], '辛': ['巳'], '壬': ['辰'], '癸': ['卯']
    };
    nobleStems.forEach(s => {
        if (fuXingMap[s]?.includes(pillarZhi)) starList.push('福星貴人');
    });

    // Tai Ji Gui Ren (太極貴人)
    const taiJiMap: Record<string, string[]> = {
        '甲': ['子', '午'], '乙': ['子', '午'],
        '丙': ['酉', '卯'], '丁': ['酉', '卯'],
        '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
        '庚': ['寅', '亥'], '辛': ['寅', '亥'],
        '壬': ['巳', '申'], '癸': ['巳', '申']
    };
    nobleStems.forEach(s => {
        if (taiJiMap[s]?.includes(pillarZhi)) starList.push('太極貴人');
    });

    // Jin Yu (金輿)
    const jinYuMap: Record<string, string> = {
        '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
        '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅'
    };
    nobleStems.forEach(s => {
        if (jinYuMap[s] === pillarZhi) starList.push('金輿');
    });

    // Shi E Da Bai (十惡大敗)
    const shiEDaBai = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
    if (shiEDaBai.includes(pillarGan + pillarZhi) && pillarGan === dayGan && pillarZhi === dayZhi) {
        starList.push('十惡大敗');
    }

    // --- 2. Month Branch Based Stars ---
    
    // Tian Yi (天醫) - Heavenly Doctor
    const tianYiMedMap: Record<string, string> = {
        '寅': '丑', '卯': '寅', '辰': '卯', '巳': '辰', '午': '巳', '未': '午',
        '申': '未', '酉': '申', '戌': '酉', '亥': '戌', '子': '亥', '丑': '子'
    };
    if (tianYiMedMap[monthZhi] === pillarZhi) starList.push('天醫');
    
    // Tian De (天德)
    const tianDeMap: Record<string, string> = {
        '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
        '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚'
    };
    const tdTarget = tianDeMap[monthZhi];
    if (tdTarget) {
        if (GAN.includes(tdTarget)) {
            if (pillarGan === tdTarget) starList.push('天德貴人');
        } else {
            if (pillarZhi === tdTarget) starList.push('天德貴人');
        }
    }

    // Yue De (月德)
    const yueDeMap: Record<string, string> = {
        '寅': '丙', '午': '丙', '戌': '丙',
        '申': '壬', '子': '壬', '辰': '壬',
        '亥': '甲', '卯': '甲', '未': '甲',
        '巳': '庚', '酉': '庚', '丑': '庚'
    };
    if (yueDeMap[monthZhi] === pillarGan) starList.push('月德貴人');

    // --- 3. Branch Interactions ---
    
    const checkZhiStars = (baseZhi: string, source: 'Year' | 'Day') => {
        if (!baseZhi) return; 

        // Yi Ma (驛馬)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '寅') starList.push('驛馬');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '申') starList.push('驛馬');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '亥') starList.push('驛馬');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '巳') starList.push('驛馬');

        // Tao Hua (桃花)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '酉') starList.push('桃花');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '卯') starList.push('桃花');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '午') starList.push('桃花');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '子') starList.push('桃花');

        // Hua Gai (華蓋)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '辰') starList.push('華蓋');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '戌') starList.push('華蓋');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '丑') starList.push('華蓋');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '未') starList.push('華蓋');

        // Jiang Xing (將星)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '子') starList.push('將星');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '午') starList.push('將星');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '酉') starList.push('將星');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '卯') starList.push('將星');
        
        // Jie Sha (劫煞)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '巳') starList.push('劫煞');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '亥') starList.push('劫煞');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '寅') starList.push('劫煞');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '申') starList.push('劫煞');
        
        // Zai Sha (災煞)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '午') starList.push('災煞');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '子') starList.push('災煞');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '卯') starList.push('災煞');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '酉') starList.push('災煞');
        
        // Wang Shen (亡神)
        if (['申', '子', '辰'].includes(baseZhi) && pillarZhi === '亥') starList.push('亡神');
        if (['寅', '午', '戌'].includes(baseZhi) && pillarZhi === '巳') starList.push('亡神');
        if (['巳', '酉', '丑'].includes(baseZhi) && pillarZhi === '申') starList.push('亡神');
        if (['亥', '卯', '未'].includes(baseZhi) && pillarZhi === '寅') starList.push('亡神');

        // Gou Jiao (勾絞煞)
        const gouJiaoMap: Record<string, string[]> = {
            '子': ['卯', '酉'], '丑': ['辰', '戌'], '寅': ['巳', '亥'], '卯': ['午', '子'],
            '辰': ['未', '丑'], '巳': ['申', '寅'], '午': ['酉', '卯'], '未': ['戌', '辰'],
            '申': ['亥', '巳'], '酉': ['子', '午'], '戌': ['丑', '未'], '亥': ['寅', '申']
        };
        if (gouJiaoMap[baseZhi]?.includes(pillarZhi)) starList.push('勾絞煞');

        // Gu Chen (孤辰) & Gua Su (寡宿)
        if (['寅', '卯', '辰'].includes(baseZhi) && pillarZhi === '巳') starList.push('孤辰');
        if (['巳', '午', '未'].includes(baseZhi) && pillarZhi === '申') starList.push('孤辰');
        if (['申', '酉', '戌'].includes(baseZhi) && pillarZhi === '亥') starList.push('孤辰');
        if (['亥', '子', '丑'].includes(baseZhi) && pillarZhi === '寅') starList.push('孤辰');
        if (['寅', '卯', '辰'].includes(baseZhi) && pillarZhi === '丑') starList.push('寡宿');
        if (['巳', '午', '未'].includes(baseZhi) && pillarZhi === '辰') starList.push('寡宿');
        if (['申', '酉', '戌'].includes(baseZhi) && pillarZhi === '未') starList.push('寡宿');
        if (['亥', '子', '丑'].includes(baseZhi) && pillarZhi === '戌') starList.push('寡宿');

        if (source === 'Year') {
            // Hong Luan (紅鸞) & Tian Xi (天喜)
            const hongLuanMap: Record<string, string> = {
                '子':'卯', '丑':'寅', '寅':'丑', '卯':'子', '辰':'亥', '巳':'戌',
                '午':'酉', '未':'申', '申':'未', '酉':'午', '戌':'巳', '亥':'辰'
            };
            if (hongLuanMap[baseZhi] === pillarZhi) starList.push('紅鸞');
            const tianXiMap: Record<string, string> = {
                '子':'酉', '丑':'申', '寅':'未', '卯':'午', '辰':'巳', '巳':'辰',
                '午':'卯', '未':'寅', '申':'丑', '酉':'子', '戌':'亥', '亥':'戌'
            };
            if (tianXiMap[baseZhi] === pillarZhi) starList.push('天喜');
        }
    };

    checkZhiStars(yearZhi, 'Year');
    checkZhiStars(dayZhi, 'Day');

    // --- 4. Special Pillar Combinations ---
    
    // --- New Stars Added from Suanming.com.tw Request ---

    // 1. Tian Chu Gui Ren (天廚貴人) - Based on Day Stem
    // Formula: Jia-Si, Yi-Wu, Bing-Zi, Ding-Si, Wu-Wu, Ji-Shen, Geng-Yin, Xin-Wu, Ren-Shen, Gui-Hai
    const tianChuMap: Record<string, string> = {
        '甲': '巳', '乙': '午', '丙': '子', '丁': '巳', '戊': '午',
        '己': '申', '庚': '寅', '辛': '午', '壬': '申', '癸': '亥'
    };
    if (tianChuMap[dayGan] === pillarZhi) starList.push('天廚貴人');

    // 2. Tian Guan Gui Ren (天官貴人) - Based on Day Stem
    // Formula: Jia-Wei, Yi-Chen, Bing-Si, Ding-Yin, Wu-Mao, Ji-You, Geng-Hai, Xin-Shen, Ren-Xu, Gui-Wu
    const tianGuanMap: Record<string, string> = {
        '甲': '未', '乙': '辰', '丙': '巳', '丁': '寅', '戊': '卯',
        '己': '酉', '庚': '亥', '辛': '申', '壬': '戌', '癸': '午'
    };
    if (tianGuanMap[dayGan] === pillarZhi) starList.push('天官貴人');

    // 3. De Xiu Gui Ren (德秀貴人) - Based on Month Branch
    // Checks for specific Stems appearing in the chart. Usually attributes to the Pillar if it contains the stem.
    // Logic: Month -> Required Stems. If PillarGan is one of them, mark it.
    // Yin/Wu/Xu (Fire): Bing/Ding (De), Wu/Gui (Xiu)
    // Shen/Zi/Chen (Water): Ren/Gui (De), Bing/Xin (Xiu)
    // Si/You/Chou (Metal): Geng/Xin (De), Yi/Geng (Xiu)
    // Hai/Mao/Wei (Wood): Jia/Yi (De), Ding/Ren (Xiu)
    const getDeXiu = (mZhi: string, pGan: string) => {
        if (['寅', '午', '戌'].includes(mZhi)) {
            if (['丙', '丁'].includes(pGan)) return '德秀貴人'; // De
            if (['戊', '癸'].includes(pGan)) return '德秀貴人'; // Xiu
        }
        if (['申', '子', '辰'].includes(mZhi)) {
            if (['壬', '癸'].includes(pGan)) return '德秀貴人';
            if (['丙', '辛'].includes(pGan)) return '德秀貴人';
        }
        if (['巳', '酉', '丑'].includes(mZhi)) {
            if (['庚', '辛'].includes(pGan)) return '德秀貴人';
            if (['乙', '庚'].includes(pGan)) return '德秀貴人';
        }
        if (['亥', '卯', '未'].includes(mZhi)) {
            if (['甲', '乙'].includes(pGan)) return '德秀貴人';
            if (['丁', '壬'].includes(pGan)) return '德秀貴人';
        }
        return null;
    };
    const dx = getDeXiu(monthZhi, pillarGan);
    if (dx) starList.push(dx);

    // 4. Ci Guan (詞館) - Scholar's Hall
    // Specific Pillar Match usually involving Day Stem's relation
    // Mapping: Jia-GengYin, Yi-XinMao, Bing-YiSi, Ding-WuWu, Wu-DingSi, Ji-BingWu, Geng-RenShen, Xin-GuiYou, Ren-GengHai, Gui-XinHai
    const ciGuanMap: Record<string, string> = {
        '甲': '庚寅', '乙': '辛卯', '丙': '乙巳', '丁': '戊午', '戊': '丁巳',
        '己': '丙午', '庚': '壬申', '辛': '癸酉', '壬': '庚亥', '癸': '辛亥'
    };
    if (ciGuanMap[dayGan] === (pillarGan + pillarZhi)) starList.push('詞館');

    // 5. Tian Luo Di Wang (天羅地網)
    // Xu-Hai is Tian Luo, Chen-Si is Di Wang.
    // Rule: "Mutually Seeing". 
    // If Pillar is Xu, and Chart has Hai -> Tian Luo.
    // If Pillar is Hai, and Chart has Xu -> Tian Luo.
    // If Pillar is Chen, and Chart has Si -> Di Wang.
    // If Pillar is Si, and Chart has Chen -> Di Wang.
    const allBranches = fullChartBranches.length > 0 ? fullChartBranches : [yearZhi, monthZhi, dayZhi, pillarZhi]; // Minimal fallback
    if (pillarZhi === '戌' && allBranches.includes('亥')) starList.push('天羅');
    if (pillarZhi === '亥' && allBranches.includes('戌')) starList.push('天羅');
    if (pillarZhi === '辰' && allBranches.includes('巳')) starList.push('地網');
    if (pillarZhi === '巳' && allBranches.includes('辰')) starList.push('地網');

    // 6. Tian De He (天德合) & Yue De He (月德合)
    // We already calculated Tian De and Yue De logic effectively by map.
    // Yue De He: Stem that combines with Yue De Stem.
    // Tian De He: Stem that combines with Tian De Stem/Branch (converted).
    // Reuse Yue De map
    const yueDeMapForHe: Record<string, string> = {
        '寅': '丙', '午': '丙', '戌': '丙', '申': '壬', '子': '壬', '辰': '壬',
        '亥': '甲', '卯': '甲', '未': '甲', '巳': '庚', '酉': '庚', '丑': '庚'
    };
    const stemCombineMap: Record<string, string> = {
        '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙',
        '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊'
    };
    const ydStem = yueDeMapForHe[monthZhi];
    if (ydStem && stemCombineMap[ydStem] === pillarGan) starList.push('月德合');

    // Tian De He
    // First find Tian De.
    const tianDeMapForHe: Record<string, string> = {
        '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
        '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚'
    };
    const tdTargetChar = tianDeMapForHe[monthZhi];
    // If TD is Stem, look for Combine Stem.
    // If TD is Branch (e.g. Shen, Yin, Hai, Si), look for Branch Combine? or Hidden Stem combine?
    // Usually Tian De He is strictly Stems. If TD is Branch, we map branch to main Qi Stem?
    // Or Tian De He uses Zhi Liu He?
    // Common Formula:
    // If Tian De is Stem -> Combine Stem.
    // If Tian De is Branch (Zi, Wu, Mao, You etc? No, De map has Shen, Yin, Hai, Si).
    // The Map: Yin->Ding(S), Mao->Shen(B), Chen->Ren(S), Si->Xin(S), Wu->Hai(B), Wei->Jia(S)...
    // Detailed:
    // If TD is Ding (Stem) -> Ren is He.
    // If TD is Shen (Branch) -> Si is He (Liu He).
    // If TD is Ren -> Ding.
    // If TD is Xin -> Bing.
    // If TD is Hai (Branch) -> Yin is He.
    // If TD is Jia -> Ji.
    // If TD is Gui -> Wu.
    // If TD is Yin (Branch) -> Hai is He.
    // If TD is Bing -> Xin.
    // If TD is Yi -> Geng.
    // If TD is Si (Branch) -> Shen is He.
    // If TD is Geng -> Yi.
    // Logic: Check if TD is Stem or Branch.
    const isGan = (c: string) => GAN.includes(c);
    if (tdTargetChar) {
        if (isGan(tdTargetChar)) {
            // Target is Stem (e.g. Ding), we need Ren (which is stemCombineMap[Ding])
            if (stemCombineMap[tdTargetChar] === pillarGan) starList.push('天德合');
        } else {
            // Target is Branch (e.g. Shen), we need Si (Liu He)
            const branchCombineMap: Record<string, string> = {
                '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯',
                '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午'
            };
            if (branchCombineMap[tdTargetChar] === pillarZhi) starList.push('天德合');
        }
    }

    // 7. Sang Men (喪門)
    // Year Branch + 2.
    // Zi(0) -> Yin(2).
    const zhiIdx = ZHI.indexOf(yearZhi);
    if (zhiIdx >= 0) {
        const smIdx = (zhiIdx + 2) % 12;
        if (ZHI[smIdx] === pillarZhi) starList.push('喪門');
    }

    // 8. Xue Ren (血刃)
    // Month Branch -> Target Branch
    const xueRenMap: Record<string, string> = {
        '子': '戌', '丑': '酉', '寅': '申', '卯': '未', '辰': '午', '巳': '巳', // Verify this pattern
        '午': '辰', '未': '卯', '申': '寅', '酉': '丑', '戌': '子', '亥': '亥' // Reverse order?
    };
    // Re-verify Xue Ren: "Zi sees Xu, Chou sees You..." 
    // This looks like reverse order starting from Xu? 
    // Zi(1)->Xu(11), Chou(2)->You(10), Yin(3)->Shen(9). Sum is 12 (or 0).
    // 1+11=12. 2+10=12. 3+9=12. 4+8=12(Mao-Wei). 5+7=12(Chen-Wu). 6+6=12(Si-Si). 
    // Yes, this is the formula.
    if (xueRenMap[monthZhi] === pillarZhi) starList.push('血刃');

    // 9. Yuan Chen (元辰)
    // Year Branch Opposite +/- 1
    // Yang Nan / Yin Nv: Chong + 1 (Forward)
    // Yin Nan / Yang Nv: Chong - 1 (Backward)
    // Year Stem Polarity:
    const yangStems = ['甲', '丙', '戊', '庚', '壬'];
    const isYangYear = yangStems.includes(yearGan);
    const isMale = gender === 'M';
    
    // Determine direction
    // Yang Year Male -> Yang Nan -> Forward
    // Yin Year Female -> Yin Nv -> Forward
    // Yin Year Male -> Yin Nan -> Backward
    // Yang Year Female -> Yang Nv -> Backward
    let forward = false;
    if ((isYangYear && isMale) || (!isYangYear && !isMale)) {
        forward = true;
    }

    // Chong Index: (year + 6) % 12
    const chongIdx = (zhiIdx + 6) % 12;
    let targetIdx = forward ? (chongIdx + 1) : (chongIdx - 1);
    if (targetIdx < 0) targetIdx += 12;
    targetIdx = targetIdx % 12;
    
    if (ZHI[targetIdx] === pillarZhi) starList.push('元辰');

    // 10. Tong Zi (童子煞)
    // Season (Month) -> Branch
    // Spring (Yin/Mao/Chen) -> Yin, Zi
    // Summer (Si/Wu/Wei) -> Mao, Wei
    // Fall (Shen/You/Xu) -> Shen, Yin
    // Winter (Hai/Zi/Chou) -> You, Mao
    const getSeason = (m: string) => {
        if (['寅', '卯', '辰'].includes(m)) return 'Spring';
        if (['巳', '午', '未'].includes(m)) return 'Summer';
        if (['申', '酉', '戌'].includes(m)) return 'Fall';
        if (['亥', '子', '丑'].includes(m)) return 'Winter';
        return '';
    };
    const season = getSeason(monthZhi);
    const tzMap: Record<string, string[]> = {
        'Spring': ['寅', '子'],
        'Summer': ['卯', '未', '辰'],
        'Fall': ['寅', '子'],
        'Winter': ['卯', '未', '辰']
    };
    if (tzMap[season]?.includes(pillarZhi)) starList.push('童子煞');

    // Na Yin Tong Zi Logic
    // Rule:
    // Metal/Wood (Jin/Mu) -> Wu/Mao
    // Water/Fire (Shui/Huo) -> You/Xu
    // Earth (Tu) -> Chen/Si
    // We check both Year Na Yin and Day Na Yin to cover "Live Tong Zi" variants used by some sites.
    const checkNaYinTongZi = (ny: string) => {
        if (!ny) return false;
        if (ny.includes('金') || ny.includes('木')) {
            return ['午', '卯'].includes(pillarZhi);
        }
        if (ny.includes('水') || ny.includes('火')) {
            return ['酉', '戌'].includes(pillarZhi);
        }
        if (ny.includes('土')) {
            return ['辰', '巳'].includes(pillarZhi);
        }
        return false;
    };

    if (checkNaYinTongZi(yearNaYin) || checkNaYinTongZi(dayNaYin)) {
        // Avoid duplicate push if already found by season
        if (!starList.includes('童子煞')) starList.push('童子煞');
    }

    // Jin Shen (金神)
    if (['乙丑', '己巳', '癸酉'].includes(pillarGan + pillarZhi)) {
        starList.push('金神');
    }

    // Shi Ling Ri (十靈日)
    const shiLing = ['甲辰', '乙亥', '丙辰', '丁酉', '戊午', '庚戌', '庚寅', '辛亥', '壬寅', '癸未'];
    if (shiLing.includes(pillarGan + pillarZhi) && pillarGan === dayGan && pillarZhi === dayZhi) {
        starList.push('十靈日');
    }

    // Kui Gang (魁罡)
    if (pillarGan === dayGan && pillarZhi === dayZhi) {
        if (['庚辰', '庚戌', '壬辰', '戊戌'].includes(pillarGan + pillarZhi)) starList.push('魁罡');
    }

    // San Qi Gui Ren (三奇貴人)
    if (fullChartStems.length === 4) {
        const stems = fullChartStems.join('');
        // Tian Shang San Qi: Jia Wu Geng (Strict Order)
        if (stems.includes('甲戊庚')) starList.push('天上三奇');
        // Di xia San Qi: Yi Bing Ding (Strict Order)
        if (stems.includes('乙丙丁')) starList.push('地下三奇');
        // Ren Zhong San Qi: Ren Gui Xin (Strict Order)
        if (stems.includes('壬癸辛')) starList.push('人中三奇');
    }
    
    return [...new Set(starList)];
};

