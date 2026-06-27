import { Solar, Lunar } from 'lunar-javascript';

function testAlmanac() {
    // 2026-03-13T00:21:18+08:00
    const today = new Date('2026-03-13T00:21:18+08:00');
    const solar = Solar.fromDate(today);
    const lunar = solar.getLunar();

    console.log('--- Almanac Test (2026-03-13) ---');
    console.log('Solar:', solar.toString());
    console.log('Lunar:', lunar.toString());
    console.log('Sha (getDaySha):', lunar.getDaySha());
    
    console.log('\n--- Times ---');
    const times = lunar.getTimes();
    times.forEach(t => {
        console.log(`${t.getZhi()}時 (${t.getMinTime()} - ${t.getMaxTime()}):`);
        console.log(`  TianShen: ${t.getTianShen()} (${t.getTianShenType()})`);
        console.log(`  Ganzhi: ${t.getGanZhi()}`);
    });
    
    const luckyTimes = times
        .filter(t => t.getTianShenType() === '吉')
        .map(t => t.getZhi() + '時');
    console.log('\nLucky Hours (Filter "吉"):', luckyTimes.join(' '));
}

testAlmanac();
