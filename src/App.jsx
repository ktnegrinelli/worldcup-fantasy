import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

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

function parseMatchDate(g) {
  const raw = String(g.local_date ?? "").trim();
  if (!raw) return null;
  const [datePart, timePart] = raw.split(" ");
  const [month, day, year] = (datePart || "").split("/");
  if (!month || !day || !year) return null;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timePart || "00:00"}:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMatchLabel(g) {
  const d = parseMatchDate(g);
  if (!d) return String(g.local_date ?? "");
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function App() {
  const [view, setView] = useState("standings");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  async function loadTeams() {
    setLoadingTeams(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id,nation_name,fifa_code,flag_code,wins,draws,losses,goals_scored,manager")
      .order("nation_name", { ascending: true });

    if (error) {
      console.error(error);
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
      .select("id_event,event_name,event_date,event_time,home_team,away_team,status,local_date,home_team_name_en,away_team_name_en,finished")
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
    const now = new Date();

    return (matches || [])
      .filter((g) => {
        const finished = String(g.finished ?? "").toUpperCase() === "TRUE";
        if (finished) return false;
        const d = parseMatchDate(g);
        if (!d) return true;
        return d > now;
      })
      .sort((a, b) => {
        const da = parseMatchDate(a)?.getTime() ?? 0;
        const db = parseMatchDate(b)?.getTime() ?? 0;
        return da - db;
      });
  }, [matches]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="logo-circle">🏆</div>
        <div className="eyebrow">2026 FIFA WORLD CUP</div>
        <h1>WORLD CUP OF FREEDOM 2026!</h1>
        <p>12 managers · snake draft · 4 teams each</p>
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
              <div className="admin-panel">No upcoming matches found.</div>
            ) : (
              upcomingMatches.map((g) => (
                <article className="manager-card" key={g.id_event || `${g.home_team}-${g.away_team}-${g.local_date}`}>
                  <div className="manager-top">
                    <div>
                      <h2>
                        {g.home_team_name_en || g.home_team} vs {g.away_team_name_en || g.away_team}
                      </h2>
                      <p>{formatMatchLabel(g)}</p>
                    </div>
                    <div className="totals">
                      <div>
                        <strong>{g.status || "NS"}</strong>
                        <span>STATUS</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}