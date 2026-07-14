const menuBtn = document.querySelector('.menu-btn');
const overlay = document.querySelector('.menu-overlay');

menuBtn.addEventListener('click', () => {
    overlay.classList.toggle('active');
});