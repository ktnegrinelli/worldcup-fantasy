import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ADMIN_PASSWORD = "FIFAwc2026";

const flagMap = {
  Spain: "es",
  "South Korea": "kr",
  Canada: "ca",
  Haiti: "ht",
  France: "fr",
  Sweden: "se",
  Scotland: "gb-sct",
  Iraq: "iq",
  Argentina: "ar",
  Turkey: "tr",
  Australia: "au",
  Curacao: "cw",
  Portugal: "pt",
  Ecuador: "ec",
  Paraguay: "py",
  Qatar: "qa",
  Austria: "at",
  Algeria: "dz",
  Uzbekistan: "uz",
  Brazil: "br",
  Japan: "jp",
  "Ivory Coast": "ci",
  Jordan: "jo",
  Netherlands: "nl",
  Switzerland: "ch",
  "Czech Republic": "cz",
  "Cape Verde": "cv",
  Germany: "de",
  Morocco: "ma",
  Egypt: "eg",
  "New Zealand": "nz",
  Croatia: "hr",
  Senegal: "sn",
  Ghana: "gh",
  Panama: "pa",
  Colombia: "co",
  Uruguay: "uy",
  Iran: "ir",
  "Saudi Arabia": "sa",
  Belgium: "be",
  USA: "us",
  "Bosnia and Herzegovina": "ba",
  Tunisia: "tn",
  Norway: "no",
  Mexico: "mx",
  Congo: "cg",
  "South Africa": "za",
  England: "gb-eng"
};

function flagUrl(team) {
  const code = flagMap[team] || "un";
  return `https://flagcdn.com/w40/${code}.png`;
}

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function loadTeams() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("teams")
      .select("id,nation_name,fifa_code,flag_code,wins,draws,losses,goals_scored,manager")
      .order("nation_name", { ascending: true });

    if (error) {
      console.error(error);
      setError("Could not load teams");
      setLoading(false);
      return;
    }

    setTeams(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const managers = useMemo(() => {
    const grouped = {};

    teams.forEach((team) => {
      const manager = team.manager || "Unassigned";
      if (!grouped[manager]) grouped[manager] = [];
      grouped[manager].push(team);
    });

    return Object.entries(grouped)
      .map(([manager, managerTeams]) => {
        const points = managerTeams.reduce(
          (sum, team) => sum + (team.wins || 0) * 3 + (team.draws || 0),
          0
        );
        const goals = managerTeams.reduce((sum, team) => sum + (team.goals_scored || 0), 0);
        const wins = managerTeams.reduce((sum, team) => sum + (team.wins || 0), 0);
        const draws = managerTeams.reduce((sum, team) => sum + (team.draws || 0), 0);
        const losses = managerTeams.reduce((sum, team) => sum + (team.losses || 0), 0);

        return { manager, managerTeams, points, goals, wins, draws, losses };
      })
      .sort((a, b) => b.points - a.points || b.goals - a.goals || b.wins - a.wins);
  }, [teams]);

  const openAdmin = () => {
    if (password === ADMIN_PASSWORD) {
      setAdminMode(true);
      setError("");
      return;
    }
    setError("Wrong password");
  };

  const closeAdmin = () => {
    setAdminMode(false);
    setPassword("");
    setError("");
  };

  const refresh = () => loadTeams();

  const updateTeam = async (teamId, field, delta) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const nextValue = Math.max(0, (team[field] || 0) + delta);

    setSavingId(teamId);
    const { error } = await supabase
      .from("teams")
      .update({ [field]: nextValue })
      .eq("id", teamId);

    setSavingId(null);

    if (error) {
      console.error(error);
      setError("Could not save update");
      return;
    }

    await loadTeams();
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="logo-circle">🏆</div>
        <div className="eyebrow">2026 FIFA WORLD CUP</div>
        <h1>WORLD CUP OF FREEDOM</h1>
        <p>12 managers · snake draft · 4 teams each</p>
        <button className="refresh-btn" onClick={refresh}>
          Live Refresh
        </button>
      </header>

      <nav className="tabs">
        <button className="tab active">Standings</button>
        <button className="tab" onClick={adminMode ? closeAdmin : openAdmin}>
          Admin
        </button>
      </nav>

      {!adminMode && (
        <section className="admin-panel">
          <h3>Admin Access</h3>
          <input
            className="admin-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="admin-error">{error}</p>}
          <button className="refresh-btn admin-btn" onClick={openAdmin}>
            Unlock Admin
          </button>
        </section>
      )}

      <main className="content">
        {loading ? (
          <div className="admin-panel">Loading teams...</div>
        ) : (
          <section className="leaderboard-card">
            {managers.map((manager) => (
              <article className="manager-card" key={manager.manager}>
                <div className="manager-top">
                  <div>
                    <h2>{manager.manager}</h2>
                    <p>
                      {manager.wins}W - {manager.draws}D - {manager.losses}L
                    </p>
                  </div>
                  <div className="totals">
                    <div>
                      <strong>{manager.points}</strong>
                      <span>POINTS</span>
                    </div>
                    <div>
                      <strong>{manager.goals}</strong>
                      <span>GOALS</span>
                    </div>
                  </div>
                </div>

                <div className="team-grid">
                  {manager.managerTeams.map((team) => {
                    const w = team.wins || 0;
                    const d = team.draws || 0;
                    const l = team.losses || 0;
                    const g = team.goals_scored || 0;

                    return (
                      <div className="team-row" key={team.id}>
                        <img
                          className="flag-img"
                          src={flagUrl(team.nation_name)}
                          alt={`${team.nation_name} flag`}
                        />
                        <div className="team-details">
                          <div className="team-name">{team.nation_name}</div>
                          <div className="team-sub">
                            {w}W-{d}D-{l}L · {w * 3 + d} pts · {g} goals
                          </div>
                        </div>

                        {adminMode && (
                          <div className="admin-controls">
                            <div className="control-group">
                              <span>W</span>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "wins", -1)}>-</button>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "wins", 1)}>+</button>
                            </div>
                            <div className="control-group">
                              <span>D</span>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "draws", -1)}>-</button>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "draws", 1)}>+</button>
                            </div>
                            <div className="control-group">
                              <span>G</span>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "goals_scored", -1)}>-</button>
                              <button disabled={savingId === team.id} onClick={() => updateTeam(team.id, "goals_scored", 1)}>+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}