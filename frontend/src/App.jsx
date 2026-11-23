import axios from 'axios'
import { useEffect, useState } from 'react'
import './App.css'

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')


const laravel = axios.create({
  timeout: 30000,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
  validateStatus: () => true
})

function respostaOk(resposta) {
  return resposta.status >= 200 && resposta.status < 300
}

async function requisicaoLaravel(url, { body, method = 'GET', headers, signal } = {}) {
  if (method !== 'GET') {
    const csrf = await laravel.get(`${apiUrl}/sanctum/csrf-cookie`)
    if (!respostaOk(csrf)) throw new Error('Não foi possível iniciar a sessão.')
  }

  return laravel.request({ url, method, headers, signal, data: body })
}

const telas = [
  ['inicio', '🏠', 'Início'],
  ['consulta', '🔎', 'Buscar ISBN'],
  ['cadastro', '＋', 'Cadastrar livro'],
  ['livros', '📖', 'Livros'],
  ['emprestimos', '↔', 'Empréstimos'],
  ['usuarios', '👤', 'Leitores']
]

function telaAtual() {
  const id = window.location.hash.slice(1)
  return telas.some(([tela]) => tela === id) ? id : 'inicio'
}

function App() {
  const [tela, setTela] = useState(telaAtual)
  useEffect(() => {
    function navegar() {
      setTela(telaAtual())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navegar)
    return () => window.removeEventListener('hashchange', navegar)
  }, [])

  const [sessao, setSessao] = useState(undefined)
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [livroApi, setLivroApi] = useState(null)
  const [erro, setErro] = useState('')

  const [livros, setLivros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const [resultadoUsuario, setResultadoUsuario] = useState('')
  const [emprestimos, setEmprestimos] = useState([])
  const [salvandoEmprestimo, setSalvandoEmprestimo] = useState(false)
  const [resultadoEmprestimo, setResultadoEmprestimo] = useState('')

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

  async function carregarSistema(signal) {
    setErroCarregamento(false)
    try {
      const respostaUsuario = await requisicaoLaravel(`${apiUrl}/api/user`, { signal })
      if (respostaUsuario.status === 401) {
        setSessao(null)
        return
      }
      if (!respostaOk(respostaUsuario)) throw new Error('Falha ao consultar sessão.')
      setSessao(respostaUsuario.data)

      const [respostaLivros, respostaEmprestimos, respostaUsuarios] = await Promise.all([
        requisicaoLaravel(`${apiUrl}/api/livros`, { signal }),
        requisicaoLaravel(`${apiUrl}/api/emprestimos`, { signal }),
        requisicaoLaravel(`${apiUrl}/api/usuarios`, { signal })
      ])

      if (respostaLivros.status === 401 || respostaEmprestimos.status === 401) {
        setSessao(null)
        return
      }
      if (!respostaOk(respostaLivros) || !respostaOk(respostaEmprestimos)) {
        throw new Error('Falha ao carregar livros e empréstimos.')
      }

      setLivros(respostaLivros.data)
      setEmprestimos(respostaEmprestimos.data)
      if (respostaOk(respostaUsuarios) && Array.isArray(respostaUsuarios.data)) {
        setUsuarios(respostaUsuarios.data)
      } else {
        setErroCarregamento(true)
      }
    } catch (erro) {
      if (axios.isCancel(erro)) return
      setErroCarregamento(true)
      console.error('Erro ao carregar dados:', erro)
    }
  }

  async function cadastrarUsuario(evento) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    setSalvandoUsuario(true)
    setResultadoUsuario('')
    try {
      const resposta = await requisicaoLaravel(`${apiUrl}/api/usuarios`, {
        method: 'POST',
        body: Object.fromEntries(new FormData(formulario))
      })
      if (!respostaOk(resposta)) {
        const erro = Object.values(resposta.data?.errors ?? {}).flat().join(' ')
        throw new Error(erro || 'Não foi possível cadastrar o usuário.')
      }
      setUsuarios(atuais => [...atuais, resposta.data].sort((a, b) => a.name.localeCompare(b.name)))
      formulario.reset()
      setResultadoUsuario('Leitor cadastrado.')
    } catch (erro) {
      setResultadoUsuario(erro.message)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  async function salvarEmprestimo(dados, id) {
    setSalvandoEmprestimo(true)
    setResultadoEmprestimo('')
    try {
      const rota = id ? `/api/emprestimos/${id}` : '/api/emprestimos'
      const resposta = await requisicaoLaravel(`${apiUrl}${rota}`, {
        method: id ? 'PATCH' : 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      const resultado = resposta.data
      if (!respostaOk(resposta)) throw new Error(resultado.message || resultado.mensagem || 'Falha ao salvar.')
      setEmprestimos(atuais => id
        ? atuais.map(item => item.id === id ? resultado.emprestimo : item)
        : [...atuais, resultado.emprestimo])
      setResultadoEmprestimo(id ? 'Devolução registrada.' : 'Empréstimo cadastrado.')
      return true
    } catch (erro) {
      setResultadoEmprestimo(erro.message)
      return false
    } finally {
      setSalvandoEmprestimo(false)
    }
  }

  async function cadastrarEmprestimo(evento) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const dados = Object.fromEntries(new FormData(formulario))
    if (await salvarEmprestimo(dados)) formulario.reset()
  }

  useEffect(() => {
    const controle = new AbortController()
    carregarSistema(controle.signal)
    return () => controle.abort()
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
      const resposta = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      )

      const dados = resposta.data

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
      const resposta = await requisicaoLaravel(
        `${apiUrl}/api/livros`,
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
        resposta.data

      if (!respostaOk(resposta)) {
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
      const resposta = await requisicaoLaravel(
        `${apiUrl}/api/livros/${livroEditando.id}`,
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
        resposta.data

      if (!respostaOk(resposta)) {
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
      const resposta = await requisicaoLaravel(
        `${apiUrl}/api/livros/${id}`,
        {
          method: 'DELETE',

          headers: {
            Accept:
              'application/json'
          }
        }
      )

      if (!respostaOk(resposta)) {
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

  const avisoCarregamento = (
    <div role="alert">
      <p>Não foi possível carregar a Biblioteca.</p>
      <button type="button" onClick={() => carregarSistema()}>Tentar novamente</button>
    </div>
  )

  if (sessao === undefined) {
    return <main className="conteudo"><section className="card">
      <h1>Sistema de Gestão de Biblioteca</h1>
      {erroCarregamento ? avisoCarregamento : <p role="status">Verificando sua sessão…</p>}
    </section></main>
  }

  if (sessao === null) {
    return <main className="conteudo"><section className="card">
      <h1>Sistema de Gestão de Biblioteca</h1>
      <a className="login-link" href={`${apiUrl}/login`}>Entrar na Biblioteca</a>
    </section></main>
  }
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

        <nav className="menu" aria-label="Menu da biblioteca">
          {telas.map(([id, icone, texto]) => (
            <a key={id} href={`#${id}`} aria-current={tela === id ? 'page' : undefined}>
              <span aria-hidden="true">{icone}</span>{' '}{texto}
            </a>
          ))}
        </nav>

      </aside>


      {/* ÁREA PRINCIPAL */}

      <div className="area-principal">

        {/* CABEÇALHO */}

        <header
          className="topbar"

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

            <span>{sessao.name}</span>

            <button
              type="button"
              className="botao-sair"
              onClick={async () => {
                try {
                  const resposta = await requisicaoLaravel(`${apiUrl}/logout`, { method: 'POST' })
                  if (!respostaOk(resposta)) throw new Error('Falha ao sair.')
                  setLivros([])
                  setEmprestimos([])
                  setSessao(null)
                } catch (erro) {
                  window.alert(erro.message)
                }
              }}
            >
              Sair
            </button>

          </div>

        </header>


        <main className="conteudo">

          {erroCarregamento && avisoCarregamento}
          <section className="card" id="inicio" hidden={tela !== 'inicio'}>
            <h2>Visão geral</h2>
            <div className="lista">
              <a className="item atalho" href="#livros">Livros cadastrados <strong>{livros.length}</strong></a>
              <a className="item atalho" href="#emprestimos">Empréstimos em aberto <strong>{emprestimos.filter(item => !item.data_devolucao).length}</strong></a>
              <a className="item atalho" href="#usuarios">Leitores cadastrados <strong>{usuarios.length}</strong></a>
            </div>
          </section>
          <section className="card" id="usuarios" hidden={tela !== 'usuarios'}>
            <h2>Cadastrar leitor</h2>
            <form className="formulario" onSubmit={cadastrarUsuario}>
              <label>Nome <input name="name" autoComplete="off" required /></label>
              <label>E-mail <input name="email" type="email" autoComplete="off" required /></label>
              <button type="submit" disabled={salvandoUsuario}>Cadastrar leitor</button>
            </form>
            <p role="status">{resultadoUsuario}</p>
          </section>
          {/* BUSCA ISBN */}

          <section
            className="card"
            id="consulta" hidden={tela !== 'consulta'}
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
            id="cadastro" hidden={tela !== 'cadastro'}
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
            id="livros" hidden={tela !== 'livros'}
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
            id="emprestimos" hidden={tela !== 'emprestimos'}
          >

            <h2>
              🔄 Empréstimos
            </h2>
            <form onSubmit={cadastrarEmprestimo}>
              <label>Leitor <select name="usuario_id" required defaultValue="">
                <option value="" disabled>Selecione um leitor</option>
                {usuarios.map(usuario => <option key={usuario.id} value={usuario.id}>{usuario.name} (#{usuario.id})</option>)}
              </select></label>
              <label>Livro <select name="livro_id" required defaultValue="">
                <option value="" disabled>Selecione um livro</option>
                {livros.map(livro => <option key={livro.id} value={livro.id}>{livro.titulo}</option>)}
              </select></label>
              <label>Data do empréstimo <input name="data_emprestimo" type="date" required /></label>
              <label>Devolução prevista <input name="data_prevista_devolucao" type="date" required /></label>
              <button type="submit" disabled={salvandoEmprestimo}>Cadastrar empréstimo</button>
            </form>
            <p role="status">{resultadoEmprestimo}</p>



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
                                  .status || (emprestimo.data_devolucao ? 'devolvido' : 'em aberto')
                              }
                            </p>
                            {emprestimo.data_devolucao ? (
                              <p>Devolvido em {emprestimo.data_devolucao.slice(0, 10)}</p>
                            ) : (
                              <button type="button" disabled={salvandoEmprestimo} onClick={() => {
                                const hoje = new Date()
                                const data = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
                                  .toISOString().slice(0, 10)
                                salvarEmprestimo({ data_devolucao: data, status: 'devolvido' }, emprestimo.id)
                              }}>Registrar devolução</button>
                            )}

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
