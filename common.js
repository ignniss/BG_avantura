// common.js
const STORAGE_VREME_KEY = 'escape_room_vreme_pocetak';
const STORAGE_COMPLETED_KEY = 'escape_room_completed';
const STORAGE_JEZIK_KEY = 'bg_jezik';
const UKUPNO_NIVOA = 13;

let i18nData = {};
let trenutniJezik = localStorage.getItem(STORAGE_JEZIK_KEY) || 'sr';
let tajmerInterval = null;

async function ucitajJezik(jezik) {
    trenutniJezik = jezik;
    localStorage.setItem(STORAGE_JEZIK_KEY, jezik);
    try {
        const res = await fetch(`lang/${jezik}.json`);
        i18nData = await res.json();
    } catch (e) {
        console.error('Greska pri ucitavanju jezika:', e);
        i18nData = {};
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nData[key]) el.textContent = i18nData[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (i18nData[key]) el.innerHTML = i18nData[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18nData[key]) el.placeholder = i18nData[key];
    });

    if (typeof window.trenutniNivo !== 'undefined' && typeof postaviProgress === 'function') {
        postaviProgress(window.trenutniNivo);
    }
}

function t(key, vars = {}) {
    let text = i18nData[key] || key;
    Object.keys(vars).forEach(k => {
        text = text.replace(`{${k}}`, vars[k]);
    });
    return text;
}

function izaberiJezik(jezik) {
    ucitajJezik(jezik).then(() => {
        document.querySelectorAll('.lang-flag').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === jezik);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    ucitajJezik(trenutniJezik);
});

// === TIMER ===
function inicijalizujTimer(tajmerElement) {
    let pocetakVremena = localStorage.getItem(STORAGE_VREME_KEY);
    if (!pocetakVremena) {
        pocetakVremena = Date.now();
        localStorage.setItem(STORAGE_VREME_KEY, pocetakVremena);
    } else {
        pocetakVremena = parseInt(pocetakVremena);
    }

    function azurirajTajmer() {
        const protekloMs = Date.now() - pocetakVremena;
        const sekundeUkupno = Math.floor(protekloMs / 1000);
        const sati = Math.floor(sekundeUkupno / 3600);
        const minuti = Math.floor((sekundeUkupno % 3600) / 60);
        const sekunde = sekundeUkupno % 60;
        tajmerElement.textContent = `${sati}:${minuti.toString().padStart(2, '0')}:${sekunde.toString().padStart(2, '0')}`;
    }

    if (tajmerInterval) clearInterval(tajmerInterval);
    azurirajTajmer();
    tajmerInterval = setInterval(azurirajTajmer, 1000);
}

function zaustaviTimer() {
    if (tajmerInterval) {
        clearInterval(tajmerInterval);
        tajmerInterval = null;
    }
}

function restartujVreme(porukaElement) {
    if (confirm(t('timer_restart_confirm'))) {
        localStorage.removeItem(STORAGE_VREME_KEY);
        const pocetakVremena = Date.now();
        localStorage.setItem(STORAGE_VREME_KEY, pocetakVremena);

        if (porukaElement) {
            porukaElement.innerHTML = `<span style="color:#2ecc71;">${t('msg_time_restarted')}</span>`;
            porukaElement.style.display = 'block';
            setTimeout(() => { porukaElement.style.display = 'none'; }, 3000);
        }

        setTimeout(() => location.reload(), 100);
    }
}

// === PROVERA NIVOA ===
function oznaciKaoZavrseno(nivo) {
    const zavrseni = JSON.parse(localStorage.getItem(STORAGE_COMPLETED_KEY) || '[]');
    if (!zavrseni.includes(nivo)) {
        zavrseni.push(nivo);
        localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(zavrseni));
    }
}

function blokirajStranicu(trenutniNivo) {
    const zavrseni = JSON.parse(localStorage.getItem(STORAGE_COMPLETED_KEY) || '[]');

    if (trenutniNivo === 1) return false;

    const prethodni = trenutniNivo - 1;
    if (!zavrseni.includes(prethodni)) {
        setTimeout(() => {
            alert(t('block_alert', {prev: prethodni}));
            window.location.href = `${prethodni.toString().padStart(2, '0')}.html`;
        }, 100);
        return true;
    }
    return false;
}

// === POMOĆNE ===
function postaviEnterHandler(element, callback) {
    if (element) {
        element.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                callback();
            }
        });
    }
}

function prikaziPoruku(porukaElement, tekst, tip = 'info') {
    let klasa = 'poruka-boja-narandzasta';
    if (tip === 'success') klasa = 'poruka-boja-zelena';
    if (tip === 'error') klasa = 'poruka-boja-crvena';

    porukaElement.innerHTML = `<span class="${klasa}">${tekst}</span>`;
    porukaElement.style.display = 'block';
}

function onemoguciInterakciju(proveriBtn, inputPolja, hintDugmad) {
    if (proveriBtn) proveriBtn.disabled = true;

    if (inputPolja) {
        if (Array.isArray(inputPolja)) {
            inputPolja.forEach(input => input.disabled = true);
        } else {
            inputPolja.disabled = true;
        }
    }

    if (hintDugmad) {
        if (Array.isArray(hintDugmad)) {
            hintDugmad.forEach(btn => btn.disabled = true);
        } else {
            hintDugmad.disabled = true;
        }
    }
}

// === PROGRESS ===
function postaviProgress(trenutniNivo) {
    const fill = document.querySelector('.progress-fill');
    const badge = document.querySelector('.level-badge');

    const procenat = (trenutniNivo / UKUPNO_NIVOA) * 100;

    if (fill) {
        fill.style.width = procenat + '%';
    }

    if (badge) {
        badge.textContent = t('level_badge', {current: window.trenutniNivo || trenutniNivo, total: UKUPNO_NIVOA});
    }
}