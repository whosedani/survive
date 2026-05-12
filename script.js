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

    function applyConfig(cfg) {
        const c = Object.assign({}, DEFAULTS, cfg || {});

        // nav links
        const navX = $('#nav-x');
        const navCom = $('#nav-community');
        const navBuy = $('#nav-buy');
        if (navX) navX.href = c.x;
        if (navCom) navCom.href = c.community;
        if (navBuy) navBuy.href = c.buy;

        // CA — header (left) and cabar (full-width strip)
        const navCa = $('#nav-ca');
        const cabarVal = $('#cabar-value');
        const hasRealCA = c.ca && c.ca !== DEFAULTS.ca;
        if (navCa) {
            if (hasRealCA) {
                navCa.textContent = c.ca;
                navCa.hidden = false;
            } else {
                navCa.textContent = '';
                navCa.hidden = true;
            }
        }
        if (cabarVal) cabarVal.textContent = c.ca;

        // store ca for copy handlers
        window.__SURVIVE_CA__ = c.ca;

        // tweet embed
        mountTweet(c.tweet);
    }

    function extractTweetId(url) {
        const m = url && String(url).match(/status\/(\d+)/);
        return m ? m[1] : null;
    }

    function showTweetFallback(wrap, tweetUrl) {
        const safe = (tweetUrl || '#').replace(/"/g, '&quot;');
        wrap.innerHTML =
            '<a class="tweet-link-fallback" href="' + safe + '" target="_blank" rel="noopener">' +
            'view tweet on X →</a>';
    }

    function mountTweet(tweetUrl) {
        const wrap = $('#embed-wrap');
        if (!wrap) return;

        const tweetId = extractTweetId(tweetUrl);
        if (!tweetId) {
            showTweetFallback(wrap, tweetUrl);
            return;
        }

        wrap.innerHTML = '<div class="tweet-loading">loading…</div>';

        let rendered = false;
        const renderTweet = () => {
            if (rendered) return true;
            if (!window.twttr || !window.twttr.widgets || typeof window.twttr.widgets.createTweet !== 'function') {
                return false;
            }
            rendered = true;
            wrap.innerHTML = '';
            window.twttr.widgets.createTweet(tweetId, wrap, {
                theme: 'dark',
                dnt: true,
                width: 550,
                align: 'center'
            }).then(function (el) {
                if (!el) showTweetFallback(wrap, tweetUrl);
            }).catch(function () {
                showTweetFallback(wrap, tweetUrl);
            });
            return true;
        };

        if (!renderTweet()) {
            const iv = setInterval(() => {
                if (renderTweet()) clearInterval(iv);
            }, 200);
            setTimeout(() => {
                clearInterval(iv);
                if (!rendered) showTweetFallback(wrap, tweetUrl);
            }, 8000);
        }
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
        const targets = [$('#cabar'), $('#nav-ca')];
        targets.forEach((el) => {
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
