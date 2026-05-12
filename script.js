(function () {
    'use strict';

    const DEFAULTS = {
        ca: 'CA will appear here once set',
        x: 'https://x.com',
        community: 'https://x.com',
        buy: 'https://pump.fun',
        tweet: 'https://x.com/boldleonidas/status/2054118787650335188'
    };

    const $ = (sel) => document.querySelector(sel);

    function truncateCA(ca) {
        if (!ca || ca.length < 12) return ca || '';
        return ca.slice(0, 4) + '…' + ca.slice(-4);
    }

    function applyConfig(cfg) {
        const c = Object.assign({}, DEFAULTS, cfg || {});

        // nav links
        const navX = $('#nav-x');
        const navCom = $('#nav-community');
        const navBuy = $('#nav-buy');
        if (navX) navX.href = c.x;
        if (navCom) navCom.href = c.community;
        if (navBuy) navBuy.href = c.buy;

        // CA values
        const pillVal = $('#ca-pill-value');
        const cabarVal = $('#cabar-value');
        if (pillVal) pillVal.textContent = truncateCA(c.ca);
        if (cabarVal) cabarVal.textContent = c.ca;

        // store ca for copy handlers
        window.__SURVIVE_CA__ = c.ca;

        // tweet embed
        mountTweet(c.tweet);
    }

    function mountTweet(tweetUrl) {
        const wrap = $('#embed-wrap');
        if (!wrap) return;
        wrap.innerHTML =
            '<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true" data-width="550" data-conversation="none" data-cards="hidden">' +
            '<a href="' + tweetUrl + '"></a>' +
            '</blockquote>';

        const tryLoad = () => {
            if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.load === 'function') {
                window.twttr.widgets.load(wrap);
                return true;
            }
            return false;
        };

        if (!tryLoad()) {
            const iv = setInterval(() => {
                if (tryLoad()) clearInterval(iv);
            }, 250);
            setTimeout(() => clearInterval(iv), 6000);
        }

        // fallback: if no iframe mounted after 4.5s, show static image
        setTimeout(() => {
            if (!wrap.querySelector('iframe')) {
                wrap.innerHTML = '<img class="tweet-fallback" src="static/tweet.png" alt="">';
            }
        }, 4500);
    }

    async function fetchConfig() {
        try {
            const r = await fetch('/api/config', { cache: 'no-store' });
            if (!r.ok) throw new Error('bad response');
            const data = await r.json();
            applyConfig(data);
        } catch {
            applyConfig({});
        }
    }

    // --- EMBERS ---
    function spawnEmbers() {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'ember-dot';
            const left = Math.random() * 100;
            const driftDur = 30 + Math.random() * 20;   // 30–50s
            const flickerDur = 2.5 + Math.random() * 1.5; // 2.5–4s
            const delay = -Math.random() * driftDur;    // negative delay = staggered
            dot.style.left = left + 'vw';
            dot.style.animationDuration = driftDur + 's, ' + flickerDur + 's';
            dot.style.animationDelay = delay + 's, ' + (-Math.random() * flickerDur) + 's';
            document.body.appendChild(dot);
        }
    }

    // --- SCROLL CA PILL ---
    function setupHeroObserver() {
        const hero = $('#hero');
        if (!hero || !('IntersectionObserver' in window)) {
            document.body.classList.add('past-hero');
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                document.body.classList.toggle('past-hero', !e.isIntersecting);
            });
        }, { threshold: 0.1 });
        io.observe(hero);
    }

    // --- ROW STAGGER ---
    function setupRowStagger() {
        const rows = document.querySelectorAll('#every-list .row');
        if (!('IntersectionObserver' in window)) {
            rows.forEach((r) => r.classList.add('in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    const idx = Array.prototype.indexOf.call(rows, e.target);
                    e.target.style.transitionDelay = (idx * 0.12) + 's';
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.2 });
        rows.forEach((r) => io.observe(r));
    }

    // --- COPY + TOAST ---
    let toastTimer = null;
    function showToast() {
        const t = $('#toast');
        if (!t) return;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
    }

    function copyCA() {
        const ca = window.__SURVIVE_CA__;
        if (!ca) return;
        const fallback = () => {
            const ta = document.createElement('textarea');
            ta.value = ca;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch {}
            document.body.removeChild(ta);
            showToast();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ca).then(showToast, fallback);
        } else {
            fallback();
        }
    }

    function setupCopy() {
        const cabar = $('#cabar');
        const pill = $('#ca-pill');
        [cabar, pill].forEach((el) => {
            if (!el) return;
            el.addEventListener('click', copyCA);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copyCA();
                }
            });
        });
    }

    // --- INIT ---
    function init() {
        spawnEmbers();
        setupHeroObserver();
        setupRowStagger();
        setupCopy();
        fetchConfig();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
