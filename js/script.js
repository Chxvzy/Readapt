const menuBtn = document.querySelector('.menu-btn');
const overlay = document.querySelector('.menu-overlay');
const themeSwitch = document.querySelector('#theme-switch');
const logo = document.querySelector('#logo-img'); 

menuBtn.addEventListener('click', () => {
    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    logo.src = 'assets/logo-readapt-white.png'; 
}

themeSwitch.addEventListener('click', () => {
    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        logo.src = 'assets/logo-readapt-white.png'; 
    } else {
        localStorage.setItem('theme', 'light');
        logo.src = 'assets/readapt-logo.png'; 
    }
});