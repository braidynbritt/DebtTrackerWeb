function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');

    const isDark = body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    toggle.classList.toggle('dark', isDark);
}

document.addEventListener("DOMContentLoaded", function () {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');

    if (savedTheme === 'dark') {
        body.classList.add('dark');
        toggle?.classList.add('dark');
    }
});