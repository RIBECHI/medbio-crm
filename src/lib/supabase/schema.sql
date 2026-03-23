-- Med Bio CRM — Schema completo
-- Execute no SQL Editor do Supabase

create extension if not exists "uuid-ossp";

-- CLIENTES
create table clients (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  email text,
  phone text,
  cpf text,
  photo_url text,
  join_date timestamptz default now(),
  dob date,
  address text,
  notes text,
  medical_history text[],
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_clients_phone on clients(phone);
create index idx_clients_name on clients(lower(display_name));

-- TRATAMENTOS
create table treatments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  date timestamptz not null,
  service_name text not null,
  professional text not null,
  price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now()
);
create index idx_treatments_client on treatments(client_id);

-- ETAPAS DO FUNIL
create table lead_stages (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  "order" integer not null default 0,
  color text not null default '#c99318',
  description text,
  created_at timestamptz default now()
);
insert into lead_stages (name, "order", color) values
  ('Novo Lead', 0, '#888'),
  ('Contato Feito', 1, '#3b82f6'),
  ('Interesse Confirmado', 2, '#f59e0b'),
  ('Proposta Enviada', 3, '#8b5cf6'),
  ('Convertido', 4, '#10b981'),
  ('Perdido', 5, '#ef4444');

-- LEADS
create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  source text default 'WhatsApp',
  status text not null default 'Novo Lead',
  owner text,
  potential_value numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_leads_status on leads(status);
create index idx_leads_phone on leads(phone);

-- HISTÓRICO DE LEADS
create table lead_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade not null,
  date timestamptz default now(),
  interaction_type text not null,
  summary text not null,
  next_action text,
  next_action_date date,
  created_at timestamptz default now()
);

-- SERVIÇOS
create table services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text,
  duration_minutes integer default 60,
  price numeric(10,2) not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- ESTOQUE
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  stock integer not null default 0,
  max_stock integer not null default 100,
  low_stock_threshold integer not null default 10,
  unit text default 'un',
  last_restock date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MENSAGENS WHATSAPP
create table whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null default 'Desconhecido',
  client_phone text not null,
  sender_phone text,
  content text not null default '',
  message text not null default '',
  sent_date timestamptz default now(),
  is_read boolean not null default false,
  is_client boolean not null default false,
  handoff boolean not null default false,
  created_at timestamptz default now()
);
create index idx_wa_phone on whatsapp_messages(client_phone);
create index idx_wa_date on whatsapp_messages(sent_date desc);
create index idx_wa_unread on whatsapp_messages(is_read) where is_read = false;

-- LOGS N8N
create table n8n_logs (
  id uuid primary key default uuid_generate_v4(),
  received_at timestamptz default now(),
  data jsonb not null,
  is_read boolean not null default false
);

-- TREINAMENTO IA
create table ai_training (
  id uuid primary key default uuid_generate_v4(),
  campo text not null unique,
  valor text not null default '',
  updated_at timestamptz default now()
);
insert into ai_training (campo, valor) values
  ('apresentacao', ''),
  ('procedimentos', ''),
  ('faqs', ''),
  ('regras', ''),
  ('promocoes', ''),
  ('horarios', '');

-- CONFIGURAÇÕES
create table settings (
  id text primary key default 'general',
  clinic_name text default 'Med Bio',
  logo_url text,
  whatsapp_number text,
  automation_key text,
  n8n_webhook_url text,
  updated_at timestamptz default now()
);
insert into settings (id) values ('general') on conflict do nothing;

-- Realtime só para mensagens
alter publication supabase_realtime add table whatsapp_messages;

-- RLS desabilitado (sistema de uso interno)
alter table clients disable row level security;
alter table treatments disable row level security;
alter table leads disable row level security;
alter table lead_history disable row level security;
alter table lead_stages disable row level security;
alter table services disable row level security;
alter table products disable row level security;
alter table whatsapp_messages disable row level security;
alter table n8n_logs disable row level security;
alter table ai_training disable row level security;
alter table settings disable row level security;
