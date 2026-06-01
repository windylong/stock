export interface StockInfo {
  ticker: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  sector: string
  dart_code?: string
}

// 시가총액 상위 국내 주요 종목 (인기순 정렬)
export const POPULAR_STOCKS: StockInfo[] = [
  // KOSPI 대형주
  { ticker: '005930', name: '삼성전자',       market: 'KOSPI',  sector: '전기전자',   dart_code: '00126380' },
  { ticker: '000660', name: 'SK하이닉스',     market: 'KOSPI',  sector: '반도체',     dart_code: '00164779' },
  { ticker: '373220', name: 'LG에너지솔루션', market: 'KOSPI',  sector: '이차전지',   dart_code: '01426955' },
  { ticker: '207940', name: '삼성바이오로직스',market: 'KOSPI', sector: '바이오',     dart_code: '00760957' },
  { ticker: '005380', name: '현대차',         market: 'KOSPI',  sector: '자동차',     dart_code: '00164742' },
  { ticker: '006400', name: '삼성SDI',        market: 'KOSPI',  sector: '이차전지',   dart_code: '00126362' },
  { ticker: '000270', name: '기아',           market: 'KOSPI',  sector: '자동차',     dart_code: '00106641' },
  { ticker: '035420', name: 'NAVER',          market: 'KOSPI',  sector: 'IT서비스',   dart_code: '00349015' },
  { ticker: '051910', name: 'LG화학',         market: 'KOSPI',  sector: '화학',       dart_code: '00401731' },
  { ticker: '035720', name: '카카오',         market: 'KOSPI',  sector: 'IT서비스',   dart_code: '00918444' },
  { ticker: '012330', name: '현대모비스',     market: 'KOSPI',  sector: '자동차부품', dart_code: '00164788' },
  { ticker: '028260', name: '삼성물산',       market: 'KOSPI',  sector: '건설',       dart_code: '00126371' },
  { ticker: '055550', name: '신한지주',       market: 'KOSPI',  sector: '금융',       dart_code: '00382199' },
  { ticker: '105560', name: 'KB금융',         market: 'KOSPI',  sector: '금융',       dart_code: '00547583' },
  { ticker: '066570', name: 'LG전자',         market: 'KOSPI',  sector: '전기전자',   dart_code: '00401697' },
  { ticker: '003550', name: 'LG',            market: 'KOSPI',  sector: '지주',       dart_code: '00401688' },
  { ticker: '032830', name: '삼성생명',       market: 'KOSPI',  sector: '금융',       dart_code: '00126351' },
  { ticker: '086790', name: '하나금융지주',   market: 'KOSPI',  sector: '금융',       dart_code: '00545849' },
  { ticker: '009540', name: 'HD한국조선해양', market: 'KOSPI',  sector: '조선',       dart_code: '00164845' },
  { ticker: '034730', name: 'SK',            market: 'KOSPI',  sector: '지주',       dart_code: '00159066' },
  { ticker: '017670', name: 'SK텔레콤',      market: 'KOSPI',  sector: '통신',       dart_code: '00159059' },
  { ticker: '030200', name: 'KT',            market: 'KOSPI',  sector: '통신',       dart_code: '00220905' },
  { ticker: '018260', name: '삼성에스디에스', market: 'KOSPI',  sector: 'IT서비스',   dart_code: '01230484' },
  { ticker: '010950', name: 'S-Oil',         market: 'KOSPI',  sector: '에너지',     dart_code: '00104400' },
  { ticker: '096770', name: 'SK이노베이션',  market: 'KOSPI',  sector: '에너지',     dart_code: '00631518' },
  { ticker: '009150', name: '삼성전기',      market: 'KOSPI',  sector: '전기전자',   dart_code: '00126385' },
  { ticker: '003490', name: '대한항공',      market: 'KOSPI',  sector: '운송',       dart_code: '00111202' },
  { ticker: '011200', name: 'HMM',           market: 'KOSPI',  sector: '운송',       dart_code: '00164803' },
  { ticker: '015760', name: '한국전력',      market: 'KOSPI',  sector: '유틸리티',   dart_code: '00159019' },
  { ticker: '033780', name: 'KT&G',          market: 'KOSPI',  sector: '소비재',     dart_code: '00231567' },
  { ticker: '051900', name: 'LG생활건강',    market: 'KOSPI',  sector: '소비재',     dart_code: '00401748' },
  { ticker: '097950', name: 'CJ제일제당',    market: 'KOSPI',  sector: '식품',       dart_code: '00140477' },
  { ticker: '010130', name: '고려아연',      market: 'KOSPI',  sector: '소재',       dart_code: '00164814' },
  { ticker: '034020', name: '두산에너빌리티',market: 'KOSPI',  sector: '산업재',     dart_code: '00152933' },
  { ticker: '036570', name: '엔씨소프트',    market: 'KOSPI',  sector: '게임',       dart_code: '00261524' },
  { ticker: '259960', name: '크래프톤',      market: 'KOSPI',  sector: '게임',       dart_code: '01408459' },
  { ticker: '352820', name: '하이브',        market: 'KOSPI',  sector: '엔터',       dart_code: '01408802' },
  { ticker: '000810', name: '삼성화재',      market: 'KOSPI',  sector: '금융',       dart_code: '00126348' },
  { ticker: '139480', name: '이마트',        market: 'KOSPI',  sector: '유통',       dart_code: '00782473' },
  { ticker: '282330', name: 'BGF리테일',     market: 'KOSPI',  sector: '유통',       dart_code: '01132501' },
  { ticker: '011790', name: 'SKC',           market: 'KOSPI',  sector: '화학',       dart_code: '00159084' },
  { ticker: '000080', name: '하이트진로',    market: 'KOSPI',  sector: '식품',       dart_code: '00105339' },
  { ticker: '271560', name: '오리온',        market: 'KOSPI',  sector: '식품'                              },
  { ticker: '251270', name: '넷마블',        market: 'KOSPI',  sector: '게임',       dart_code: '01387327' },
  { ticker: '003670', name: '포스코퓨처엠',  market: 'KOSPI',  sector: '이차전지'                          },
  { ticker: '005490', name: 'POSCO홀딩스',   market: 'KOSPI',  sector: '소재',       dart_code: '00117703' },
  { ticker: '000100', name: '유한양행',      market: 'KOSPI',  sector: '제약'                              },
  { ticker: '128940', name: '한미약품',      market: 'KOSPI',  sector: '제약'                              },
  { ticker: '326030', name: 'SK바이오팜',    market: 'KOSPI',  sector: '바이오'                            },

  // KOSDAQ 주요 종목
  { ticker: '247540', name: '에코프로비엠',  market: 'KOSDAQ', sector: '이차전지'                          },
  { ticker: '086520', name: '에코프로',      market: 'KOSDAQ', sector: '이차전지'                          },
  { ticker: '196170', name: '알테오젠',      market: 'KOSDAQ', sector: '바이오'                            },
  { ticker: '091990', name: '셀트리온헬스케어',market:'KOSDAQ', sector: '바이오'                            },
  { ticker: '068760', name: '셀트리온제약',  market: 'KOSDAQ', sector: '바이오'                            },
  { ticker: '145020', name: '휴젤',         market: 'KOSDAQ', sector: '바이오'                            },
  { ticker: '214150', name: '클래시스',      market: 'KOSDAQ', sector: '바이오'                            },
  { ticker: '041510', name: '에스엠',        market: 'KOSDAQ', sector: '엔터'                              },
  { ticker: '035900', name: 'JYP엔터',      market: 'KOSDAQ', sector: '엔터'                              },
  { ticker: '122870', name: '와이지엔터테인먼트',market:'KOSDAQ',sector: '엔터'                             },
  { ticker: '263750', name: '펄어비스',      market: 'KOSDAQ', sector: '게임'                              },
  { ticker: '293490', name: '카카오게임즈',  market: 'KOSDAQ', sector: '게임'                              },
  { ticker: '240810', name: '원익IPS',       market: 'KOSDAQ', sector: '반도체장비'                        },
  { ticker: '357780', name: '솔브레인',      market: 'KOSDAQ', sector: '반도체소재'                        },
  { ticker: '058470', name: '리노공업',      market: 'KOSDAQ', sector: '반도체'                            },
  { ticker: '039030', name: '이오테크닉스',  market: 'KOSDAQ', sector: '반도체장비'                        },
  { ticker: '095340', name: 'ISC',          market: 'KOSDAQ', sector: '반도체'                            },
  { ticker: '166090', name: '하나머티리얼즈',market: 'KOSDAQ', sector: '반도체소재'                        },
  { ticker: '054040', name: '한국콜마',      market: 'KOSDAQ', sector: '화장품'                            },
  { ticker: '003230', name: '삼양식품',      market: 'KOSDAQ', sector: '식품'                              },
  { ticker: '112040', name: '위메이드',      market: 'KOSDAQ', sector: '게임'                              },
  { ticker: '067310', name: '하이브로',      market: 'KOSDAQ', sector: 'IT서비스'                          },
  { ticker: '041020', name: '폴라리스오피스', market:'KOSDAQ', sector: 'IT서비스'                           },
  { ticker: '078935', name: 'GS',           market: 'KOSPI',  sector: '지주'                              },
]

export const ALL_SECTORS = [
  ...new Set(POPULAR_STOCKS.map((s) => s.sector)),
].sort()

export const ALL_MARKETS: ('KOSPI' | 'KOSDAQ')[] = ['KOSPI', 'KOSDAQ']

export function filterStocks(
  query: string,
  markets: string[],
  sectors: string[]
): StockInfo[] {
  return POPULAR_STOCKS.filter((stock) => {
    const matchText =
      !query ||
      stock.name.includes(query) ||
      stock.ticker.includes(query)

    const matchMarket =
      markets.length === 0 || markets.includes(stock.market)

    const matchSector =
      sectors.length === 0 || sectors.includes(stock.sector)

    return matchText && matchMarket && matchSector
  }).slice(0, 50)
}
