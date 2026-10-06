# 📚 Sistema de Gestão de Biblioteca

Projeto semestral da disciplina de Desenvolvimento Web II.

O sistema foi desenvolvido para gerenciar:

- Livros
- Usuários
- Empréstimos

## Tecnologias utilizadas

### Front-end
- React
- Vite
- JavaScript
- CSS

### Back-end
- PHP
- Laravel
- Eloquent ORM
- API REST

### Banco de dados
- PostgreSQL

### Ambiente
- Docker
- Docker Compose

### API pública
- Open Library
## Funcionalidades

### Livros

O sistema possui CRUD completo de livros:

- Cadastrar livro
- Listar livros
- Consultar livro
- Atualizar livro
- Excluir livro

Campos principais:

- Título
- Autor
- Gênero
- ISBN
- Capa
- Sinopse

### Usuários

O sistema possui autenticação de usuários com:

- Login
- Logout
- Sessão
- Cookies

### Empréstimos

Os empréstimos fazem o relacionamento entre usuários e livros.

Cada empréstimo possui:

- Usuário
- Livro
- Data do empréstimo
- Data prevista para devolução
- Data de devolução
- Status

## Executando o projeto

### 1. Iniciar os containers

Na pasta principal do projeto, execute:

docker compose up -d

### 2. Verificar os containers

Execute:

docker ps

Devem aparecer os containers:

- biblioteca_app
- biblioteca_postgres

### 3. Executar as migrations

Execute:

docker compose exec app php artisan migrate

### 4. Acessar o Laravel

Laravel:

http://localhost:8000

API de livros:

http://localhost:8000/api/livros

API de empréstimos:

http://localhost:8000/api/emprestimos

### 5. Executar o React

Entre na pasta frontend:

cd frontend

Depois execute:

npm.cmd run dev

O React ficará disponível em:

http://localhost:5173

## Modelagem do banco de dados

O sistema possui três entidades principais:

- Usuários
- Livros
- Empréstimos

Os relacionamentos são:

- Um usuário pode possuir vários empréstimos.
- Um livro pode aparecer em vários empréstimos.
- Cada empréstimo pertence a um usuário e a um livro.

Representação:

USERS 1 ---- N EMPRESTIMOS N ---- 1 LIVROS

A tabela `emprestimos` possui as chaves estrangeiras:

- `usuario_id` referencia `users.id`
- `livro_id` referencia `livros.id`

## API pública de livros

O front-end React realiza consultas na API pública Open Library.

A pesquisa é feita utilizando o ISBN do livro.

Exemplo utilizado nos testes:

9780140328721

A consulta retorna informações como:

- Título
- Autor
- Editora
- Data de publicação
- Capa
- ISBN

Exemplo de acesso ao front-end:

http://localhost:5173

## Checklist da entrega parcial

- [x] Ambiente de desenvolvimento com Docker Compose
- [x] PostgreSQL configurado
- [x] Laravel funcionando no back-end
- [x] React funcionando no front-end
- [x] Modelagem do banco de dados finalizada
- [x] CRUD de livros via Eloquent
- [x] CRUD de empréstimos
- [x] Relacionamento entre usuários, livros e empréstimos
- [x] Rotas da API organizadas
- [x] Controllers organizados
- [x] Login funcional
- [x] Logout funcional
- [x] Sessão e cookies
- [x] Integração com API pública de livros