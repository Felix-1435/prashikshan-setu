import { useEffect, useState } from "react";
import { Route, Switch, Redirect, useLocation } from "wouter";
import { loadUser, type User } from "./lib/auth";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import TraineeHome from "./pages/TraineeHome";
import LearningPath from "./pages/LearningPath";
import Coach from "./pages/Coach";
import Quizzes from "./pages/Quizzes";
import TakeQuiz from "./pages/TakeQuiz";
import GenerateQuiz from "./pages/GenerateQuiz";
import AdminHome from "./pages/AdminHome";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    setUser(loadUser());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-mute">
        Loading PrashikshanSetu…
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          setLocation(u.role === "trainee" ? "/app" : u.role === "admin" ? "/admin" : "/generate");
        }}
      />
    );
  }

  return (
    <Shell
      user={user}
      onLogout={() => {
        setUser(null);
        setLocation("/");
      }}
    >
      <Switch>
        <Route path="/app" component={() => <TraineeHome user={user} />} />
        <Route path="/path" component={() => <LearningPath user={user} />} />
        <Route path="/coach" component={() => <Coach user={user} />} />
        <Route path="/quizzes" component={() => <Quizzes user={user} />} />
        <Route path="/quizzes/:id">
          {(params) => <TakeQuiz user={user} id={Number(params.id)} />}
        </Route>
        <Route path="/generate" component={() => <GenerateQuiz user={user} />} />
        <Route path="/admin" component={() => <AdminHome user={user} />} />
        <Route>
          <Redirect
            to={user.role === "trainee" ? "/app" : user.role === "admin" ? "/admin" : "/generate"}
          />
        </Route>
      </Switch>
      {/* silence unused */}
      <span className="hidden">{location}</span>
    </Shell>
  );
}
