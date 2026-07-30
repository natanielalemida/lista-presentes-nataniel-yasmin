<div align="center">

![Nataniel & Yasmin — Lista de Presentes](public/og.png)

# 💍 Nataniel & Yasmin

### Lista de presentes de casamento

Uma experiência digital elegante, responsiva e segura para celebrar o início de um novo lar.

[![Site ao vivo](https://img.shields.io/badge/Ver_site_ao_vivo-263E34?style=for-the-badge&logo=vercel&logoColor=white)](https://nataniel-e-yasmin.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel&logoColor=white)
![Responsive](https://img.shields.io/badge/Design-Responsivo-B48A52?style=flat-square)

</div>

---

## ✨ Sobre o projeto

Este projeto transforma uma lista de presentes de casamento em uma experiência afetiva e organizada. Os convidados podem consultar os itens, conferir cores e quantidades, informar o nome e compartilhar a escolha com o casal.

Quando todas as unidades de um presente são reservadas, ele passa automaticamente para o estado **indisponível** em computadores e celulares. O casal acompanha tudo por um painel administrativo protegido.

> “Tudo o que fizerem, seja em palavra seja em ação, façam-no em nome do Senhor Jesus, dando por meio dele graças a Deus Pai.”
>
> **Colossenses 3:17**

**Toda honra e toda glória a Deus.**

## 🌿 Destaques

- Interface editorial com estética de casamento e paleta neutra.
- Layout totalmente responsivo para desktop, tablet e celular.
- Contagem regressiva para a data do casamento.
- Filtros de presentes por cômodo.
- Imagens, descrições, cores sugeridas e quantidades por item.
- Reservas persistentes com atualização global de disponibilidade.
- Estado visual claro para presentes esgotados.
- Compartilhamento com nome, presente, cor, data e versículo.
- Painel administrativo protegido para consultar e remover escolhas.
- Armazenamento privado dos registros no Vercel Blob.
- Metadados para compartilhamento em redes sociais.
- Cuidados de acessibilidade, navegação por teclado e foco em diálogos.

## 🧭 Como funciona

```text
Convidado escolhe um presente
        ↓
Informa o nome e uma mensagem opcional
        ↓
Confirma e compartilha a escolha
        ↓
A disponibilidade é atualizada para todos
        ↓
O casal acompanha pelo painel administrativo
```

## 🛠️ Tecnologias

| Tecnologia | Uso |
| --- | --- |
| [Next.js](https://nextjs.org/) | Aplicação web e rotas do servidor |
| [React](https://react.dev/) | Interface e interações |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem e segurança do código |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Persistência privada das reservas |
| [Lucide React](https://lucide.dev/) | Ícones |
| [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) | Tipografia editorial |
| [Manrope](https://fonts.google.com/specimen/Manrope) | Tipografia da interface |
| [Vercel](https://vercel.com/) | Hospedagem e deploy |

## 🚀 Rodando localmente

### Pré-requisitos

- Node.js `22.13` ou superior
- npm
- Um projeto Vercel Blob, caso queira testar reservas persistentes

### Instalação

```bash
git clone https://github.com/natanielalemida/lista-presentes-nataniel-yasmin.git
cd lista-presentes-nataniel-yasmin
npm install
```

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## 🔐 Variáveis de ambiente

| Variável | Visibilidade | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Pública | Endereço final do site |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Pública | Número com país e DDD, somente dígitos |
| `BLOB_READ_WRITE_TOKEN` | Privada | Token do Vercel Blob usado pelas reservas |
| `ADMIN_PASSWORD` | Privada | Senha forte do painel administrativo |
| `ADMIN_SESSION_SECRET` | Privada | Segredo longo para assinar a sessão administrativa |

> Nunca publique `.env.local`, tokens ou senhas. O repositório inclui apenas `.env.example`, sem valores privados.

## 📜 Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Cria a versão otimizada de produção |
| `npm start` | Executa a build de produção |
| `npm run lint` | Analisa a qualidade do código |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm test` | Executa tipagem e build completa |

## 🗂️ Estrutura principal

```text
app/
├── admin/                 # Login e painel administrativo
├── api/                   # Reservas, disponibilidade e sessão
├── lib/                   # Persistência, autenticação e segurança
├── GiftRegistry.tsx       # Experiência principal da lista
├── WeddingCountdown.tsx   # Contagem regressiva
├── gifts.ts               # Catálogo de presentes
├── globals.css            # Design system e responsividade
├── layout.tsx             # Metadados e fontes
└── page.tsx               # Página inicial

public/
├── og.png                 # Imagem de compartilhamento
└── wedding-botanical.webp # Textura botânica
```

## ☁️ Publicação na Vercel

1. Importe o repositório na Vercel.
2. Crie ou conecte um Vercel Blob privado.
3. Cadastre todas as variáveis de ambiente.
4. Faça o deploy usando as configurações padrão do Next.js.
5. Defina o domínio de produção em `NEXT_PUBLIC_SITE_URL`.

O projeto em produção está disponível em:

### [nataniel-e-yasmin.vercel.app](https://nataniel-e-yasmin.vercel.app)

## 🛡️ Segurança e privacidade

- A senha administrativa nunca é enviada ao navegador.
- A sessão do painel usa cookie seguro e assinado.
- Tentativas de login possuem limitação persistente.
- As reservas ficam em armazenamento privado.
- Operações administrativas validam origem e sessão.
- Exclusões usam controle de concorrência para evitar remoções incorretas.
- O site não solicita pagamentos nem dados bancários.

## 🤍 Uso do projeto

Este é um projeto pessoal e público para fins de portfólio e transparência técnica. A identidade visual, os textos do casal e as imagens dos presentes não estão licenciados para reutilização comercial.

---

<div align="center">

Feito com amor para **Nataniel & Yasmin**.

**Toda honra e toda glória a Deus — Colossenses 3:17.**

</div>
