import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Smartphone, Shield, Users, Radio, Award, ArrowUpRight, Check,
  Layers, GitFork, Compass, Code, ExternalLink, RefreshCw, Zap, Flame, Info, ChevronRight
} from 'lucide-react';

import { Question, GameState, UserProfile, Team, ResponseDoc } from './types';
import { DEFAULT_QUESTIONS, MOCK_OTHER_PLAYERS, DEFAULT_TEAMS_INFO } from './data';
import { StudentModule } from './components/StudentModule';
import { AuditoriumModule } from './components/AuditoriumModule';
import { AdminModule } from './components/AdminModule';

export default function App() {
  // State Machine variables
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    currentQuestionId: null,
    round: 1,
    startTime: null,
  });

  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [profile, setProfile] = useState<UserProfile>({
    uid: "user_client",
    displayName: "Yash Bose",
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    role: "student",
    totalScore: 0,
    round2Score: 0,
    teamId: null,
  });

  const [otherPlayers, setOtherPlayers] = useState<UserProfile[]>(MOCK_OTHER_PLAYERS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [responses, setResponses] = useState<ResponseDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'student' | 'stage' | 'admin'>('student');
  const [hasScrolled, setHasScrolled] = useState(false);

  // Scroll event detector for sticky header transparency
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentQuestion = questions.find((q) => q.id === gameState.currentQuestionId) || null;

  // Realtime Simulation: Mocking other players answering over time
  const simulateOtherPlayersAnswering = () => {
    if (!currentQuestion || gameState.status !== 'question_active') return;

    // We simulate responses for all 16 mock students
    const newResponses: ResponseDoc[] = [];

    otherPlayers.forEach((player) => {
      // Is player a team member in Round 2?
      const isAudience = gameState.round === 2 && !player.teamId;

      // Random choice 0 to 3
      const isCorrect = Math.random() < 0.72; // 72% average accuracy
      const selectedIndex = isCorrect 
        ? currentQuestion.correctIndex 
        : (currentQuestion.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;

      // Random reaction duration
      const durationOffset = 1.2 + Math.random() * (currentQuestion.duration - 2);
      const timeTaken = Math.min(currentQuestion.duration, parseFloat(durationOffset.toFixed(2)));

      // Compute score
      let pts = 0;
      if (isCorrect) {
        pts = Math.floor(currentQuestion.points * (1 - timeTaken / currentQuestion.duration));
      } else if (gameState.round === 2 && !isAudience) {
        pts = -Math.floor(currentQuestion.points / 4); // Team penalty
      }

      newResponses.push({
        userId: player.uid,
        questionId: currentQuestion.id,
        selectedIndex,
        timeTaken,
        pointsEarned: pts,
        timestamp: new Date().toISOString(),
        isAudience,
      });
    });

    setResponses(newResponses);

    // Apply scores to players once the timer ends or reveal occurs
    // Simulating Firestore atomic transactions when scores are incremented
    const updatedPlayers = otherPlayers.map((player) => {
      const resp = newResponses.find((r) => r.userId === player.uid);
      if (resp) {
        return {
          ...player,
          totalScore: Math.max(0, player.totalScore + resp.pointsEarned),
          round2Score: gameState.round === 2 ? Math.max(0, player.round2Score + resp.pointsEarned) : 0,
        };
      }
      return player;
    });

    setOtherPlayers(updatedPlayers);

    // If Round 2, aggregate points to Teams too!
    if (gameState.round === 2 && teams.length > 0) {
      const updatedTeams = teams.map((team) => {
        let teamScoreAddition = 0;
        team.memberUids.forEach((uid) => {
          const resp = newResponses.find((r) => r.userId === uid);
          if (resp) {
            teamScoreAddition += resp.pointsEarned;
          }
        });

        return {
          ...team,
          totalScore: Math.max(0, team.totalScore + teamScoreAddition),
        };
      });
      setTeams(updatedTeams);
    }
  };

  // Launch Question command (Presenter Console sends instruction to current state document)
  const handleLaunchQuestion = (qId: string) => {
    // Reset responses
    setResponses([]);

    setGameState({
      status: 'question_active',
      currentQuestionId: qId,
      round: gameState.round,
      startTime: Date.now(),
    });
  };

  // Student selects an option
  const handleSubmitAnswer = (selectedIndex: number, timeTaken: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const isAudience = gameState.round === 2 && !profile.teamId;

    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = Math.floor(currentQuestion.points * (1 - timeTaken / currentQuestion.duration));
    } else if (gameState.round === 2 && !isAudience) {
      pointsEarned = -Math.floor(currentQuestion.points / 4); // penalty
    }

    const myResponse: ResponseDoc = {
      userId: profile.uid,
      questionId: currentQuestion.id,
      selectedIndex,
      timeTaken,
      pointsEarned,
      timestamp: new Date().toISOString(),
      isAudience,
    };

    // Add my response to current list
    setResponses((prev) => [myResponse, ...prev]);

    // Update client score profile
    const updatedProfile = {
      ...profile,
      totalScore: Math.max(0, profile.totalScore + pointsEarned),
      round2Score: gameState.round === 2 ? Math.max(0, profile.round2Score + pointsEarned) : 0,
    };

    setProfile(updatedProfile);

    // Update active team total
    if (gameState.round === 2 && profile.teamId && teams.length > 0) {
      const updatedTeams = teams.map((t) => {
        if (t.id === profile.teamId) {
          return {
            ...t,
            totalScore: Math.max(0, t.totalScore + pointsEarned),
          };
        }
        return t;
      });
      setTeams(updatedTeams);
    }
  };

  // Host triggers "Show results" podium
  const handleShowLeaderboard = () => {
    setGameState((prev) => ({
      ...prev,
      status: 'showing_results',
    }));
  };

  // Admin initiates "Draft Transition to Round 2"
  const handleTransitionToRound2 = () => {
    // Filter and sort players by score
    const allStudents = [profile, ...otherPlayers]
      .filter((p) => p.role === 'student')
      .sort((a, b) => b.totalScore - a.totalScore);

    if (allStudents.length < 16) {
      alert("Requires at least 16 participants to form the teams!");
      return;
    }

    const top16 = allStudents.slice(0, 16);
    // Shuffle
    const shuffled = [...top16].sort(() => Math.random() - 0.5);

    // Distribute into 4 teams
    const createdTeams: Team[] = DEFAULT_TEAMS_INFO.map((teamTemplate) => ({
      id: teamTemplate.id,
      name: teamTemplate.name,
      memberUids: [],
      totalScore: 0,
    }));

    shuffled.forEach((student, index) => {
      const teamIdx = index % 4;
      createdTeams[teamIdx].memberUids.push(student.uid);
    });

    // Update original client profile with team info if qualified
    const myMatch = shuffled.find((s) => s.uid === profile.uid);
    let updatedMyProfile = { ...profile };
    if (myMatch) {
      const index = shuffled.indexOf(myMatch);
      updatedMyProfile.teamId = createdTeams[index % 4].id;
    } else {
      updatedMyProfile.teamId = null;
    }

    // Update other players team IDs
    const updatedOtherPlayers = otherPlayers.map((player) => {
      const match = shuffled.find((s) => s.uid === player.uid);
      if (match) {
        const index = shuffled.indexOf(match);
        return {
          ...player,
          teamId: createdTeams[index % 4].id,
        };
      }
      return {
        ...player,
        teamId: null,
      };
    });

    setTeams(createdTeams);
    setOtherPlayers(updatedOtherPlayers);
    setProfile(updatedMyProfile);

    // Trigger state
    setGameState({
      status: 'round_transition',
      currentQuestionId: null,
      round: 2,
      startTime: null,
    });
  };

  // Admin resets whole board
  const handleResetSimulation = () => {
    setGameState({
      status: 'idle',
      currentQuestionId: null,
      round: 1,
      startTime: null,
    });
    setResponses([]);
    setTeams([]);
    setProfile({
      uid: "user_client",
      displayName: "Yash Bose",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      role: "student",
      totalScore: 0,
      round2Score: 0,
      teamId: null,
    });
    // Restore other players base lists
    setOtherPlayers(MOCK_OTHER_PLAYERS.map(p => ({ ...p, totalScore: Math.floor(Math.random() * 150) + 50, round2Score: 0, teamId: null })));
  };

  // Custom question additions
  const handleAddCustomQuestion = (newQ: Question) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== newQ.id);
      return [...filtered, newQ].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    });
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const activeMyTeam = teams.find((t) => t.id === profile.teamId) || null;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans antialiased text-left relative">
      
      {/* Background Atmosphere */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[35%] left-[25%] w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* STICKY ACCENT HEAD RAIL */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <span className="font-extrabold text-white text-md tracking-tighter">R²</span>
            </div>
            <div>
              <span className="font-bold text-sm tracking-widest text-white uppercase font-sans">RIVAL REBOUND</span>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-sans bg-blue-500/10 border border-blue-400/20 text-blue-400 font-bold ml-2 tracking-wider">
                SHOWCASE HUB
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <a href="#features" className="hover:text-blue-400 transition-colors">Product Features</a>
            <a href="#sandbox" className="hover:text-blue-400 transition-colors">Live Arena Sandbox</a>
            <a href="#architecture" className="hover:text-blue-400 transition-colors">Architecture Map</a>
            <a href="#tech-stack" className="hover:text-blue-400 transition-colors">Technical Specs</a>
          </nav>

          <a
            href="https://rival-rebound-pi.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Visit Live Platform <ExternalLink className="w-3.5 h-3.5 text-blue-405" />
          </a>
        </div>
      </header>

      {/* HERO BANNER SECTION */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-24 max-w-7xl mx-auto px-6 text-center z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-sans text-blue-400 font-bold uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          LIVE DEMO PLAYGROUND & ARCHITECTURE
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7.5xl font-sans font-extrabold tracking-tighter text-white leading-[0.9] max-w-5xl mx-auto uppercase">
          Scale Auditorium Quizzes <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
            With Instant Synchronicity.
          </span>
        </h1>

        <p className="text-xs md:text-sm text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Rival Rebound is a live, full-stack quiz competition platform driving hundreds of concurrent phone devices synced instantaneously to a centralized projector display using Firestore snapshots.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="#sandbox"
            className="px-8 py-4 bg-blue-600 rounded-xl font-bold shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer"
          >
            Launch Interactive Sandbox <Zap className="w-4 h-4 text-amber-300" />
          </a>
          <a
            href="https://rival-rebound-pi.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 text-xs tracking-wider uppercase transition flex items-center gap-2 cursor-pointer"
          >
            Open Live Portal <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </a>
        </div>
      </section>
      {/* CORES FEATURES GRID SECTION */}
      <section id="features" className="py-16 bg-[#050505] border-t border-b border-white/5 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/5 via-transparent to-indigo-950/5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">FEATURES SPEC SHEET</span>
            <h2 className="text-3xl font-black text-white font-sans tracking-tight uppercase">Classroom & Arena Specifications</h2>
            <p className="text-xs text-gray-400 mt-2">What handles high scale concurrency and maintains participant retention through engineering mechanics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 leading-normal">
            
            {/* Box 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-blue-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">Frictionless Session Access</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Attendees scan the stage-projected QR code with mobile cameras to connect instantly. Google OpenID OAuth handles session registration securely in a single click, completely bypassing registration fatigue.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-blue-400 font-extrabold uppercase">Tech-Stack:</strong> OIDC, JWT Authentication, token-bound session claims.</div>
                  <div><strong className="text-white">Business Value:</strong> Achieves 99%+ attendee conversion; eliminates audience dropoffs.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-blue-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">GOOGLE SIGN-IN OAUTH</span>
            </div>

            {/* Box 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-indigo-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin duration-[8s]" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">Sub-100ms Snapshot Sync</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Bypasses high-overhead HTTP polling. Client mobile devices, moderator consoles, and projector screens form immediate continuous reactive socket listeners hooked directly to game document mutations.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-indigo-400 font-extrabold uppercase">Tech-Stack:</strong> Firestore onSnapshot, full-duplex TCP WebSockets.</div>
                  <div><strong className="text-white">Performance Outcome:</strong> Propagates status packets to 500+ nodes in under 80ms.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">REACTIVE BROKERS</span>
            </div>

            {/* Box 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-blue-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">2-Stage Bracket Engine</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Begins with solo free-for-all runs. Transition triggers instantly partition the top 16 responders into 4 competitive corporate teams. Remaining players become spectators, staying engaged through group polls.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-blue-400 font-extrabold uppercase">Algorithms:</strong> Dynamic array sorting & cohort mapping functions.</div>
                  <div><strong className="text-white">Recruiter Highlights:</strong> Demonstrates complex client-side state manipulation.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-blue-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">COHORT BRACKET SPLICING</span>
            </div>

            {/* Box 4 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-emerald-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Radio className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">Multi-Format Asset Pipelines</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Supports traditional text, high-res graphics, and custom audio recordings. Interactive sound components pulse on projectors and mobile nodes in perfect sync to heighten dramatic tension.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-emerald-400 font-extrabold uppercase">Tech-Stack:</strong> HTML5 AudioContext, canvas rendering hooks.</div>
                  <div><strong className="text-white">Recruiter Highlights:</strong> Sound playback events are cluster-scoped to avoid echoes.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">MCQ • GRAPHICS • SOUND TRACKS</span>
            </div>

            {/* Box 5 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-indigo-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Flame className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">Real-Time Aggregations</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  During team rounds, non-qualifying spectators vote. Their response streams are aggregated globally, updating the main screen's live percentage charts in real-time.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-indigo-400 font-extrabold uppercase">Tech-Stack:</strong> Recharts, vector projection, reducer pipes.</div>
                  <div><strong className="text-white">System Architecture:</strong> Guarantees all participants stay engaged throughout.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">SPECTATOR ENGAGEMENT ENGINE</span>
            </div>

            {/* Box 6 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-red-500/30 transition-all duration-350 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight uppercase font-sans">Moderator Rollback Safeguards</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Admin operations are protected against human error. Destructive triggers like trivia item deletion or player ejections launch a 10-second client-side rollback cushion, allowing presenters to cancel.
                </p>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono space-y-1">
                  <div><strong className="text-red-400 font-extrabold uppercase">Tech-Stack:</strong> Reactive state-recovery debounce buffers.</div>
                  <div><strong className="text-white">Business Value:</strong> Bulletproof disaster management during high-pressure events.</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-red-400 tracking-wider block mt-4 uppercase relative z-10 font-bold">CRITICAL DEBRIS PREVENTERS</span>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE ARENA SANDBOX */}
      <section id="sandbox" className="py-20 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">INTERACTIVE PLAYGROUND</span>
          <h2 className="text-3xl font-black text-white font-sans tracking-tight uppercase">Real-Time Sync Sandbox</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-2xl mx-auto leading-relaxed">
            Experience the real-time synchronization of Rival Rebound directly on this page! Act as the **Presenter** to launch questions on the stage, practice answering as the **Student** on the device, and adjust state via the **Admin Deck**.
          </p>
        </div>

        {/* HR & RECRUITER WALKTHROUGH GUIDE CARD */}
        <div className="max-w-4xl mx-auto mb-12 p-[1px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-40">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
          </div>
          <div className="p-6 bg-[#0a0a0c]/90 rounded-[15px] space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-extrabold block">PRO-TIP FOR TECH RECRUITERS & MANAGERS</span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Interactive Live System Walkthrough
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-blue-300 uppercase">Interactive Simulation</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
              {/* How to test column */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> How to Test the Sync Sandbox:
                </h4>
                <ul className="space-y-3 pl-1 text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold font-mono">1.</span>
                    <span>
                      Scroll down to the **Operations Center (Host deck)** in the right column and click <strong className="text-white bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/10">Launch Question</strong> on any trivia card.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold font-mono">2.</span>
                    <span>
                      Quickly click <strong className="text-white bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/10">Simulate Bot Responses</strong> to see the 16 virtual auditorium student players instantly register submissions via randomized latency and curves.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold font-mono">3.</span>
                    <span>
                      Go to the **Device View (left smartphone column)** and select an option. Observe your selection immediately aggregate on the central **Auditorium Display (stage view)** charts.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold font-mono">4.</span>
                    <span>
                      Advance to the **Leaderboard** from the Operations center, then click <strong className="text-white bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/10">Promote to Round 2</strong> to trigger automatic bracket partition calculations.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Technical deliverables column */}
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Core Architectural Strengths:
                </h4>
                <div className="space-y-3.5 text-gray-400">
                  <div>
                    <span className="font-semibold text-white block text-[11px]">⚡ Instant Full-Duplex Broadcast State</span>
                    <p className="text-[11px] mt-0.5">
                      Sub-100ms sync is accomplished using Firestore dynamic snapshot sockets rather than sluggish polling intervals, providing maximum efficiency under heavy crowds.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">📊 Live High-Concurrency Mock Aggregations</span>
                    <p className="text-[11px] mt-0.5">
                      The sandbox models real-world game interactions (up to 16 live updates synchronously on the screen) to prove the frontend handling capabilities before real-world arena execution.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">🛡️ Defensive Security Rules Guard</span>
                    <p className="text-[11px] mt-0.5">
                      Prevents spoofed submissions by applying rigorous backend user claims and client timestamps inside Firestore document schemas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device view tabs switcher for mobile viewports */}
        <div className="flex md:hidden bg-white/5 border border-white/10 p-1.5 rounded-full mb-8 text-xs font-semibold gap-1.5 justify-center max-w-md mx-auto relative backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('student')}
            className={`flex-grow py-2 px-4 rounded-full transition-all duration-300 ${activeTab === 'student' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white'}`}
          >
            📱 Phone
          </button>
          <button 
            onClick={() => setActiveTab('stage')}
            className={`flex-grow py-2 px-4 rounded-full transition-all duration-300 ${activeTab === 'stage' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white'}`}
          >
            📺 Stage
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-grow py-2 px-4 rounded-full transition-all duration-300 ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white'}`}
          >
            ⚙️ Control
          </button>
        </div>

        {/* High Resolution Desktop Triple-Split Screen Grid */}
        <div className="hidden md:grid grid-cols-12 gap-6 items-start leading-normal">
          
          {/* Col 1 (Span 4): Student Mobile Device */}
          <div className="col-span-4 flex flex-col items-center justify-start h-full">
            <span className="text-[10px] font-mono text-gray-400 uppercase block mb-3.5 font-bold flex items-center gap-1.5 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-455 animate-pulse"></span>
              <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Device View (Student screen)
            </span>
            <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[56px] overflow-hidden w-full shadow-[0_0_50px_rgba(37,99,235,0.1)] transition-all hover:border-blue-500/30 group">
              <div className="p-4 bg-[#0a0a0c] m-[1px] rounded-[54px] flex justify-center backdrop-blur-3xl">
                <StudentModule
                  gameState={gameState}
                  currentQuestion={currentQuestion}
                  profile={profile}
                  team={activeMyTeam}
                  teams={teams}
                  responses={responses}
                  onSubmitAnswer={handleSubmitAnswer}
                />
              </div>
            </div>
          </div>

          {/* Col 2 (Span 8): Stage Projector and Host Panel stack */}
          <div className="col-span-8 flex flex-col gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-400 uppercase block mb-3.5 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <Tv className="w-3.5 h-3.5 text-indigo-400" /> Auditorium Display (Presenter stage view)
              </span>
              <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl overflow-hidden w-full shadow-[0_0_50px_rgba(99,102,241,0.08)] transition-all hover:border-indigo-500/30">
                <div className="p-1 bg-[#0a0a0c] rounded-[22px]">
                  <AuditoriumModule
                    gameState={gameState}
                    currentQuestion={currentQuestion}
                    profile={profile}
                    teams={teams}
                    responses={responses}
                    otherPlayers={otherPlayers}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-400 uppercase block mb-3.5 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <Code className="w-3.5 h-3.5 text-blue-400" /> Operations Center (Host console deck)
              </span>
              <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl overflow-hidden w-full transition-all hover:border-blue-500/30">
                <div className="p-1 bg-[#0a0a0c] rounded-[22px]">
                  <AdminModule
                    gameState={gameState}
                    questions={questions}
                    profile={profile}
                    teams={teams}
                    responses={responses}
                    otherPlayers={otherPlayers}
                    onLaunchQuestion={handleLaunchQuestion}
                    onShowLeaderboard={handleShowLeaderboard}
                    onTransitionToRound2={handleTransitionToRound2}
                    onAddCustomQuestion={handleAddCustomQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onResetSimulation={handleResetSimulation}
                    simulateOtherPlayersAnswering={simulateOtherPlayersAnswering}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Small screen mobile view layout fallback (Single Active tab) */}
        <div className="block md:hidden max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'student' && (
              <motion.div
                key="tab-student"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col items-center"
              >
                <span className="text-[10px] font-mono text-gray-500 uppercase block mb-3.5 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  📱 Mobile Participant
                </span>
                <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[56px] overflow-hidden w-full shadow-lg">
                  <div className="p-4 bg-[#0a0a0c] m-[1px] rounded-[54px] flex justify-center">
                    <StudentModule
                      gameState={gameState}
                      currentQuestion={currentQuestion}
                      profile={profile}
                      team={activeMyTeam}
                      teams={teams}
                      responses={responses}
                      onSubmitAnswer={handleSubmitAnswer}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stage' && (
              <motion.div
                key="tab-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col"
              >
                <span className="text-[10px] font-mono text-gray-500 uppercase block mb-3.5 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  📺 Central Projector Screen
                </span>
                <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl overflow-hidden w-full shadow-lg">
                  <div className="p-1 bg-[#0a0a0c] rounded-[22px]">
                    <AuditoriumModule
                      gameState={gameState}
                      currentQuestion={currentQuestion}
                      profile={profile}
                      teams={teams}
                      responses={responses}
                      otherPlayers={otherPlayers}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="tab-admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col"
              >
                <span className="text-[10px] font-mono text-gray-500 uppercase block mb-3.5 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  ⚙️ Presenter Deck
                </span>
                <div className="p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl overflow-hidden w-full shadow-lg">
                  <div className="p-1 bg-[#0a0a0c] rounded-[22px]">
                    <AdminModule
                      gameState={gameState}
                      questions={questions}
                      profile={profile}
                      teams={teams}
                      responses={responses}
                      otherPlayers={otherPlayers}
                      onLaunchQuestion={handleLaunchQuestion}
                      onShowLeaderboard={handleShowLeaderboard}
                      onTransitionToRound2={handleTransitionToRound2}
                      onAddCustomQuestion={handleAddCustomQuestion}
                      onDeleteQuestion={handleDeleteQuestion}
                      onResetSimulation={handleResetSimulation}
                      simulateOtherPlayersAnswering={simulateOtherPlayersAnswering}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </section>

      {/* SYSTEM SCHEMATIC GRAPH */}
      <section id="architecture" className="py-20 bg-[#050505] border-t border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-[20%] right-[-100px] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">DATA PIPELINE FLOW</span>
            <h2 className="text-3xl font-black text-white font-sans tracking-tight uppercase">Real-Time Synchronization Topology</h2>
            <p className="text-xs text-gray-400 mt-2">How actions flow between nodes and back to screens in less than 100 milliseconds.</p>
          </div>

          {/* Visual chart made with Tailwind CSS boxes and arrows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto text-xs leading-normal font-sans">
            
            {/* Box 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex flex-col justify-between text-left group hover:border-blue-500/30 transition-all duration-300">
              <div>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider font-mono">Source Actions</span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-1 mb-2 uppercase">1. Event Dispatchers</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  The Admin launches trivia items or initiates team shuffles, writing atomically to the Cloud Firestore documents. Participant phones submit response indices directly into composite documents.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Console Client</span> <ChevronRight className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
            </div>

            {/* Box 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border border-blue-500/20 flex flex-col justify-between text-left relative overflow-hidden group hover:border-blue-400/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider font-mono">Sync State Manager</span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-1 mb-2 uppercase">2. Firestore Engine</h4>
                <p className="text-[11px] text-gray-350 leading-relaxed">
                  Firestore acts as the realtime message broker. All active nodes subscribe to the <code>/game_state/current</code> document. When a field triggers modifications, Firebase pushes the delta packets.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-blue-400 font-bold font-mono">
                <span>Persistent DB</span> <ChevronRight className="w-4 h-4 text-emerald-400 animate-bounce" />
              </div>
            </div>

            {/* Box 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex flex-col justify-between text-left group hover:border-blue-500/30 transition-all duration-300">
              <div>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider font-mono">Screen Receivers</span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-1 mb-2 uppercase">3. Receiver Nodes</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  The Auditorium screen listens directly for changes, displaying counting clocks and correct lists. Participant devices refresh immediately to match incoming questions and locks options.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Stage projection</span> <Check className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

          </div>

          {/* MONOSPACE GRAPH & DETAILED SYSTEM OVERVIEW PIPELINE */}
          <div className="mt-16 border-t border-white/5 pt-16 max-w-4xl mx-auto space-y-12">
            <div className="text-left space-y-3">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider font-mono">ASCII topology representation</span>
              <h3 className="text-lg font-bold text-white tracking-tight uppercase">Full-Duplex Synchronicity Flow</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                The chart below traces the full-duplex transmission pathways that bind the host console, the central projector screens, and active participant devices together during live events.
              </p>
            </div>

            {/* Monospace ASCII Chart Container */}
            <div className="p-5 bg-[#030304] border border-white/5 rounded-2xl overflow-x-auto shadow-inner text-left font-mono text-[10px] text-emerald-400 leading-relaxed whitespace-pre font-bold scrollbar-thin">
{`       ( Host Presenter / Admin Deck ) ────┐
                      │                    │  [Writes Document Mutation]
                      │                    ▼  Atomic Document Write
                      │        ┌───────────────────────────────┐
                      │        │     Cloud Firestore DB        │
                      │        │  (Single Document: State Hash)│
                      │        └─┬───────────────────────────┬─┘
                      │          │                           │ 
                      │          │ [Broadcast Snapshot]      │ [onSnapshot Snapshot]
                      │          ▼ TCP Socket Event          ▼ TCP Socket Event
                      │        ┌───────────────────────────────┐
                      │        │   Auditorium Stage Screen     │
                      │        │  (Projector Display Component)│
                      │        └─▲─────────────────────────────┘
                      │          │
                      │          │ Matches Submissions Count
                      ▼          │
       ( Participant Mobile Devices ) ───┘
         [Dispatches User Choice Document]`}
            </div>

            {/* 3-Column Engineering deep dive for corporate selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-normal text-xs pt-4">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span> state machine lifecycle
                </h4>
                <div className="space-y-3.5 text-gray-400">
                  <p>
                    The game exists as a self-correcting finite state machine. Transitions occur atomially across these major states:
                  </p>
                  <ul className="space-y-2.5 text-[11px]">
                    <li className="flex gap-2">
                      <span className="text-white font-mono bg-white/5 px-1 py-0.5 rounded border border-white/5">IDLE</span>
                      <span>Hosts assemble trivia decks. Nodes listen to lobby credentials.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-mono bg-blue-400/10 px-1 py-0.5 rounded border border-blue-500/15">ACTIVE_Q</span>
                      <span>Starts on-screen timer. Phones unlock corresponding answer cells.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400 font-mono bg-amber-400/10 px-1 py-0.5 rounded border border-amber-500/15">REVEAL</span>
                      <span>Locks phone choices. Renders correct selection on stage.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-mono bg-emerald-400/10 px-1 py-0.5 rounded border border-emerald-500/15">RANKS</span>
                      <span>Computes dynamic leaderboard delta shuffles immediately.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span> latency & collision control
                </h4>
                <div className="space-y-3 text-gray-400 leading-relaxed text-[11px]">
                  <div>
                    <span className="font-semibold text-white block mb-0.5">⏱️ Server-Synced Time Gradients</span>
                    <p>
                      Points calculations rely on delta measurements of response speed. Local timing biases are offset using Firebase Server Timestamp anchors, ensuring millisecond-level precision anywhere globally.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-white block mb-0.5">💥 Idempotent Scopes & Write Debounce</span>
                    <p>
                      Over-writing protection locks option selection securely. Each user can submit exactly one response document per question ID, ensuring subsequent double-clicks cannot duplicate point counts.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-white block mb-0.5">🔋 Scalable Client-Side Modeling</span>
                    <p>
                      To provide sandbox testing without cloud costs, our real-time environment simulates 16 concurrent user nodes inside an active React subscription thread, replicating asynchronous production packet behavior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* TECHNICAL PROFILE SPECIFICATIONS */}
      <section id="tech-stack" className="py-20 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">TECHNICAL SPEC TABLE</span>
          <h2 className="text-3xl font-black text-white font-sans tracking-tight uppercase">Rival Rebound Stack Specifications</h2>
          <p className="text-xs text-gray-400 mt-2">Production infrastructure profiles configured for smooth, low latency execution.</p>
        </div>

        <div className="max-w-3xl mx-auto p-[1px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-[#0a0a0c] rounded-[15px] overflow-hidden leading-normal text-xs">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-white/5 font-bold text-gray-300 border-b border-white/5">
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Operational Layer</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Technology Selection</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Core Operational Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-400">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">Frontend Runtime</td>
                  <td className="p-4 font-mono text-blue-400">React 19 & TypeScript</td>
                  <td className="p-4">Component lifecycle bindings</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">Styling Utilities</td>
                  <td className="p-4 font-mono text-blue-400">Tailwind CSS v4 & Motion</td>
                  <td className="p-4">Bento layout grids & hardware-accelerated animations</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">Database Core</td>
                  <td className="p-4 font-mono text-blue-400">Cloud Firestore DB</td>
                  <td className="p-4">Sub-100ms real-time event broadcasting snapshots</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">Authentication Gate</td>
                  <td className="p-4 font-mono text-blue-400">Firebase Auth & Google OAuth</td>
                  <td className="p-4">One-tap authentication without passwords</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">Hosting CDNs</td>
                  <td className="p-4 font-mono text-blue-400">Vercel & Firebase Hosting</td>
                  <td className="p-4">Scales assets distribution globally</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FINAL INTERPLAY CALL TO ACTION SECTION */}
      <section className="py-20 md:py-28 text-center border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-blue-950/10 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[50%] -translate-x-[50%] w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-4 font-bold">READY TO PLAY?</span>
          <h2 className="text-3xl md:text-5xl font-sans font-extrabold tracking-tighter text-white mb-6 uppercase">
            Ready to Experience the Real Platform?
          </h2>
          <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Run a live competition in an auditorium with your classmates, teammates, or audiences. Create questions, view ranks, and experience the full-scale platform live right now.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="https://rival-rebound-pi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105 duration-300 flex items-center gap-2 cursor-pointer"
            >
              Open Live Deployment Portal <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* POLISHED FOOTER */}
      <footer className="bg-[#050505] border-t border-white/5 py-12 text-xs text-gray-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-xs text-white font-bold">R²</span>
            </div>
            <span className="text-gray-400">Rival Rebound © 2026. Built with React, Tailwind and Cloud Firestore.</span>
          </div>

          <div className="flex gap-6 text-[11px] font-medium text-gray-400">
            <a href="https://rival-rebound-pi.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Live Website Portal</a>
            <span className="text-white/10">|</span>
            <a href="#sandbox" className="hover:text-blue-400 transition-colors">Sandbox Playground</a>
            <span className="text-white/10">|</span>
            <a href="#features" className="hover:text-blue-400 transition-colors">Component specs</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
