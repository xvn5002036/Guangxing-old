
import { Lunar } from 'lunar-javascript';

// Helper to get Ten Gods (Shi Shen) for pattern determination
// We might duplicate some logic from 'lunar-javascript' if not easily accessible, 
// but we mostly need to know the relationship between Month Zhi and Day Gan.

export const calculateMingGe = (dayGan: string, monthZhi: string, monthGan: string, fullChartStems: string[]): string => {
    // 1. Check for Special Patterns based on Month Branch (Ling) only
    
    // Jian Lu Ge (建祿格): Day Master's Lu is in Month Branch
    // Jia -> Yin, Yi -> Mao, Bing -> Si, Ding -> Wu, Wu -> Si, Ji -> Wu, Geng -> Shen, Xin -> You, Ren -> Hai, Gui -> Zi
    // Note: Wu/Ji are Fire/Earth co-existing in standard BaZi for Lu (Bing/Wu share Si, Ding/Ji share Wu).
    const luMap: Record<string, string> = {
        '甲': '寅', '乙': '卯', 
        '丙': '巳', '丁': '午',
        '戊': '巳', '己': '午', // Fire and Earth share same Palace in some schools, but strictly Lu checks:
        // Traditional Jian Lu often treats Wu/Ji Lu at Si/Wu respectively.
        '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子'
    };

    if (luMap[dayGan] === monthZhi) {
        return '建祿格';
    }

    // Yue Ren Ge (月刃格) / Yang Ren (羊刃): Day Master's Yang Ren is in Month Branch
    // Usually only for Yang stems: Jia->Mao, Bing->Wu, Wu->Wu, Geng->You, Ren->Zi
    // Yin stems (Yi->Yin etc) are debating in some schools, but let's stick to standard Yang Ren for Yang stems first.
    // Or simplistically: Day Master is Strong Root in Month.
    const renMap: Record<string, string> = {
        '甲': '卯', '乙': '寅', // Yi born in Yin is technically Di Wang (Imperial Flourishing)? No, Yi Lu in Mao. Yi in Yin is ...
        // Let's stick to common Yang Ren: Yang Stems usually.
        '丙': '午', '戊': '午',
        '庚': '酉', '壬': '子'
    };

    if (renMap[dayGan] === monthZhi) {
        return '月刃格'; // Or 羊刃格
    }

    // 2. Standard Ten God Patterns (Zheng Guan, Qi Sha, Zheng Yin, Pian Yin, etc.)
    // Basic logic: Look at the Main Qi (Ben Qi) of the Month Branch.
    // If it projects to Heaven Stems, take that. (Tou Gan)
    // If not, just take the Main Qi.
    
    // Simplified Map of Month Branch Main Qi (Ben Qi) to Stem
    const benQiMap: Record<string, string> = {
        '子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊', '巳': '丙',
        '午': '丁', '未': '己', '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'
    };

    const mainQiStem = benQiMap[monthZhi];
    if (!mainQiStem) return '普通格局'; // Should not happen

    // Calculate Ten God of the Main Qi relative to Day Master
    const tenGod = getTenGod(dayGan, mainQiStem);

    // If it's a "Standard Pattern", we name it after the Ten God.
    // e.g. Zheng Guan Ge, Qi Sha Ge.
    // Exclude Bi Jian / Jie Cai usually? (Handled by Jian Lu / Yue Ren mostly).
    // If Bi Jian / Jie Cai is remaining, it might be just "Bi Jian Ge" (rarely used) or effectively Jian Lu.
    
    return tenGod + '格';
};

// Simple Ten God Calculator
const getTenGod = (dayGan: string, targetStem: string): string => {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const idxDay = stems.indexOf(dayGan);
    const idxTarget = stems.indexOf(targetStem);
    
    // 0: Bi Jian, 1: Jie Cai, 2: Shi Shen, 3: Shang Guan, 4: Pian Cai, 5: Zheng Cai, 6: Qi Sha, 7: Zheng Guan, 8: Pian Yin, 9: Zheng Yin
    // This relation depends on polarity and element. 
    // Logic: 
    // Same element, Same polarity = Bi Jian
    // Same element, Diff polarity = Jie Cai
    // Day generates Target, Same = Shi Shen
    // Day generates Target, Diff = Shang Guan
    // Day conquers Target, Same = Pian Cai
    // Day conquers Target, Diff = Zheng Cai
    // Target conquers Day, Same = Qi Sha
    // Target conquers Day, Diff = Zheng Guan
    // Target generates Day, Same = Pian Yin
    // Target generates Day, Diff = Zheng Yin

    // We can use a relative index map or simple lookup.
    // Let's use a lookup for ease.
    const tens = [
        '比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印'
    ];
    
    // Calculate distance steps (Target - Day + 10) % 10?
    // Let's verify:
    // Jia (0) to Jia (0) -> 0 -> Bi Jian.
    // Jia (0) to Yi (1) -> 1 -> Jie Cai.
    // Jia (0) to Bing (2) -> 2 -> Shi Shen.
    // ...
    // Jia (0) to Gui (9) -> 9 -> Zheng Yin.
    
    // Wait, let's check standard cycle.
    // Wood generates Fire. Jia(0) -> Bing(2) is Same Polarity (Yang Wood -> Yang Fire). Correct.
    // Wood conquers Earth. Jia(0) -> Wu(4). 4 -> Pian Cai. Correct.
    // Metal conquers Wood. Geng(6) -> Jia(0). (0-6+10)%10 = 4. 
    // But we want God of TARGET relative to DAY.
    // So if Target is Geng(6), Day is Jia(0). (6-0) = 6. 6 -> Qi Sha. Correct.
    
    const diff = (idxTarget - idxDay + 10) % 10;
    return tens[diff];
};
