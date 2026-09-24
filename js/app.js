// Função para alternar entre os ecrãs do aplicativo
function mudarTela(idDaNovaTela) {
  // Esconde todos os ecrãs removendo a classe 'active'
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Mostra apenas o ecrã pretendido adicionando 'active'
  const telaAlvo = document.getElementById(idDaNovaTela);
  if (telaAlvo) {
    telaAlvo.classList.add('active');
  }
}

// Aguarda o carregamento inicial do DOM e altera para o ecrã de boas-vindas após 3 segundos
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    mudarTela('screen-welcome');
  }, 2000);
});