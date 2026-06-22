import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Clock, Award, Shield, Users, Radio, CheckCircle, XCircle } from 'lucide-react';
import { Question, GameState, UserProfile, Team, ResponseDoc } from '../types';

interface StudentModuleProps {
  gameState: GameState;
  currentQuestion: Question | null;
  profile: UserProfile;
  team: Team | null;
  teams: Team[];
  responses: ResponseDoc[];
  onSubmitAnswer: (selectedIndex: number, timeTaken: number) => void;
}

export const StudentModule: React.FC<StudentModuleProps> = ({
  gameState,
  currentQuestion,
  profile,
  team,
  teams,
  responses,
  onSubmitAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  // Sync state when active question changes
  useEffect(() => {
    if (gameState.status === 'question_active' && currentQuestion) {
      setSelectedOption(null);
      setHasAnswered(false);
      
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

  // Handle option select
  const handleSelectOption = (idx: number) => {
    if (hasAnswered || timeLeft === 0 || gameState.status !== 'question_active') return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const elapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;
    onSubmitAnswer(idx, elapsed);
  };

  const getTeamNameColor = () => {
    if (!team) return 'text-zinc-400';
    if (team.name.includes('CYBER')) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (team.name.includes('NEON')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (team.name.includes('PIXEL')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  };

  return (
    <div id="student-module" className="relative w-full max-w-[340px] aspect-[9/19] rounded-[48px] border-8 border-zinc-800 bg-zinc-950 p-3 shadow-2xl overflow-hidden flex flex-col">
      {/* Speaker and Camera notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-zinc-900 rounded-full z-20 flex items-center justify-center p-1">
        <div className="w-12 h-1 bg-zinc-800 rounded-full mr-2"></div>
        <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full"></div>
      </div>

      {/* Screen container */}
      <div className="w-full h-full rounded-[40px] bg-zinc-950 text-white flex flex-col pt-6 overflow-y-auto overflow-x-hidden relative scrollbar-none">
        
        {/* Notch Padding & Navigation */}
        <header className="px-4 py-3 border-b border-zinc-900 flex justify-between items-center text-xs bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-mono text-zinc-400 tracking-wider text-[10px]">REBOUND_CLIENT</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            {profile.teamId ? (
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getTeamNameColor()}`}>
                🛡️ IN TEAM
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                📢 SPECTATOR
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Display Area */}
        <main className="flex-1 px-4 py-4 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* IDLE / WAITING STATE */}
            {gameState.status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center text-center py-8 flex-grow"
              >
                <div className="p-4 bg-zinc-900/60 rounded-full border border-zinc-800 mb-4 animate-bounce duration-1000">
                  <Smartphone className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-tight">Ready for Arena</h3>
                <p className="text-xs text-zinc-400 mt-2 px-4 leading-relaxed">
                  Welcome, <span className="text-zinc-200 font-bold">{profile.displayName}</span>! Waiting for the presenter to launch Round 1.
                </p>

                {/* Score Summary Box */}
                <div className="mt-8 w-full p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full filter blur-xl"></div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Global Score Card</span>
                  <div className="text-3xl font-bold font-sans tracking-tight text-white mt-1">
                    {profile.totalScore} <span className="text-xs text-zinc-500 font-mono">pts</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Standings appear on the auditorium layout
                  </div>
                </div>
              </motion.div>
            )}

            {/* ROUND TRANSITION / TEAM ASSIGNMENT STATE */}
            {gameState.status === 'round_transition' && (
              <motion.div
                key="round-transition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-4 flex-grow text-center"
              >
                <div className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full mb-4">
                  Round 2 Transition
                </div>
                
                {profile.teamId ? (
                  <div className="w-full">
                    <h3 className="text-lg font-extrabold tracking-tight text-white">🔥 You Made the Cut!</h3>
                    <p className="text-xs text-zinc-400 mt-1 mb-5">You are in the elite top 16 responders.</p>

                    {/* Team Reveal Card */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 text-center shadow-lg relative overflow-hidden"
                    >
                      {/* Dynamic team glowing line */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                        team?.name.includes('CYBER') ? 'from-blue-500 to-indigo-500' :
                        team?.name.includes('NEON') ? 'from-emerald-400 to-green-500' :
                        team?.name.includes('PIXEL') ? 'from-purple-500 to-pink-500' :
                        'from-amber-400 to-orange-500'
                      }`}></div>
                      
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Assigned Team</div>
                      <span className="inline-block text-xl font-black mt-2 tracking-tight text-white font-sans">
                        {team?.name || 'FORMING...'}
                      </span>
                      
                      <div className="mt-4 pt-4 border-t border-zinc-900 grid grid-cols-2 gap-3 text-left">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase">Team Pool</span>
                          <span className="text-sm font-semibold text-white">{team?.totalScore || 0} pts</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase">Members</span>
                          <span className="text-sm font-semibold text-white">4 / 4 Active</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-full mb-3">
                      <Users className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-md font-bold text-zinc-300">Audience Mode Active</h3>
                    <p className="text-xs text-zinc-400 mt-2 px-2 leading-relaxed">
                      You are positioned in the audience. You can still play along and vote on poll questions, but your aggregate score does not impact team totals.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ACTIVE QUESTION STATE */}
            {gameState.status === 'question_active' && currentQuestion && (
              <motion.div
                key="answering"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-grow justify-between h-full"
              >
                {/* Timer and Points header */}
                <div id="student-timer-header" className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className={`font-mono font-bold text-sm ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-zinc-200'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 mr-1 uppercase tracking-wider">VALUE:</span>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {currentQuestion.points}
                    </span>
                  </div>
                </div>

                {/* Media frame if any */}
                {currentQuestion.type === 'image' && currentQuestion.mediaUrl && (
                  <div id="media-frame" className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video mb-3 relative group">
                    <img src={currentQuestion.mediaUrl} alt="Question Graphic" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] text-zinc-300 uppercase tracking-widest font-mono">
                      Image Question
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'audio' && (
                  <div id="audio-frame" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 mb-3 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-zinc-300">LISTEN CAREFULLY</p>
                      <p className="text-[9px] text-zinc-500 truncate font-mono">Autoplay listening active...</p>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <h4 className="text-sm font-bold text-zinc-100 tracking-tight leading-relaxed mb-4 text-left">
                  {currentQuestion.text}
                </h4>

                {/* Options list */}
                <div id="student-options-container" className="space-y-2 flex-grow overflow-y-auto max-h-[180px] scrollbar-none pr-1">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    let optBg = "bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800";
                    let textAccent = "text-zinc-300";
                    
                    if (isSelected) {
                      optBg = "bg-indigo-600 border-indigo-400 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]";
                      textAccent = "text-white font-semibold";
                    } else if (hasAnswered) {
                      optBg = "bg-zinc-950 border-zinc-900 opacity-40 cursor-not-allowed";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={hasAnswered || timeLeft === 0}
                        id={`option-btn-${idx}`}
                        className={`w-full text-left p-3 rounded-xl border text-xs leading-normal transition-all duration-200 flex items-start gap-2.5 cursor-pointer ${optBg}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono border shrink-0 ${
                          isSelected ? 'bg-indigo-500 border-indigo-200 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={`flex-grow pr-1 break-words ${textAccent}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Submit state toast-bar */}
                <div className="mt-3 pt-3 border-t border-zinc-900 text-center">
                  {hasAnswered ? (
                    <p className="text-[10px] text-indigo-400 font-mono flex items-center justify-center gap-1.5 animate-pulse">
                      <Shield className="w-3.5 h-3.5" /> LOCKED! Waiting for screen reveal...
                    </p>
                  ) : timeLeft > 0 ? (
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Answer quickly to claim speed multiplier!
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-400 font-mono font-semibold">
                      ⌛ Time expired! No answer recorded.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* RESULTS STATE (SHOWING SCORE IMPACT) */}
            {gameState.status === 'showing_results' && currentQuestion && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col items-center justify-center text-center py-4 flex-grow"
              >
                {/* Visual feedback of correct option */}
                <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4 text-left relative overflow-hidden">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-2">Answer Reveal</div>
                  
                  {/* Visual indication if actual player was correct */}
                  {selectedOption !== null && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800/80">
                      {selectedOption === currentQuestion.correctIndex ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-400 leading-none">SPLENDID IMPACT!</p>
                            <p className="text-[10px] text-zinc-400">Correct speed multiplier applied</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-red-500 leading-none">INCORRECT</p>
                            <p className="text-[10px] text-zinc-400">
                              {gameState.round === 2 ? 'Penalty: Score deduction applied' : 'No penalty points deducted'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-400 block mb-1">Correct Answer was:</span>
                  <p className="text-xs font-bold text-emerald-400 flex items-start gap-2 leading-snug">
                    <span className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono rounded flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + currentQuestion.correctIndex)}
                    </span>
                    {currentQuestion.options[currentQuestion.correctIndex]}
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-full mb-2">
                  <Award className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wide">Take a Look display</h3>
                <p className="text-xs text-zinc-400 px-3 mt-1 leading-normal">
                  Class podium ranks and poll statistics are rendering on the auditorium stage.
                </p>

                {/* Score Summary Box */}
                <div className="mt-5 w-full p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border-r border-zinc-800 pr-2">
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Personal score</span>
                      <span className="text-lg font-black text-white">{profile.totalScore}</span>
                    </div>
                    <div>
                      {profile.teamId && team ? (
                        <>
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Team score</span>
                          <span className="text-lg font-black text-indigo-400">{team.totalScore}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Role</span>
                          <span className="text-xs font-bold text-zinc-400 mt-1 block truncate">SPECTATOR</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEFAULT GAME OVER STATE */}
            {gameState.status === 'game_over' && (
              <motion.div
                key="game_over"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-6 flex-grow"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-md font-black tracking-tight text-white uppercase">Arena Complete</h3>
                <p className="text-xs text-zinc-400 mt-1 px-4 leading-normal">
                  Rival Rebound battle has closed! Final awards are announced on the main stage.
                </p>

                <div className="mt-6 w-full p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">Your Final standing</span>
                  <div className="text-4xl font-extrabold text-white mt-2">
                    {profile.totalScore} <span className="text-xs text-zinc-500 font-mono">PTS</span>
                  </div>
                  {profile.teamId && team && (
                    <p className="text-xs text-indigo-400 font-mono font-bold mt-2">
                      🛡️ Group: {team.name}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Floating Mini Controller stats bar at phone root */}
        {gameState.status === 'question_active' && (
          <div className="bg-zinc-900 border-t border-zinc-800 py-2.5 px-4 flex justify-between items-center text-[10px] shrink-0 sticky bottom-0 z-10">
            <div>
              <span className="text-zinc-500 uppercase font-mono block leading-none">PLAYER</span>
              <span className="font-bold text-zinc-300 leading-none">{profile.displayName.split(' ')[0]}</span>
            </div>
            <div className="h-4 border-r border-zinc-800"></div>
            <div>
              <span className="text-zinc-500 uppercase font-mono block leading-none">CAREER SCORE</span>
              <span className="font-bold text-emerald-400 font-mono leading-none">{profile.totalScore} pts</span>
            </div>
          </div>
        )}

      </div>

      {/* Button Accent */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-800 rounded-full z-10"></div>
    </div>
  );
};
