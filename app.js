async function loadData() {
  const [teams, fixtures, groups] = await Promise.all([
    fetch('data/teams.json').then(r => r.json()),
    fetch('data/fixtures.json').then(r => r.json()),
    fetch('data/groups.json').then(r => r.json())
  ]);

  const select = document.getElementById('teamSelect');
  const teamInfoSection = document.getElementById('teamInfo');
  const teamDetails = document.getElementById('teamDetails');
  const fixturesSection = document.getElementById('fixtures');
  const fixturesList = document.getElementById('fixturesList');

  const teamMap = new Map(teams.map(team => [team.code, team]));
  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  sortedTeams.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team.code;
    opt.textContent = team.name;
    if (team.host) {
      opt.textContent += ' (host)';
    }
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const teamCode = select.value;
    if (!teamCode) {
      teamDetails.innerHTML = '';
      fixturesList.innerHTML = '';
      togglePlaceholder(teamInfoSection, true);
      togglePlaceholder(fixturesSection, true);
      return;
    }

    const team = teamMap.get(teamCode);
    renderTeamSnapshot(team, groups);
    renderFixtures(teamCode);
  });

  function renderTeamSnapshot(team, groupsData) {
    if (!team) {
      togglePlaceholder(teamInfoSection, true);
      teamDetails.innerHTML = '';
      return;
    }

    togglePlaceholder(teamInfoSection, false);

    const groupOpponents = groupsData[team.group]
      ?.filter(code => code !== team.code)
      .map(code => getTeamName(code))
      .join(', ');

    teamDetails.innerHTML = `
      <article class="team-card">
        <div class="team-card__header">
          <div>
            <span class="team-code">${team.code}</span>
            <h3>${team.name}</h3>
          </div>
          <span class="pill">Group ${team.group}</span>
        </div>
        <dl class="team-meta">
          <div>
            <dt>FIFA Ranking</dt>
            <dd>${team.ranking ?? '—'}</dd>
          </div>
          <div>
            <dt>Appearances</dt>
            <dd>${team.appearances ?? '—'}</dd>
          </div>
          <div>
            <dt>Host Nation</dt>
            <dd>${team.host ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
        ${groupOpponents ? `
          <p class="group-foes"><span>Group opponents:</span> ${groupOpponents}</p>
        ` : ''}
      </article>
    `;
  }

  function renderFixtures(teamCode) {
    const teamFixtures = fixtures
      .filter(f => f.home === teamCode || f.away === teamCode)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    if (!teamFixtures.length) {
      fixturesList.innerHTML = '';
      togglePlaceholder(fixturesSection, true);
      return;
    }

    togglePlaceholder(fixturesSection, false);

    fixturesList.innerHTML = teamFixtures
      .map(fixture => {
        const isHome = fixture.home === teamCode;
        const home = getParticipant(fixture, 'home');
        const away = getParticipant(fixture, 'away');
        const stageLabel = fixture.stage === 'group'
          ? `Group ${fixture.group}`
          : fixture.stage
            ? capitalize(fixture.stage)
            : 'TBD';

        return `
          <article class="fixture">
            <header>
              <span class="fixture-stage">${stageLabel}</span>
              <time datetime="${fixture.date}">
                ${formatDate(fixture.date)} · ${formatTime(fixture.date)}
              </time>
            </header>
            <div class="fixture-matchup">
              <div class="team ${isHome ? 'is-selected' : ''}">
                <span class="code">${home.code}</span>
                <span class="name">${home.label}</span>
              </div>
              <span class="versus">vs</span>
              <div class="team ${!isHome ? 'is-selected' : ''}">
                <span class="code">${away.code}</span>
                <span class="name">${away.label}</span>
              </div>
            </div>
            <p class="fixture-venue">${fixture.city} · ${fixture.stadium}</p>
          </article>
        `;
      })
      .join('');
  }

  function togglePlaceholder(section, visible) {
    const placeholder = section.querySelector('.placeholder');
    if (placeholder) {
      placeholder.classList.toggle('hidden', !visible);
    }
  }

  function getTeamName(code) {
    if (!code) {
      return 'TBD';
    }

    const team = teamMap.get(code);
    if (team) {
      return team.name;
    }

    return prettifyPlaceholder(code);
  }

  function getTeamLabel(code, pool) {
    return getTeamName(code || pool);
  }

  function getParticipant(fixture, side) {
    const primary = fixture[side];
    const playIn = fixture[`${side}_pool`];

    return {
      code: primary || playIn || 'TBD',
      label: getTeamLabel(primary, playIn)
    };
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
});

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function formatTime(value) {
  return timeFormatter.format(new Date(value));
}

function prettifyPlaceholder(code) {
  if (!code) {
    return 'TBD';
  }

  return code
    .replace(/_/g, ' ')
    .replace(/\//g, ' / ')
    .replace(/\bUEFA\b/, 'UEFA')
    .replace(/\bCONMEBOL\b/, 'CONMEBOL')
    .replace(/\bCONCACAF\b/, 'CONCACAF');
}

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

loadData();
