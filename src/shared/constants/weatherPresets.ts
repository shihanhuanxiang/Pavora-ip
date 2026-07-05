
export const WEATHER_OPTIONS = [
    { value: 'auto', label: '自動 (Auto Detection)' },
    { value: 'clear', label: '☀️ 晴朗 (Clear)' },
    { value: 'overcast', label: '☁️ 陰天 (Overcast)' },
    { value: 'rain', label: '🌧️ 雨天 (Rain)' },
    { value: 'snow', label: '❄️ 雪天 (Snow)' },
    { value: 'fog', label: '🌫️ 霧氣 (Fog)' },
    { value: 'frost', label: '🧊 霜凍 (Frost)' },
    { value: 'thunder', label: '⛈️ 雷鳴 (Storm)' },
    { value: 'wind', label: '💨 強風 (Windy)' },
    { value: 'aurora', label: '🌌 極光 (Aurora)' }
];

export const WEATHER_INTENSITIES: Record<string, string[]> = {
    clear: ['柔光', '標準', '強光', '烈日'],
    overcast: ['薄雲', '多雲', '厚雲', '陰鬱'],
    rain: ['細雨', '中雨', '大雨', '暴雨'],
    snow: ['小雪', '大雪', '暴雪', '冰雪'],
    fog: ['薄霧', '中霧', '濃霧', '迷霧'],
    frost: ['輕霜', '結冰', '冰封', '嚴寒'],
    thunder: ['遠雷', '電閃', '暴雷', '雲爆'],
    wind: ['輕風', '陣風', '疾風', '颶風'],
    aurora: ['幽光', '漫射', '霓虹', '輝煌']
};
