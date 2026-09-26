// ==========================================
// 1. GERENCIAMENTO DE TELAS (NAVEGAÇÃO)
// ==========================================
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
  }
}

// Aliases para manter compatibilidade
function mudarTela(idDaNovaTela) {
  showScreen(idDaNovaTela);
}

function navegarPara(idDaNovaTela) {
  showScreen(idDaNovaTela);
}

// ==========================================
// 2. GERENCIAMENTO DOS POP-UPS (MODAIS)
// ==========================================
function abrirPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.add('active');
  }
}

function fecharPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.remove('active');
  }
}

// Fecha o pop-up de sucesso e redireciona para a Tela Principal (Dashboard)
function fecharPopupEIrParaMain(id) {
  fecharPopup(id);
  showScreen("screen-main");
}

// Fechar qualquer pop-up ao clicar no fundo escuro (overlay)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('popup-overlay')) {
    const popupId = e.target.id;
    e.target.classList.remove('active');

    // Se for o pop-up de Login ou Cadastro, também direciona para a tela principal
    if (popupId === 'popup-login' || popupId === 'popup-cadastro') {
      showScreen("screen-main");
    }
  }
});

// ==========================================
// 3. INICIALIZAÇÃO DE EVENTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

  // 1. Simula a tela de Loading por 2 segundos e vai para o Welcome
  setTimeout(() => {
    showScreen("screen-welcome");
  }, 2000);

  // 2. Botão "Login" da tela de Boas-vindas -> Vai para a Tela de Login
  const btnWelcomeLogin = document.querySelector("#screen-welcome .btn-app-solid");
  if (btnWelcomeLogin) {
    btnWelcomeLogin.addEventListener("click", () => {
      showScreen("screen-login");
    });
  }

  // 3. Botão "Criar nova conta" na Tela de Boas-vindas -> Vai para Cadastro
  const btnRegister = document.querySelector("#screen-welcome .btn-app-outline");
  if (btnRegister) {
    btnRegister.addEventListener("click", () => {
      showScreen("screen-register");
    });
  }

  // 4. Link "Criar conta" na Tela de Login -> Vai para Cadastro
  const btnGoToRegister = document.querySelector("#screen-login .btn-secondary-link");
  if (btnGoToRegister) {
    btnGoToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen("screen-register");
    });
  }

  // 5. Link "Já tenho uma conta" no Cadastro -> Vai para Login
  const btnGoToLogin = document.querySelector("#screen-register .link-login");
  if (btnGoToLogin) {
    btnGoToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen("screen-login");
    });
  }

  // 6. Ação do formulário/botão de Login -> Exibe o Pop-up de Login
  const formLogin = document.querySelector("#screen-login form") || document.querySelector("#screen-login .btn-app-solid");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      abrirPopup("popup-login");
    });
    // Caso seja apenas um botão sem <form>
    if (formLogin.tagName !== "FORM") {
      formLogin.addEventListener("click", (e) => {
        e.preventDefault();
        abrirPopup("popup-login");
      });
    }
  }

  // 7. Ação do formulário/botão de Cadastro -> Exibe o Pop-up de Cadastro
  const formRegister = document.querySelector("#screen-register form") || document.querySelector("#screen-register .btn-app-solid");
  if (formRegister) {
    formRegister.addEventListener("submit", (e) => {
      e.preventDefault();
      abrirPopup("popup-cadastro");
    });
    // Caso seja apenas um botão sem <form>
    if (formRegister.tagName !== "FORM") {
      formRegister.addEventListener("click", (e) => {
        e.preventDefault();
        abrirPopup("popup-cadastro");
      });
    }
  }

});