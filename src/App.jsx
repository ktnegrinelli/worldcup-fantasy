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
  England: "gb-eng",
};

function flagUrl(team) {
  const code = flagMap[team] || "un";
  return `https://flagcdn.com/w40/${code}.png`;
}

export default function App() {
  const [view, setView] = useState("standings");
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function loadTeams() {
    setLoadingTeams(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id,nation_name,fifa_code,flag_code,wins,draws,losses,goals_scored,manager")
      .order("nation_name", { ascending: true });

    if (error) {
      console.error(error);
      setError("Could not load teams");
      setLoadingTeams(false);
      return;
    }

    setTeams(data || []);
    setLoadingTeams(false);
  }

  async function loadMatches() {
    setLoadingMatches(true);
    const { data, error } = await supabase
      .from("matches")
      .select("id_event,event_name,event_date,event_time,home_team,away_team,status,league_id,round,group_name,home_score,away_score")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    if (error) {
      console.error(error);
      setLoadingMatches(false);
      return;
    }

    setMatches(data || []);
    setLoadingMatches(false);
  }

  useEffect(() => {
    loadTeams();
    loadMatches();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => {
        loadTeams();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        loadMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const teamsByName = useMemo(() => {
    const map = {};
    teams.forEach((team) => {
      map[team.nation_name] = team;
    });
    return map;
  }, [teams]);

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

  const upcomingMatches = useMemo(() => {
    return (matches || [])
      .filter((g) => String(g.status ?? "").toUpperCase() !== "FT")
      .sort((a, b) => {
        const ad = `${a.event_date || ""} ${a.event_time || ""}`;
        const bd = `${b.event_date || ""} ${b.event_time || ""}`;
        return ad.localeCompare(bd);
      });
  }, [matches]);

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

  const refresh = () => {
    loadTeams();
    loadMatches();
  };

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
        <h1>WORLD CUP OF FREEDOM 2026!</h1>
        <p>12 managers · snake draft · 4 teams each</p>
        <button className="refresh-btn" onClick={refresh}>
          Live Refresh
        </button>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${view === "standings" ? "active" : ""}`}
          onClick={() => setView("standings")}
        >
          Standings
        </button>
        <button
          className={`tab ${view === "schedule" ? "active" : ""}`}
          onClick={() => setView("schedule")}
        >
          Schedule
        </button>
      </nav>

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
        <button className="refresh-btn admin-btn" onClick={adminMode ? closeAdmin : openAdmin}>
          {adminMode ? "Lock Admin" : "Unlock Admin"}
        </button>
      </section>

      <main className="content">
        {view === "standings" && (
          <>
            {loadingTeams ? (
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
          </>
        )}

        {view === "schedule" && (
          <section className="leaderboard-card">
            {loadingMatches ? (
              <div className="admin-panel">Loading schedule...</div>
            ) : upcomingMatches.length === 0 ? (
              <div className="admin-panel">No Upcoming Matches</div>
            ) : (
              upcomingMatches.map((g) => {
                const home = teamsByName[g.home_team];
                const away = teamsByName[g.away_team];

                return (
                  <article
                    className="manager-card"
                    key={g.id_event || `${g.home_team}-${g.away_team}-${g.event_date}-${g.event_time}`}
                  >
                    <div className="manager-top">
                      <div className="schedule-matchblock">
                        <div className="schedule-teamline">
                          <img className="flag-img inline-flag" src={flagUrl(g.home_team)} alt={`${g.home_team} flag`} />
                          <div>
                            <div className="team-name">{g.home_team}</div>
                            <div className="team-manager">({home?.manager || "Unassigned"})</div>
                          </div>
                        </div>

                        <div className="schedule-teamline">
                          <img className="flag-img inline-flag" src={flagUrl(g.away_team)} alt={`${g.away_team} flag`} />
                          <div>
                            <div className="team-name">{g.away_team}</div>
                            <div className="team-manager">({away?.manager || "Unassigned"})</div>
                          </div>
                        </div>

                        <p>
                          {g.event_date || "Date unavailable"} {g.event_time || ""}
                        </p>
                      </div>

                      <div className="totals">
                        <div>
                          <strong>{g.status || "NS"}</strong>
                          <span>STATUS</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}