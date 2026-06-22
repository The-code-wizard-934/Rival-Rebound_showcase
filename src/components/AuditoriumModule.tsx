import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Tv, Users, Award, Radio } from 'lucide-react';
import { Question, GameState, UserProfile, Team, ResponseDoc } from '../types';

interface AuditoriumModuleProps {
  gameState: GameState;
  currentQuestion: Question | null;
  profile: UserProfile;
  teams: Team[];
  responses: ResponseDoc[];
  otherPlayers: UserProfile[];
}

export const AuditoriumModule: React.FC<AuditoriumModuleProps> = ({
  gameState,
  currentQuestion,
  profile,
  teams,
  responses,
  otherPlayers,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync Timer
  useEffect(() => {
    if (gameState.status === 'question_active' && currentQuestion) {
      setShowExplanation(false);
      
      const timer = setInterval(() => {
        if (gameState.startTime) {
          const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
          const limit = currentQuestion.duration;
          const remaining = Math.max(0, limit - elapsed);
          setTimeLeft(remaining);
          
          if (remaining === 0) {
            clearInterval(timer);
          }
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [gameState.status, gameState.currentQuestionId, gameState.startTime, currentQuestion]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen to escape key or exit screen bounds to revert state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Compute stats helper
  const getSubmissionStats = () => {
    if (!currentQuestion) return { counts: [0, 0, 0, 0], total: 0, percentages: [0, 0, 0, 0] };
    const counts = [0, 0, 0, 0];
    let total = 0;
    responses.forEach((res) => {
      if (res.selectedIndex >= 0 && res.selectedIndex < 4) {
        counts[res.selectedIndex] += 1;
        total += 1;
      }
    });

    const percentages = counts.map((count) =>
      total > 0 ? Math.round((count / total) * 100) : 0
    );

    return { counts, total, percentages };
  };

  const { counts, total, percentages } = getSubmissionStats();

  // Combine client player + mock player pool, and sort for Round 1 leader board
  const getLeaderboardPlayers = () => {
    const all = [profile, ...otherPlayers].filter(p => p.role === 'student');
    // For sorting, totalScore descending
    return all.sort((a, b) => b.totalScore - a.totalScore).slice(0, 8);
  };

  // Get active sorted Round 2 teams
  const getSortedTeams = () => {
    return [...teams].sort((a, b) => b.totalScore - a.totalScore);
  };

  const timerPct = currentQuestion ? (timeLeft / currentQuestion.duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      id="auditorium-container" 
      className={`relative w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-5 overflow-hidden flex flex-col justify-between select-none shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'h-screen w-screen rounded-none border-0' : 'aspect-[16/9] min-h-[480px]'
      }`}
    >
      {/* Absolute floating circuit lines in background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950 -z-10"></div>
      
      {/* Top Banner Control Rail */}
      <header className="flex justify-between items-center z-10 shrink-0 border-b border-zinc-900/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Tv className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-zinc-100 font-sans uppercase">
              Rival Rebound <span className="text-zinc-500 text-xs font-medium">STAGE_PROJECTION</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wide font-mono">
              Status Flag: <span className="text-indigo-400 font-bold uppercase">{gameState.status}</span> • Round {gameState.round}
            </p>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex items-center gap-2">
          {gameState.status === 'question_active' && currentQuestion?.type === 'audio' && (
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono mr-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
                title="Play/Pause Audio"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-400 hover:text-white transition cursor-pointer ml-1"
                title="Mute Audio"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 transition flex items-center justify-center cursor-pointer"
            title="Toggle Stage Fullscreen (Fits Projector)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center p-3 relative">
        <AnimatePresence mode="wait">
          
          {/* IDLE SCREEN */}
          {gameState.status === 'idle' && (
            <motion.div
              key="stage-idle"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="text-center max-w-xl"
            >
              <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-400 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-4">
                <div className="px-6 py-4 rounded-xl bg-zinc-950 font-sans">
                  <span className="text-4xl font-black tracking-tighter text-white">RIVAL REBOUND</span>
                </div>
              </div>
              <h2 className="text-lg font-bold tracking-wider text-zinc-300 font-sans uppercase">Auditorium Sync Active</h2>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Attendees should join by signing in on their smartphone at the deployment link. The host console will launch first round questions and broadcast results here.
              </p>
              
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-[11px] font-mono">
                <div className="px-3 py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800 text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> {total + 16} Connected Clients
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 font-bold animate-pulse">
                  ● SYSTEM RUNNING SECURED
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVE QUESTION SCREEN */}
          {gameState.status === 'question_active' && currentQuestion && (
            <motion.div
              key="stage-question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col justify-between"
            >
              {/* Question text & type labels */}
              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  Question ID {currentQuestion.id} • {currentQuestion.type.toUpperCase()}
                </span>
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white font-sans mt-3 px-6 max-w-4xl mx-auto leading-normal">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Dynamic Media Center / Visualizer Row */}
              <div className="my-3 flex justify-center items-center gap-8 flex-grow">
                {currentQuestion.type === 'image' && currentQuestion.mediaUrl && (
                  <div className="max-w-[220px] aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                    <img src={currentQuestion.mediaUrl} alt="Visual Clue" className="w-full h-full object-cover" />
                  </div>
                )}

                {currentQuestion.type === 'audio' && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 relative">
                      <div className="absolute inset-0 rounded-full border border-indigo-500/50 animate-ping opacity-60"></div>
                      <Radio className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                    {isPlaying && (
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono tracking-widest animate-pulse">
                        BROADCASTING LOCAL SPEAKERS...
                      </p>
                    )}
                  </div>
                )}

                {/* Animated Dial Timer Widget */}
                <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-95">
                    <circle cx="36" cy="36" r="32" stroke="#1e1e24" strokeWidth="4" fill="transparent" />
                    <circle cx="36" cy="36" r="32" stroke={timeLeft <= 5 ? "#ef4444" : "#6366f1"} strokeWidth="4" fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 - (201 * timerPct) / 100}
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>
                  <div className={`absolute text-md font-mono font-bold leading-none ${timeLeft <= 5 ? 'text-red-400 animate-ping font-extrabold' : 'text-zinc-100'}`}>
                    {timeLeft}
                  </div>
                </div>
              </div>

              {/* Grid 2x2 Options Layer */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-4xl mx-auto pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrect = currentQuestion.correctIndex === idx;
                  let cardBg = "bg-zinc-900/70 border-zinc-850 hover:border-zinc-800";
                  let leftLetterBg = "bg-zinc-800 border-zinc-700 text-zinc-400";
                  
                  // Reveal behavior once timer hits 0
                  if (timeLeft === 0) {
                    if (isCorrect) {
                      cardBg = "bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] filter scale-[1.02]";
                      leftLetterBg = "bg-emerald-500 text-black border-transparent";
                    } else {
                      cardBg = "bg-zinc-950 border-zinc-900 opacity-40 filter blur-[0.5px]";
                      leftLetterBg = "bg-zinc-900 border-zinc-850 text-zinc-600";
                    }
                  }

                  return (
                    <motion.div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 text-sm ${cardBg}`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold border flex items-center justify-center shrink-0 ${leftLetterBg}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-zinc-200 truncate ${timeLeft === 0 && isCorrect ? 'text-emerald-400 font-extrabold' : ''}`}>{opt}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom statistics panel */}
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-4 pt-2 border-t border-zinc-900/70">
                <span>SUBMISSIONS INTAKE: <b className="text-indigo-400 font-bold">{responses.length} responses</b></span>
                {timeLeft === 0 && (
                  <span className="text-emerald-400 font-bold animate-pulse">⏰ TIME EXPIRED. OPTION REVEALED.</span>
                )}
              </div>
            </motion.div>
          )}

          {/* LEADERBOARDS & MULTI-USER RESULTS SCREEN */}
          {gameState.status === 'showing_results' && (
            <motion.div
              key="stage-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full flex flex-col justify-between"
            >
              {/* Leaderboard title based on round */}
              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-805">
                  Round Standings Revealed
                </span>
                <h2 className="text-lg font-black tracking-tight text-white font-sans mt-2">
                  {gameState.round === 1 ? 'Individual Competitor Rankings' : 'Rival Teams Standings & Audience Poll'}
                </h2>
              </div>

              {/* Grid or splits container */}
              <div className="flex-grow flex items-center gap-6 my-4 leading-normal overflow-hidden h-full max-h-[280px]">
                
                {/* CASE: ROUND 1 INDIV LEADERBOARD */}
                {gameState.round === 1 ? (
                  <div className="w-full max-w-4xl mx-auto space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="grid grid-cols-2 gap-4">
                      {getLeaderboardPlayers().map((player, idx) => (
                        <motion.div
                          key={player.uid}
                          initial={{ opacity: 0, x: idx % 2 === 0 ? -15 : 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-md bg-zinc-850 hover:bg-indigo-600 text-[10px] text-zinc-400 font-mono flex items-center justify-center font-bold">
                              #{idx + 1}
                            </span>
                            <img src={player.photoURL} alt={player.displayName} className="w-8 h-8 rounded-full border border-zinc-800" />
                            <span className="text-xs font-semibold text-zinc-200 leading-normal truncate max-w-[120px]">
                              {player.displayName}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {player.totalScore} pts
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* CASE: ROUND 2 TEAM SCORES + AUDIENCE POLL */
                  <div className="w-full grid grid-cols-5 gap-4">
                    
                    {/* Left 3 cols: Team Scores */}
                    <div className="col-span-3 space-y-2">
                      <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-start">
                        <Users className="w-3.5 h-3.5 text-indigo-400" /> Team Standings
                      </h4>
                      {getSortedTeams().map((team, idx) => {
                        let barColor = "bg-blue-500";
                        if (team.name.includes("NEON")) barColor = "bg-emerald-500";
                        if (team.name.includes("PIXEL")) barColor = "bg-purple-500";
                        if (team.name.includes("CODE")) barColor = "bg-red-500";

                        return (
                          <div key={team.id} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850 relative overflow-hidden">
                            <div className="flex justify-between items-center text-xs pb-1">
                              <span className="font-extrabold text-white text-[11px] tracking-wide">{team.name}</span>
                              <span className="font-mono font-black text-indigo-400">{team.totalScore} pts</span>
                            </div>
                            {/* Score progress slider bar */}
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (team.totalScore / 600) * 100)}%` }}
                                className={`h-full ${barColor}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right 2 cols: Audience Poll percentages */}
                    <div className="col-span-2 space-y-2 border-l border-zinc-900 pl-4">
                      <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" /> Audience Poll
                      </h4>
                      
                      <div className="space-y-2">
                        {currentQuestion.options.map((opt, idx) => {
                          const isCorrect = currentQuestion.correctIndex === idx;
                          const pct = percentages[idx];
                          
                          return (
                            <div key={idx} className="relative p-1 bg-zinc-900/40 rounded-lg border border-zinc-850 flex items-center justify-between text-[11px] overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-zinc-900/80 -z-10" style={{ width: `${pct}%` }}></div>
                              
                              <div className="flex items-center gap-2 z-10 truncate pr-1">
                                <span className={`w-4s h-4 px-1 rounded text-[9px] font-mono font-bold shrink-0 ${
                                  isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-zinc-300 truncate">{opt}</span>
                              </div>
                              <span className={`font-mono text-[10px] z-10 shrink-0 select-none px-1 font-bold ${
                                isCorrect ? 'text-emerald-400' : 'text-zinc-400'
                              }`}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Footer control guide */}
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-900/70 pt-2 flex justify-between items-center mt-2">
                <span>Ranks computed live from Firestore users collection • Total active: {getLeaderboardPlayers().length + 12}</span>
                <span className="text-indigo-400 font-bold">PROJECTION NOMINAL</span>
              </div>
            </motion.div>
          )}

          {/* TEAM MEMBERS POP REVEAL TRANSITION SCREEN */}
          {gameState.status === 'round_transition' && (
            <motion.div
              key="stage-transition"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col justify-between"
            >
              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/20">
                  SHUFFLING AND FORMING TEAMS
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-white font-sans mt-2">
                  Top 16 Qualifiers drafted into Teams!
                </h2>
              </div>

              {/* Shuffler grid representation */}
              <div className="grid grid-cols-4 gap-3 w-full my-4 flex-grow items-center">
                {teams.map((team, tIdx) => {
                  let borders = "border-blue-500/20 hover:border-blue-500/40";
                  if (team.name.includes("NEON")) borders = "border-emerald-500/20 hover:border-emerald-500/40";
                  if (team.name.includes("PIXEL")) borders = "border-purple-500/20 hover:border-purple-500/40";
                  if (team.name.includes("CODE")) borders = "border-red-500/20 hover:border-red-500/40";

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: tIdx * 0.1 }}
                      className={`p-3 h-full rounded-2xl bg-zinc-900/40 border flex flex-col justify-between shadow-md ${borders}`}
                    >
                      <div>
                        {/* Header styled with dynamic team brand name */}
                        <div className="text-left">
                          <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Assigned Deck</span>
                          <h4 className="text-[11px] font-black text-white font-sans leading-tight mt-0.5">{team.name}</h4>
                        </div>

                        {/* Gather active users names into team pool */}
                        <div className="mt-3 space-y-1.5 text-left">
                          {team.memberUids.map((uid, mIdx) => {
                            // Find matching student name from user pool
                            const user = [profile, ...otherPlayers].find((p) => p.uid === uid);
                            const name = user ? user.displayName.split(' ')[0] : 'Qualifying...';
                            const pfp = user ? user.photoURL : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop";
                            
                            return (
                              <motion.div 
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: tIdx * 0.1 + mIdx * 0.05 }}
                                key={mIdx} 
                                className="flex items-center gap-2"
                              >
                                <img src={pfp} className="w-5 h-5 rounded-full border border-zinc-800" alt="pfp" />
                                <span className="text-[10px] text-zinc-300 font-medium truncate">{name}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-900/60 text-left">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 block font-mono">Draft status</span>
                        <span className="text-[9px] font-bold text-indigo-400 font-mono">ACTIVE SEEDS LOCK</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-900/70 pt-2 text-center">
                Please wait for the Event Administrator to launch Round {gameState.round} Active Teams Questions.
              </div>
            </motion.div>
          )}

          {/* FINISHED GAME STATE */}
          {gameState.status === 'game_over' && (
            <motion.div
              key="stage-gameover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-lg"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white font-sans uppercase">Auditorium Battle Complete</h2>
              <p className="text-xs text-zinc-400 mt-2 px-2 leading-relaxed">
                Thank you for playing Rival Rebound! The qualifiers gathered points and collaborated brilliantly in the arena. Check final leaderboards above.
              </p>
              
              {/* Highlight winner team */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 inline-flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Champion Team:</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  {getSortedTeams()[0]?.name || 'COMPUTING...'}
                </span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
