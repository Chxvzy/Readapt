<div align="center">

<img src="frontend/assets/logo-readapt-white.png" alt="Readapt Logo" width="120"/>

# Readapt

### Veja Além das Letras

Sistema tecnológico educacional que combina robótica, óculos inteligentes, inteligência artificial e gamificação para auxiliar crianças com dislexia durante o processo de aprendizagem da leitura.

</div>

---

## 📖 Sobre o Projeto

O **Readapt** é uma solução educacional desenvolvida para tornar a leitura mais acessível para crianças com dislexia.

O projeto integra hardware e software em um único ecossistema composto por:

- 🤖 Robô Educacional
- 👓 Óculos Inteligentes
- 📱 Aplicativo Mobile
- 🎮 Jogo Educativo
- 🤖 Inteligência Artificial
- 📷 Reconhecimento Óptico de Caracteres (OCR)

A proposta é transformar o aprendizado em uma experiência interativa, personalizada e motivadora.

---

## ✨ Funcionalidades

- Sistema de leitura assistida
- OCR para identificação de textos
- Integração entre robô e óculos inteligentes
- Aplicativo para gerenciamento dos dispositivos
- Manual interativo
- Referências científicas
- Jogo educativo "Boss Against Dyslexia"
- Modo Escuro
- Layout Responsivo

---

## 🛠 Tecnologias

### Front-end

- HTML5
- CSS3
- JavaScript

### Hardware

- ESP32 WROOM
- Câmera ESP32-CAM
- Sensores Inteligentes

### Inteligência Artificial

- OCR
- Processamento de Texto
- Assistência em Tempo Real

---

## Estrutura do Site

- Home
- Instruções
- Produtos
- Quem Somos
- Referências
- Game

---

## Estrutura do Projeto

```text
Readapt/
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── js/
│   │   └── config.js
│   └── *.html
├── backend/
│   ├── uploads/
│   ├── package.json
│   ├── db.js
│   └── server.js
├── .env
├── .env.example
├── package.json
└── package-lock.json
```

---

## 🚀 Como Executar

1. Instale as dependências na raiz do projeto:

```bash
npm install
```

2. Configure as variáveis no arquivo `.env` da raiz. Use `.env.example` como referência; não compartilhe nem versione o `.env`.

3. Inicie a API e o frontend:

```bash
npm start
```

4. Acesse `http://localhost:3000` no navegador.

## Publicar na Vercel

O frontend e o backend devem ser projetos Vercel separados:

1. Crie o projeto do backend com **Root Directory** `backend/`.
2. Configure no projeto do backend `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
3. Crie um Blob Store, conecte-o ao projeto do backend e disponibilize `BLOB_READ_WRITE_TOKEN` (ou as credenciais OIDC geradas pela Vercel).
4. Faça o deploy do backend e copie sua URL pública.
5. Em `frontend/js/config.js`, substitua a URL local pela URL do backend seguida de `/api`.
6. Crie o projeto do frontend com **Root Directory** `frontend/` e faça o deploy.
7. Adicione o domínio do frontend às origens JavaScript autorizadas do cliente OAuth do Google e confirme que o MySQL aceita conexões da Vercel.

As fotos enviadas em produção são armazenadas no Blob com acesso público, como no fluxo atual de `/uploads`. Qualquer pessoa com a URL da foto pode visualizá-la. O token do Blob deve ficar somente nas variáveis de ambiente do backend.

---

## 🎯 Objetivo

O objetivo do Readapt é utilizar tecnologia para reduzir as dificuldades enfrentadas por crianças com dislexia, oferecendo uma plataforma que une educação, acessibilidade e inovação.

---

## 👨‍💻 Equipe

WebSite desenvolvido por:

- Felipe Lorenzo
- Pedro Henrique

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos e de pesquisa.

---

<div align="center">

### Readapt

**Veja Além das Letras**

</div>