document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o EmailJS com a nova Public Key
  emailjs.init("jPiYBKKSgBtv67EVZ");

  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const btnOriginalHTML = submitBtn.innerHTML;

      // Feedback visual durante o envio
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      emailjs.sendForm('service_w3ete3x', 'template_in9nx1n', this)
        .then(() => {
          alert('Mensagem enviada com sucesso!');
          contactForm.reset();
        })
        .catch((error) => {
          alert('Erro ao enviar mensagem: ' + JSON.stringify(error));
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = btnOriginalHTML;
        });
    });
  }
});