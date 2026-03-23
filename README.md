# Med Bio CRM

Sistema de gestão para clínica de estética. Construído do zero com Next.js 15, Supabase e design "Luxury Clinical".

## Stack
- **Next.js 15** App Router com SSR
- **Supabase** PostgreSQL — sem limite de leituras
- **Supabase Auth** — autenticação email + senha
- **Supabase Realtime** — conversas em tempo real (só inserts)
- **TypeScript** estrito
- **Tailwind CSS** com design system próprio

## Módulos
- Painel com KPIs em tempo real
- Gestão de clientes com histórico de tratamentos
- Funil de vendas Kanban
- Conversas WhatsApp com Realtime
- Serviços e estoque
- Treinamento da IA (Bella)
- Configurações da clínica

## Setup

### 1. Crie o projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) → New Project
2. Vá em **SQL Editor** → cole o conteúdo de `src/lib/supabase/schema.sql` → Run

### 2. Crie o primeiro usuário
No Supabase → **Authentication → Users → Add user**

### 3. Configure as variáveis
```bash
cp .env.example .env.local
# Preencha com as chaves do Supabase (Settings → API)
```

### 4. Instale e rode
```bash
npm install
npm run dev
```

### 5. Deploy na Vercel
```bash
git add . && git commit -m "feat: med bio crm" && git push
```
Adicione as 3 variáveis do Supabase nas configurações da Vercel.

## APIs disponíveis para o n8n

### Webhook WhatsApp
```
POST /api/whatsapp/webhook
{ clientName, clientPhone, content, message, senderPhone, handoff }
```

### Treinamento da Bella
```
GET  /api/treinamento           # Busca toda a config
POST /api/treinamento           # Atualiza um campo
{ campo: "procedimentos", valor: "..." }
Header: x-api-key: SUA_CHAVE
```
