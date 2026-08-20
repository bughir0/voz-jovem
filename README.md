# Voz Jovem

Formulário de pesquisa no estilo Google Forms, com animações, e painel
administrativo com relatórios gráficos e visualização de respostas individuais.

## O que tem pronto

**Formulário público (`/`)**

- Tela de abertura animada e uma pergunta por vez, com transições suaves.
- Nome e e-mail obrigatórios antes das perguntas.
- As 9 perguntas da pesquisa, incluindo:
  - marcação de até 3 problemas na pergunta 3;
  - pergunta 4 mostrando **apenas** os problemas que a pessoa marcou na 3,
    aceitando uma única resposta (é ela que define a prioridade);
  - campos "Outro" com texto livre nas perguntas 2 e 3;
  - escala animada de 1 a 5 na pergunta 6;
  - pergunta 8 aberta e opcional.
- Avanço automático ao escolher uma alternativa, navegação por Enter, botão
  voltar e barra de progresso.
- Tela final com confete e opção de enviar outra resposta.

**Painel administrativo (`/admin`)**

- Login por senha (cookie de sessão assinado, válido por 8 horas).
- Indicadores: total de respostas, gravidade média, % de afetados diretamente e
  % que participariam de um projeto.
- Destaque do problema eleito como prioridade.
- Gráficos: problemas mais citados, problema mais preocupante, faixa etária,
  ocupação, afetados, escala de gravidade, percepção sobre ações da comunidade,
  disposição para participar e volume de respostas por dia.
- Lista de todas as sugestões escritas (pergunta 8).
- Respostas individuais com busca por nome, e-mail ou problema.
- Página de resposta individual com todas as perguntas, opção de imprimir/salvar
  em PDF e de excluir.
- Exportação de todas as respostas em CSV (abre no Excel com os acentos corretos).

## Como rodar

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000 para o formulário e http://localhost:3000/admin para
o painel.

## Configuração

Copie `.env.example` para `.env.local` e ajuste:

| Variável              | Para que serve                                              |
| --------------------- | ----------------------------------------------------------- |
| `ADMIN_PASSWORD`      | Senha de acesso ao painel `/admin`.                         |
| `ADMIN_SECRET`        | Segredo que assina o cookie de sessão do admin.             |
| `DATABASE_URL`        | `file:./data/voz-jovem.db` no local, ou uma URL libSQL.     |
| `DATABASE_AUTH_TOKEN` | Token do banco na nuvem (somente em produção).              |

A senha atual em `.env.local` é `admin123` — **troque antes de publicar.**

## Banco de dados

Em desenvolvimento as respostas ficam em `data/voz-jovem.db`, um arquivo SQLite
criado automaticamente na primeira resposta. A pasta `data/` está no
`.gitignore`.

## Publicando na Vercel

A Vercel não permite gravar arquivos, então o SQLite local não funciona lá. O
código usa o cliente libSQL, que fala o mesmo protocolo do
[Turso](https://turso.tech):

1. Crie um banco gratuito no Turso e copie a URL e o token.
2. Na Vercel, configure as variáveis `DATABASE_URL` (`libsql://...`),
   `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD` e `ADMIN_SECRET`.
3. Faça o deploy. Nenhuma alteração de código é necessária.

## Estrutura

```
app/
  page.tsx                     formulário público
  admin/page.tsx               painel com relatórios
  admin/login/                 tela de login
  admin/respostas/[id]/        resposta individual
  api/responses/               recebe e valida os envios
  api/admin/                   login, logout, exportação CSV, exclusão
components/
  form/                        telas e controles do formulário
  admin/                       painel, gráficos e cartões
lib/
  questions.ts                 perguntas e alternativas
  db.ts                        acesso ao banco (libSQL/SQLite)
  stats.ts                     agregações dos gráficos e geração do CSV
  auth.ts                      sessão do administrador
```

Para mudar textos ou alternativas das perguntas, edite apenas
`lib/questions.ts`: o formulário, a validação do servidor e os gráficos usam a
mesma fonte.
