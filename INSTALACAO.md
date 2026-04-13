# Instalação do Web Dashboard

## Pré-requisitos

- Node.js 18+ instalado
- Backend rodando na porta 3001

## Passos de Instalação

1. **Instalar dependências:**
```bash
cd web-dashboard
npm install
```

2. **Verificar configuração do backend:**
   - Certifique-se que o backend está rodando em `http://localhost:3001`
   - O proxy está configurado no `vite.config.ts`

3. **Executar o dashboard:**
```bash
npm run dev
```

4. **Acessar:**
   - Abra o navegador em: `http://localhost:5173`

## Credenciais Padrão

- **Email:** `admin@seguranca.ao`
- **Senha:** `admin123`

## Estrutura Criada

```
web-dashboard/
├── src/
│   ├── components/        # Layout, PrivateRoute
│   ├── pages/            # Login, Dashboard, Alertas, etc
│   ├── store/            # AuthStore (Zustand)
│   ├── lib/              # API client
│   └── App.tsx           # Rotas principais
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Funcionalidades

✅ **Dashboard Principal**
- Estatísticas em tempo real
- Gráficos de alertas por tipo
- Gráficos de tendência temporal
- Cards de métricas

✅ **Gestão de Alertas**
- Listagem completa
- Filtros por status
- Busca por texto
- Detalhes do alerta
- Mudança de status

✅ **Gestão de Usuários**
- Listagem de todos os usuários
- Filtros e busca
- Informações detalhadas

✅ **Gestão de Instituições**
- Listagem em cards
- Busca por nome
- Informações de cada instituição

✅ **Perfil do Usuário**
- Informações pessoais
- Ações de conta

## Tecnologias Utilizadas

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (estilização)
- React Router (roteamento)
- Zustand (estado global)
- Recharts (gráficos)
- Axios (HTTP client)
- React Hot Toast (notificações)

## Design

- Interface moderna e profissional
- Totalmente responsiva
- Animações suaves
- Cores consistentes
- Componentes reutilizáveis

