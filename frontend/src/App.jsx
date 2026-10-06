import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [isbn, setIsbn] = useState('')
  const [livroApi, setLivroApi] = useState(null)
  const [erro, setErro] = useState('')

  const [livros, setLivros] = useState([])
  const [emprestimos, setEmprestimos] = useState([])

  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('')

  const [livroEditando, setLivroEditando] = useState(null)

  const [novoLivro, setNovoLivro] = useState({
    titulo: '',
    autor: '',
    genero: '',
    isbn: '',
    capa: '',
    sinopse: ''
  })

  // ==============================
  // CARREGAR DADOS DO LARAVEL
  // ==============================

  async function carregarSistema() {
    try {
      const respostaLivros = await fetch(
        'http://localhost:8000/api/livros'
      )

      const dadosLivros = await respostaLivros.json()

      setLivros(dadosLivros)

      const respostaEmprestimos = await fetch(
        'http://localhost:8000/api/emprestimos'
      )

      const dadosEmprestimos =
        await respostaEmprestimos.json()

      setEmprestimos(dadosEmprestimos)

    } catch (erro) {
      console.error(
        'Erro ao carregar dados:',
        erro
      )
    }
  }

  useEffect(() => {
    carregarSistema()
  }, [])

  // ==============================
  // OPEN LIBRARY
  // ==============================

  async function buscarLivro() {
    setErro('')
    setLivroApi(null)

    if (!isbn.trim()) {
      setErro('Digite um ISBN.')
      return
    }

    try {
      const resposta = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      )

      const dados = await resposta.json()

      const resultado =
        dados[`ISBN:${isbn}`]

      if (!resultado) {
        setErro('Livro não encontrado.')
        return
      }

      setLivroApi(resultado)

    } catch (erro) {
      console.error(erro)

      setErro(
        'Erro ao consultar a API pública.'
      )
    }
  }

  // ==============================
  // FORMULÁRIO DE CADASTRO
  // ==============================

  function alterarCampo(e) {
    setNovoLivro({
      ...novoLivro,
      [e.target.name]: e.target.value
    })
  }

  async function cadastrarLivro(e) {
    e.preventDefault()

    setMensagem('')
    setTipoMensagem('')

    try {
      const resposta = await fetch(
        'http://localhost:8000/api/livros',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },

          body: JSON.stringify({
            titulo: novoLivro.titulo,
            autor: novoLivro.autor,
            genero: novoLivro.genero,
            isbn: novoLivro.isbn,
            capa: novoLivro.capa || null,
            sinopse:
              novoLivro.sinopse || null
          })
        }
      )

      const dados =
        await resposta.json()

      if (!resposta.ok) {
        setTipoMensagem('erro')

        if (dados.errors?.isbn) {
          setMensagem(
            'Este ISBN já está cadastrado.'
          )
        } else {
          setMensagem(
            'Não foi possível cadastrar o livro.'
          )
        }

        return
      }

      setTipoMensagem('sucesso')

      setMensagem(
        'Livro cadastrado com sucesso!'
      )

      setNovoLivro({
        titulo: '',
        autor: '',
        genero: '',
        isbn: '',
        capa: '',
        sinopse: ''
      })

      await carregarSistema()

    } catch (erro) {
      console.error(erro)

      setTipoMensagem('erro')

      setMensagem(
        'Erro ao conectar com o servidor.'
      )
    }
  }

  // ==============================
  // EDITAR LIVRO
  // ==============================

  function iniciarEdicao(livro) {
    setLivroEditando({
      ...livro
    })
  }

  async function salvarEdicao() {
    if (!livroEditando) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:8000/api/livros/${livroEditando.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body: JSON.stringify({
            titulo:
              livroEditando.titulo,

            autor:
              livroEditando.autor,

            genero:
              livroEditando.genero,

            isbn:
              livroEditando.isbn,

            capa:
              livroEditando.capa || null,

            sinopse:
              livroEditando.sinopse || null
          })
        }
      )

      const dados =
        await resposta.json()

      if (!resposta.ok) {
        console.error(
          'Erro ao atualizar:',
          dados
        )

        alert(
          dados.message ||
          'Não foi possível atualizar o livro.'
        )

        return
      }

      alert(
        'Livro atualizado com sucesso!'
      )

      setLivroEditando(null)

      await carregarSistema()

    } catch (erro) {
      console.error(
        'Erro ao atualizar livro:',
        erro
      )

      alert(
        'Erro ao conectar com o servidor.'
      )
    }
  }

  // ==============================
  // EXCLUIR LIVRO
  // ==============================

  async function excluirLivro(id) {
    const confirmar =
      window.confirm(
        'Tem certeza que deseja excluir este livro?'
      )

    if (!confirmar) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:8000/api/livros/${id}`,
        {
          method: 'DELETE',

          headers: {
            Accept:
              'application/json'
          }
        }
      )

      if (!resposta.ok) {
        alert(
          'Não foi possível excluir o livro.'
        )

        return
      }

      setLivros(
        listaAtual =>
          listaAtual.filter(
            livro =>
              livro.id !== id
          )
      )

      if (
        livroEditando?.id === id
      ) {
        setLivroEditando(null)
      }

      alert(
        'Livro excluído com sucesso!'
      )

    } catch (erro) {
      console.error(erro)

      alert(
        'Erro ao conectar com o servidor.'
      )
    }
  }

  // ==============================
  // INTERFACE
  // ==============================

  return (
    <div className="app-layout">

      {/* MENU LATERAL */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <span>📚</span>

          <div>
            <h2>Biblioteca</h2>
            <small>Gestão de livros</small>
          </div>

        </div>

        <nav className="menu">

          <a href="#inicio">
            🏠 Início
          </a>

          <a href="#consulta">
            🔎 Buscar ISBN
          </a>

          <a href="#cadastro">
            ➕ Cadastrar Livro
          </a>

          <a href="#livros">
            📖 Livros
          </a>

          <a href="#emprestimos">
            🔄 Empréstimos
          </a>

        </nav>

      </aside>


      {/* ÁREA PRINCIPAL */}

      <div className="area-principal">

        {/* CABEÇALHO */}

        <header
          className="topbar"
          id="inicio"
        >

          <div>

            <h1>
              Sistema de Gestão de Biblioteca
            </h1>

            <p>
              Gerenciamento de livros e empréstimos
            </p>

          </div>


          <div className="usuario-topo">

            <span>
              👤 Usuario Teste
            </span>

            <button
              type="button"
              className="botao-sair"
              onClick={() => {
                window.location.href =
                  'http://localhost:8000/sair'
              }}
            >
              Sair
            </button>

          </div>

        </header>


        <main className="conteudo">

          {/* BUSCA ISBN */}

          <section
            className="card"
            id="consulta"
          >

            <h2>
              🔎 Consulta pública por ISBN
            </h2>

            <div className="busca">

              <input
                type="text"
                placeholder="Digite o ISBN"
                value={isbn}
                onChange={
                  e =>
                    setIsbn(
                      e.target.value
                    )
                }
              />

              <button
                type="button"
                onClick={buscarLivro}
              >
                Buscar
              </button>

            </div>


            {erro && (
              <p className="erro">
                {erro}
              </p>
            )}


            {livroApi && (

              <div className="resultado">

                {livroApi.cover?.medium && (

                  <img
                    src={
                      livroApi.cover.medium
                    }
                    alt={
                      livroApi.title
                    }
                  />

                )}


                <div>

                  <h3>
                    {livroApi.title}
                  </h3>

                  <p>
                    <strong>
                      Autor:
                    </strong>{' '}

                    {livroApi.authors
                      ?.map(
                        autor =>
                          autor.name
                      )
                      .join(', ')}
                  </p>

                  <p>
                    <strong>
                      Editora:
                    </strong>{' '}

                    {livroApi.publishers
                      ?.map(
                        editora =>
                          editora.name
                      )
                      .join(', ')}
                  </p>

                  <p>
                    <strong>
                      Publicação:
                    </strong>{' '}

                    {
                      livroApi.publish_date
                    }
                  </p>

                  <p>
                    <strong>
                      ISBN pesquisado:
                    </strong>{' '}

                    {isbn}
                  </p>

                </div>

              </div>

            )}

          </section>


          {/* CADASTRO */}

          <section
            className="card"
            id="cadastro"
          >

            <h2>
              ➕ Cadastrar Livro
            </h2>

            <form
              className="formulario"
              onSubmit={
                cadastrarLivro
              }
            >

              <input
                name="titulo"
                placeholder="Título"
                value={
                  novoLivro.titulo
                }
                onChange={
                  alterarCampo
                }
                required
              />

              <input
                name="autor"
                placeholder="Autor"
                value={
                  novoLivro.autor
                }
                onChange={
                  alterarCampo
                }
                required
              />

              <input
                name="genero"
                placeholder="Gênero"
                value={
                  novoLivro.genero
                }
                onChange={
                  alterarCampo
                }
                required
              />

              <input
                name="isbn"
                placeholder="ISBN"
                value={
                  novoLivro.isbn
                }
                onChange={
                  alterarCampo
                }
                required
              />

              <input
                name="capa"
                placeholder="URL da capa (opcional)"
                value={
                  novoLivro.capa
                }
                onChange={
                  alterarCampo
                }
              />

              <textarea
                name="sinopse"
                placeholder="Sinopse"
                value={
                  novoLivro.sinopse
                }
                onChange={
                  alterarCampo
                }
              />

              <button
                type="submit"
              >
                Cadastrar Livro
              </button>

            </form>


            {mensagem && (

              <p
                className={
                  `mensagem ${tipoMensagem}`
                }
              >
                {mensagem}
              </p>

            )}

          </section>


          {/* LIVROS */}

          <section
            className="card"
            id="livros"
          >

            <h2>
              📖 Livros cadastrados
            </h2>


            {livros.length === 0 ? (

              <p>
                Nenhum livro cadastrado.
              </p>

            ) : (

              <div className="lista">

                {livros.map(
                  livro => (

                    <div
                      className="item"
                      key={livro.id}
                    >

                      <h3>
                        {livro.titulo}
                      </h3>

                      <p>
                        <strong>
                          Autor:
                        </strong>{' '}

                        {livro.autor}
                      </p>

                      <p>
                        <strong>
                          Gênero:
                        </strong>{' '}

                        {livro.genero}
                      </p>

                      <p>
                        <strong>
                          ISBN:
                        </strong>{' '}

                        {livro.isbn}
                      </p>


                      {/* BOTÕES */}

                      <div className="acoes-livro">

                        <button
                          type="button"
                          className="botao-editar"
                          onClick={() =>
                            iniciarEdicao(
                              livro
                            )
                          }
                        >
                          ✏️ Editar
                        </button>


                        <button
                          type="button"
                          className="botao-excluir"
                          onClick={() =>
                            excluirLivro(
                              livro.id
                            )
                          }
                        >
                          🗑️ Excluir
                        </button>

                      </div>


                      {/* FORMULÁRIO DE EDIÇÃO */}

                      {
                        livroEditando?.id ===
                          livro.id && (

                          <div className="edicao-livro">

                            <input
                              value={
                                livroEditando.titulo
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    titulo:
                                      e.target.value
                                  })
                              }
                            />


                            <input
                              value={
                                livroEditando.autor
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    autor:
                                      e.target.value
                                  })
                              }
                            />


                            <input
                              value={
                                livroEditando.genero
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    genero:
                                      e.target.value
                                  })
                              }
                            />


                            <input
                              value={
                                livroEditando.isbn
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    isbn:
                                      e.target.value
                                  })
                              }
                            />


                            <input
                              placeholder="URL da capa"
                              value={
                                livroEditando.capa ||
                                ''
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    capa:
                                      e.target.value
                                  })
                              }
                            />


                            <textarea
                              placeholder="Sinopse"
                              value={
                                livroEditando.sinopse ||
                                ''
                              }
                              onChange={
                                e =>
                                  setLivroEditando({
                                    ...livroEditando,

                                    sinopse:
                                      e.target.value
                                  })
                              }
                            />


                            <div className="acoes-edicao">

                              <button
                                type="button"
                                className="botao-salvar"
                                onClick={
                                  salvarEdicao
                                }
                              >
                                💾 Salvar
                              </button>


                              <button
                                type="button"
                                className="botao-cancelar"
                                onClick={() =>
                                  setLivroEditando(
                                    null
                                  )
                                }
                              >
                                ✖ Cancelar
                              </button>

                            </div>

                          </div>

                        )
                      }

                    </div>

                  )
                )}

              </div>

            )}

          </section>


          {/* EMPRÉSTIMOS */}

          <section
            className="card"
            id="emprestimos"
          >

            <h2>
              🔄 Empréstimos
            </h2>


            {
              emprestimos.length === 0
                ? (

                  <p>
                    Nenhum empréstimo cadastrado.
                  </p>

                )
                : (

                  <div className="lista">

                    {
                      emprestimos.map(
                        emprestimo => (

                          <div
                            className="item"
                            key={
                              emprestimo.id
                            }
                          >

                            <p>
                              <strong>
                                Usuário:
                              </strong>{' '}

                              {
                                emprestimo
                                  .usuario
                                  ?.name
                              }
                            </p>


                            <p>
                              <strong>
                                Livro:
                              </strong>{' '}

                              {
                                emprestimo
                                  .livro
                                  ?.titulo
                              }
                            </p>


                            <p>
                              <strong>
                                Data do empréstimo:
                              </strong>{' '}

                              {
                                emprestimo
                                  .data_emprestimo
                              }
                            </p>


                            <p>
                              <strong>
                                Devolução prevista:
                              </strong>{' '}

                              {
                                emprestimo
                                  .data_prevista_devolucao
                              }
                            </p>


                            <p>
                              <strong>
                                Status:
                              </strong>{' '}

                              {
                                emprestimo
                                  .status
                              }
                            </p>

                          </div>

                        )
                      )
                    }

                  </div>

                )
            }

          </section>

        </main>

      </div>

    </div>
  )
}

export default App