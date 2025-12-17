async function loadData() {
  const teams = await fetch('data/teams.json').then(r => r.json());
  const fixtures = await fetch('data/fixtures.json').then(r => r.json());

  const select = document.getElementById('teamSelect');

  teams.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team.code;
    opt.textContent = team.name;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const team = select.value;
    const matches = fixtures.filter(
      f => f.home === team || f.away === team
    );

    document.getElementById('output').innerHTML =
      matches.map(m => `
        <p>
          ${m.home} vs ${m.away}<br>
          ${new Date(m.date).toLocaleString()}<br>
          ${m.city} – ${m.stadium}
        </p>
      `).join('');
  });
}

loadData();
