import { useState } from "react";
import { PART_TYPES, emptyProject } from "./parts";
import { Viewer } from "./Viewer";
import type { PartStatus, Project } from "./types";

const KEY = "cad2sw.project";

function load(): Project {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s) as Project;
  } catch { /* storage unavailable */ }
  return emptyProject();
}

export function App() {
  const [nav, setNav] = useState<"projects" | "templates" | "exports">("projects");
  const [proj, setProj] = useState<Project>(load);
  const [sel, setSel] = useState(0);

  const save = (p: Project) => {
    setProj(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  };
  const part = proj.parts[sel];
  const meta = PART_TYPES.find((t) => t.type === part.type) ?? PART_TYPES[0];
  const validated = proj.parts.filter((p) => p.status === "validated").length;

  const setStatus = (status: PartStatus) =>
    save({ ...proj, parts: proj.parts.map((p, i) => (i === sel ? { ...p, status } : p)) });

  const importFile = async (f: File) => {
    try { save(JSON.parse(await f.text()) as Project); setSel(0); }
    catch { alert("Not a valid project.json"); }
  };
  const exportJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(proj, null, 2)], { type: "application/json" }));
    a.download = `${proj.project_id}.project.json`;
    a.click();
  };

  return (
    <div className="app">
      <header>
        <b>CAD2SolidWorks</b>
        {(["projects", "templates", "exports"] as const).map((n) => (
          <button key={n} className={nav === n ? "on" : ""} onClick={() => setNav(n)}>{n}</button>
        ))}
      </header>

      {nav === "projects" && (
        <main className="cols">
          <aside>
            <h3>Components ({proj.parts.length})</h3>
            {proj.parts.map((p, i) => (
              <div key={p.id} className={"item" + (i === sel ? " sel" : "")} onClick={() => setSel(i)}>
                {PART_TYPES.find((t) => t.type === p.type)?.label ?? p.type}
                <small>{p.status.replace(/_/g, " ")}</small>
              </div>
            ))}
          </aside>
          <section>
            <h2>{meta.label}</h2>
            <Viewer box={meta.box} />
            <p className="note">Placeholder box preview, not SolidWorks geometry.</p>
          </section>
          <aside>
            <h3>Parameters</h3>
            {part.parameters.length === 0 ? (
              <p className="warn">Awaiting CAD extraction</p>
            ) : (
              <table><tbody>
                {part.parameters.map((pa) => (
                  <tr key={pa.name}><td>{pa.name}</td><td>{JSON.stringify(pa.value)} {pa.unit}</td><td>{pa.verification}</td></tr>
                ))}
              </tbody></table>
            )}
            <p>Template: {part.template.id} <small>({part.template.version})</small></p>
            <p className="warn">SolidWorks worker not connected</p>
            <button onClick={() => setStatus("ready_for_review")}>Mark ready for review</button>{" "}
            <button onClick={() => setStatus("validated")} title="Manual approval only">Approve manually</button>
          </aside>
        </main>
      )}

      {nav === "templates" && (
        <main className="pad">
          <h2>Part Templates</h2>
          <p>No templates registered yet. Each needs named dimensions (e.g. <code>louver_width@Sketch1</code>) made in SolidWorks.</p>
          <ul>{PART_TYPES.map((t) => <li key={t.type}>{t.label}: <i>unmade</i></li>)}</ul>
        </main>
      )}

      {nav === "exports" && (
        <main className="pad">
          <h2>Exports</h2>
          <p>This site cannot run SolidWorks. Download the project file and run it with the local Windows worker.</p>
          <button onClick={exportJson}>Download project.json</button>{" "}
          <label className="btn">Import project.json
            <input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </label>
          <p>SLDPRT / SLDASM / STEP / BOM: not generated (worker not connected).</p>
        </main>
      )}

      <footer>Parts validated: {validated} / {proj.parts.length}</footer>
    </div>
  );
}
