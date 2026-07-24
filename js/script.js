const menuBtn = document.querySelector('.menu-btn');
const overlay = document.querySelector('.menu-overlay');
const themeSwitch = document.querySelector('#theme-switch');

menuBtn.addEventListener('click', () => {

    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');

});

if(localStorage.getItem('theme') === 'dark'){

    document.body.classList.add('dark');

}

themeSwitch.addEventListener('click', () => {

    document.body.classList.toggle('dark');

    if(document.body.classList.contains('dark')){

        localStorage.setItem('theme', 'dark');

    }else{

        localStorage.setItem('theme', 'light');

    }

});