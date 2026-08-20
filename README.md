# Voz Jovem

Formulário de pesquisa no estilo Google Forms, com animações, e painel
administrativo com relatórios gráficos e visualização de respostas individuais.

## O que tem pronto

**Formulário público (`/`)**

- Tela de abertura animada e uma pergunta por vez, com transições suaves.
- Pesquisa anônima: não pede nome nem e-mail.
- As 11 perguntas da pesquisa, incluindo:
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
- Situação do formulário em três estados: **aberto**, **pausado** (interrupção
  temporária) e **fechado** (coleta encerrada). Fora do estado aberto o painel
  mostra um aviso destacado, a página pública troca sozinha para o recado
  (e volta ao formulário quando reabre) e a API recusa novos envios.
- Indicadores: total de respostas, gravidade média, % de afetados diretamente e
  % que participariam de um projeto.
- Destaque do problema eleito como prioridade.
- Gráficos: problemas mais citados, problema mais preocupante, faixa etária,
  ocupação, afetados, escala de gravidade, percepção sobre ações da comunidade,
  disposição para participar e volume de respostas por dia.
- Lista de todas as sugestões escritas (pergunta 8).
- Respostas individuais com busca pelo conteúdo.
- Página de resposta individual com todas as perguntas, opção de imprimir/salvar
  em PDF e de excluir.
- Exportação de todas as respostas em CSV, uma linha por participante, com data e
  hora separadas (fuso de São Paulo), sem nome nem e-mail, coluna própria para
  cada texto de "Outro" e colunas que abrem alinhadas no Excel.

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

A Vercel não permite gravar arquivos e reinicia o servidor a cada requisição,
então o SQLite local não serve lá — as respostas seriam perdidas. O código usa o
cliente libSQL, que fala o mesmo protocolo do [Turso](https://turso.tech), um
SQLite hospedado com plano gratuito.

**1. Criar o banco no Turso**

Crie a conta em [turso.tech](https://turso.tech) e, com a CLI instalada:

```bash
turso auth login
turso db create voz-jovem
turso db show voz-jovem --url        # DATABASE_URL (libsql://...)
turso db tokens create voz-jovem     # DATABASE_AUTH_TOKEN
```

As tabelas são criadas sozinhas na primeira vez que o site acessa o banco, junto
com as perguntas padrão.

**2. Importar o projeto na Vercel**

Em [vercel.com/new](https://vercel.com/new), importe o repositório do GitHub. A
Vercel reconhece o Next.js sozinho, sem ajuste de build.

**3. Configurar as variáveis de ambiente**

Ainda na tela de importação, em _Environment Variables_, adicione as quatro:

| Variável              | Valor                                                  |
| --------------------- | ------------------------------------------------------ |
| `DATABASE_URL`        | a URL `libsql://...` do passo 1                        |
| `DATABASE_AUTH_TOKEN` | o token do passo 1                                     |
| `ADMIN_PASSWORD`      | a senha do painel (escolha uma forte, não use a local) |
| `ADMIN_SECRET`        | valor aleatório: `openssl rand -hex 32`                |

Sem `DATABASE_URL` o site sobe, mas quebra na primeira visita com um recado
explicando o que falta. Sem `ADMIN_PASSWORD` o login do painel é recusado.

**4. Publicar**

Clique em _Deploy_. Cada `git push` na branch `main` gera um novo deploy
automaticamente.

## Estrutura

```
app/
  page.tsx                     formulário público
  admin/page.tsx               painel com relatórios
  admin/login/                 tela de login
  admin/respostas/[id]/        resposta individual
  api/responses/               recebe e valida os envios
  api/admin/                   login, logout, situação do formulário,
                               exportação CSV, exclusão
components/
  form/                        telas e controles do formulário
  admin/                       painel, gráficos e cartões
lib/
  default-questions.ts         perguntas com que o banco é semeado
  db.ts                        acesso ao banco (libSQL/SQLite)
  stats.ts                     agregações dos gráficos e geração do CSV
  auth.ts                      sessão do administrador
scripts/
  reset-questions.ts           regrava as perguntas a partir dos padrões
  inspect-db.mjs               mostra perguntas e respostas do banco local
```

## Mudando as perguntas

No dia a dia, use **Gerenciar perguntas** no painel: dá para criar, editar,
reordenar e arquivar sem mexer no código.

Para redefinir a lista inteira, edite `lib/default-questions.ts`. Esses valores
só são gravados quando o banco está vazio; para aplicá-los a um banco que já
tem perguntas, rode:

```bash
node scripts/reset-questions.ts
```

O script se recusa a rodar quando já existem respostas — nesse caso ele exige
`--force`, porque perguntas que saem da lista deixam de aparecer nos
relatórios (as respostas em si continuam guardadas).
