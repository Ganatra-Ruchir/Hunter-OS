import React from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Sparkles,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";

export default function Today({
  data,
  plannerTasks,
  syncState,
  setPage,
  open,
  toggleTask,
}) {
  const completed = data.tasks.filter((task) => task.done).length;
  const total = data.tasks.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const local = data.tasks.filter((task) => !task.done);
  const titles = new Set(local.map((task) => task.title.trim().toLowerCase()));
  const missions = [
    ...local.map((task) => ({ ...task, local: true })),
    ...plannerTasks.filter(
      (task) =>
        String(task.status).toLowerCase() !== "completed" &&
        !titles.has(task.title.trim().toLowerCase()),
    ),
  ].slice(0, 4);
  const reading = data.collections.books.filter(
    (book) => book.status === "In Progress",
  );
  return (
    <div className="today">
      <section className="arrival">
        <div>
          <span className="overline">YOUR DAILY CHAPTER</span>
          <h2>
            Small steps.
            <br />
            <em>Extraordinary you.</em>
          </h2>
          <p>
            Your world, collected in one place.
            <br />
            Choose one thing that moves you forward.
          </p>
          <button className="primary" onClick={() => setPage("tasks")}>
            Choose your next quest <ArrowRight size={18} />
          </button>
        </div>
        <div className="portal" aria-hidden="true">
          <div className="portalRing ringOne" />
          <div className="portalRing ringTwo" />
          <div className="portalRing ringThree" />
          <div className="portalStar">✦</div>
          <span className="portalLabel">THE JOURNEY IS YOURS</span>
        </div>
        <span className="chapterNumber">01 — EVOLVE</span>
      </section>
      <div className="overview">
        <div>
          <span className="metricIcon">
            <Target size={19} />
          </span>
          <div>
            <small>Quests complete</small>
            <strong>
              {completed}
              <span> / {total}</span>
            </strong>
          </div>
        </div>
        <div>
          <span className="metricIcon">
            <Zap size={19} />
          </span>
          <div>
            <small>Earned experience</small>
            <strong>
              {completed * 60}
              <span> XP</span>
            </strong>
          </div>
        </div>
        <div>
          <span className="metricIcon">
            <BookOpen size={19} />
          </span>
          <div>
            <small>In your collection</small>
            <strong>
              {Object.values(data.collections).flat().length}
              <span> titles</span>
            </strong>
          </div>
        </div>
      </div>
      <div className="dailyGrid">
        <section className="surface missionList">
          <div className="sectionHeading">
            <div>
              <span className="overline">MAKE ROOM FOR WHAT MATTERS</span>
              <h3>Your next moves</h3>
            </div>
            <button className="textButton" onClick={() => setPage("tasks")}>
              All quests <ArrowUpRight size={17} />
            </button>
          </div>
          {missions.length ? (
            missions.map((task, i) => (
              <div
                className="nextMission"
                key={`${task.local ? "local" : "planner"}-${task.id}`}
              >
                <button
                  className="missionCheck"
                  aria-label={
                    task.local
                      ? `Complete ${task.title}`
                      : `View ${task.title} in quest board`
                  }
                  onClick={() =>
                    task.local ? toggleTask(task.id) : setPage("tasks")
                  }
                >
                  {task.local ? (
                    <Check size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {task.local
                      ? "Personal quest"
                      : `${task.category || "Planner"} · ${task.priority || "Medium"} priority`}
                  </small>
                </div>
                <span className="missionIndex">0{i + 1}</span>
              </div>
            ))
          ) : (
            <div className="emptyMission">
              <Target size={32} />
              <h4>A little space for a new beginning.</h4>
              <p>Add your first quest and give today a direction.</p>
              <button className="textButton" onClick={() => setPage("tasks")}>
                Create a quest <ArrowRight size={16} />
              </button>
            </div>
          )}
          <div className="progressCaption">
            <span>Personal quest progress</span>
            <strong>{progress}%</strong>
          </div>
          <div
            className="dayProgress"
            role="progressbar"
            aria-label="Personal quest completion"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>
        <section className="reflection">
          <Sparkles size={25} />
          <span className="overline">A MOMENT FOR YOURSELF</span>
          <h3>
            Clear your mind.
            <br />
            Find your next step.
          </h3>
          <p>
            A thought, a question, a plan.
            <br />
            Give it a place to begin.
          </p>
          <button onClick={() => setPage("chat")}>
            Talk to Hunter <ArrowUpRight size={18} />
          </button>
          <button
            className="reflectionSecondary"
            onClick={() => setPage("notes")}
          >
            Or write it down <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="sectionHeading libraryHeading">
        <div>
          <span className="overline">BEYOND THE TO-DO LIST</span>
          <h3>A world worth exploring</h3>
        </div>
        <button className="textButton" onClick={() => setPage("inventory")}>
          Your collection <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="worldGrid">
        {[
          {
            id: "books",
            number: "01",
            title: "Between the pages",
            subtitle: reading.length
              ? `${reading.length} books in progress`
              : "Ideas, stories & new perspectives",
            symbol: "Aa",
            className: "paperWorld",
          },
          {
            id: "anime",
            number: "02",
            title: "Another universe",
            subtitle: "Anime, imagination & adventure",
            symbol: "✳",
            className: "animeWorld",
          },
          {
            id: "drama",
            number: "03",
            title: "One more episode",
            subtitle: "Your next favorite story",
            symbol: "▶",
            className: "screenWorld",
          },
        ].map((world) => (
          <button
            className={`worldCard ${world.className}`}
            key={world.id}
            onClick={() => open(world.id)}
          >
            <div className="worldTop">
              <span>CHAPTER {world.number}</span>
              <ArrowUpRight size={19} />
            </div>
            <div className="worldSymbol" aria-hidden="true">
              {world.symbol}
            </div>
            <h4>{world.title}</h4>
            <p>{world.subtitle}</p>
            <small>{data.collections[world.id].length} SAVED TITLES</small>
          </button>
        ))}
      </div>
      <footer className="todayFooter">
        <span>PROGRESS, AT YOUR OWN PACE.</span>
        <span>
          <i
            className={
              syncState.startsWith("Connected") ? "connectedDot" : "localDot"
            }
          />
          {syncState.startsWith("Connected")
            ? "Planner connected"
            : "Working on this device"}
        </span>
      </footer>
    </div>
  );
}
