(function () {
    const cardsContainer = document.getElementById('dayCardsContainer');
    const kpiYield = document.getElementById('kpiYield');
    const kpiHitRate = document.getElementById('kpiHitRate');
    const kpiAvgOdds = document.getElementById('kpiAvgOdds');
    const kpiTotalPicks = document.getElementById('kpiTotalPicks');

    if (!cardsContainer || typeof historialApuestas === 'undefined') {
        return;
    }

    const dayMap = {
        '12/03': '12-3.html',
        '13/03': '13-3.html',
        '14/03': '14-3.html',
        '15/03': '15-3.html',
        '16/03': '16-3.html',
        '17/03': '17-3.html',
        '18/03': '18-3.html',
        '19/03': '19-3.html',
        '20/03': '20-3.html',
        '21/03': '21-3.html',
        '22/03': '22-3.html',
        '23/03': '23-3.html',
        '25/03': '25-3.html',
        '26/03': '26-3.html',
    };

    const dateOrder = Object.keys(dayMap);

    function parseOdds(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function getBetPnL(bet) {
        const stake = Number(bet.inversion);
        const odd = parseOdds(bet.cuota);
        if (!Number.isFinite(stake) || !Number.isFinite(odd) || odd <= 0) {
            return 0;
        }
        if (bet.estado === 'ganada') {
            return (stake * odd) - stake;
        }
        if (bet.estado === 'perdida') {
            return -stake;
        }
        return 0;
    }

    function pct(value) {
        return `${(value * 100).toFixed(1)}%`;
    }

    function getDayStatus(dayBets) {
        const pending = dayBets.filter((b) => b.estado === 'pendiente').length;
        if (pending > 0) {
            return { label: 'Pendiente', className: 'day-pending' };
        }

        const net = dayBets.reduce((acc, b) => acc + getBetPnL(b), 0);
        if (net >= 0) {
            return { label: 'Ganado', className: 'day-win' };
        }

        return { label: 'Perdido', className: 'day-loss' };
    }

    function computeStakeUnits(statusLabel, avgOdds) {
        if (statusLabel === 'Pendiente' && avgOdds >= 2.2) {
            return '2u';
        }
        if (statusLabel === 'Ganado') {
            return '1.5u';
        }
        if (statusLabel === 'Pendiente') {
            return '1u';
        }
        return '0.5u';
    }

    function buildDayMetrics(day, dayBets) {
        const resolved = dayBets.filter((b) => b.estado === 'ganada' || b.estado === 'perdida');
        const status = getDayStatus(dayBets);
        const won = dayBets.filter((b) => b.estado === 'ganada').length;
        const lost = dayBets.filter((b) => b.estado === 'perdida').length;
        const pending = dayBets.filter((b) => b.estado === 'pendiente').length;

        const avgOddsSource = dayBets
            .map((b) => parseOdds(b.cuota))
            .filter((v) => Number.isFinite(v) && v > 1);

        const avgOdds = avgOddsSource.length
            ? avgOddsSource.reduce((acc, value) => acc + value, 0) / avgOddsSource.length
            : 2;

        return {
            day,
            status,
            avgOdds,
            won,
            lost,
            pending,
            totalBets: dayBets.length,
            stake: computeStakeUnits(status.label, avgOdds),
            resolvedCount: resolved.length
        };
    }

    function renderCard(dayMetrics) {
        const {
            day,
            status,
            avgOdds,
            won,
            lost,
            pending,
            totalBets,
            stake
        } = dayMetrics;

        const href = dayMap[day];

        const card = document.createElement('a');
        card.className = `day-card ${status.className}`;
        card.href = href;
        card.innerHTML = `
            <div class="day-card-head">
                <span class="day-date">${day}</span>
                <span class="day-status">${status.label}</span>
            </div>
            <div class="day-card-main">
                <div class="day-card-market">Scouting de valor diario</div>
                <div class="day-card-odds">Cuota media ${avgOdds.toFixed(2)}</div>
            </div>
            <div class="day-card-metrics">
                <span>Ganadas: <strong>${won}</strong></span>
                <span>Perdidas: <strong>${lost}</strong></span>
                <span>Pendientes: <strong>${pending}</strong></span>
                <span>Total: <strong>${totalBets}</strong></span>
            </div>
            <div class="day-card-foot">
                <span>${totalBets} picks</span>
                <span class="day-stake">Stake ${stake}</span>
            </div>
        `;

        return card;
    }

    function updateKpis(allBets) {
        const resolved = allBets.filter((b) => b.estado === 'ganada' || b.estado === 'perdida');
        const won = resolved.filter((b) => b.estado === 'ganada');

        const totalStaked = resolved.reduce((acc, b) => acc + Number(b.inversion || 0), 0);
        const net = resolved.reduce((acc, b) => acc + getBetPnL(b), 0);
        const yieldValue = totalStaked > 0 ? (net / totalStaked) : 0;
        const hitRate = resolved.length > 0 ? (won.length / resolved.length) : 0;

        const oddsValues = resolved
            .map((b) => parseOdds(b.cuota))
            .filter((v) => Number.isFinite(v) && v > 1);
        const avgOdds = oddsValues.length
            ? oddsValues.reduce((acc, val) => acc + val, 0) / oddsValues.length
            : 0;

        kpiYield.textContent = pct(yieldValue);
        kpiYield.classList.toggle('metric-up', yieldValue >= 0);
        kpiYield.classList.toggle('metric-down', yieldValue < 0);

        kpiHitRate.textContent = pct(hitRate);
        kpiAvgOdds.textContent = avgOdds > 0 ? avgOdds.toFixed(2) : '--';
        kpiTotalPicks.textContent = String(allBets.length);
    }

    updateKpis(historialApuestas);

    dateOrder.forEach((day) => {
        const dayBets = historialApuestas.filter((b) => b.fecha === day);
        if (!dayBets.length) {
            return;
        }
        const metrics = buildDayMetrics(day, dayBets);
        cardsContainer.appendChild(renderCard(metrics));
    });
})();
