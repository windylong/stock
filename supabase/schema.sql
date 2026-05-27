-- 종목 관심 목록
create table if not exists stocks (
  id uuid default gen_random_uuid() primary key,
  ticker varchar(20) not null unique,
  name varchar(100) not null,
  market varchar(20) default 'KOSPI',
  sector varchar(100),
  dart_code varchar(20),
  created_at timestamptz default now()
);

-- 뉴스 기사
create table if not exists news_articles (
  id uuid default gen_random_uuid() primary key,
  ticker varchar(20),
  title text not null,
  content text,
  url text,
  source varchar(50) not null,
  published_at timestamptz,
  collected_at timestamptz default now(),
  collection_slot varchar(20),
  is_relevant boolean default false
);

create unique index if not exists news_articles_url_idx on news_articles(url) where url is not null;
create index if not exists news_articles_ticker_idx on news_articles(ticker);
create index if not exists news_articles_collected_at_idx on news_articles(collected_at desc);

-- AI 분석 결과
create table if not exists analyses (
  id uuid default gen_random_uuid() primary key,
  ticker varchar(20) not null,
  analysis_type varchar(20) not null,
  summary text,
  impact text,
  prediction text,
  actual_comparison text,
  sentiment varchar(20) default 'neutral',
  article_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists analyses_ticker_type_idx on analyses(ticker, analysis_type, created_at desc);

-- 주가 스냅샷
create table if not exists price_snapshots (
  id uuid default gen_random_uuid() primary key,
  ticker varchar(20) not null,
  price decimal(12,2),
  change_amount decimal(12,2),
  change_rate decimal(6,2),
  volume bigint,
  recorded_at timestamptz default now()
);

create index if not exists price_snapshots_ticker_idx on price_snapshots(ticker, recorded_at desc);

-- RLS 비활성화 (서버사이드 전용)
alter table stocks disable row level security;
alter table news_articles disable row level security;
alter table analyses disable row level security;
alter table price_snapshots disable row level security;

-- 샘플 종목 데이터
insert into stocks (ticker, name, market, sector, dart_code) values
  ('005930', '삼성전자', 'KOSPI', '전기전자', '00126380'),
  ('000660', 'SK하이닉스', 'KOSPI', '전기전자', '00164779'),
  ('035420', 'NAVER', 'KOSPI', 'IT서비스', '00349015'),
  ('005380', '현대차', 'KOSPI', '자동차', '00164742'),
  ('051910', 'LG화학', 'KOSPI', '화학', '00401731')
on conflict (ticker) do nothing;
