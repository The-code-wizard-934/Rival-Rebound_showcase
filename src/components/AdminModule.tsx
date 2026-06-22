import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertTriangle, ListPlus, Trash2, Edit2, PlayCircle, Eye, RefreshCw, Layers } from 'lucide-react';
import { Question, GameState, UserProfile, Team, ResponseDoc } from '../types';

interface AdminModuleProps {
  gameState: GameState;
  questions: Question[];
  profile: UserProfile;
  teams: Team[];
  responses: ResponseDoc[];
  otherPlayers: UserProfile[];
  
  onLaunchQuestion: (qId: string) => void;
  onShowLeaderboard: () => void;
  onTransitionToRound2: () => void;
  onAddCustomQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onResetSimulation: () => void;
  simulateOtherPlayersAnswering: () => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  gameState,
  questions,
  profile,
  teams,
  responses,
  otherPlayers,
  onLaunchQuestion,
  onShowLeaderboard,
  onTransitionToRound2,
  onAddCustomQuestion,
  onDeleteQuestion,
  onResetSimulation,
  simulateOtherPlayersAnswering,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'editor' | 'danger'>('flow');
  
  // Custom question fields
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'mcq' | 'image' | 'audio'>('mcq');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qPoints, setQPoints] = useState(100);
  const [qDuration, setQDuration] = useState(15);
  const [qRound, setQRound] = useState<1 | 2>(1);
  const [mediaUrl, setMediaUrl] = useState('');
  const [qId, setQId] = useState('');

  // Undo system variables
  const [undoActionId, setUndoActionId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Stats computation
  const totalUsersCount = otherPlayers.length + 1; // 16 mock + 1 client
  const activeStudentsCount = [profile, ...otherPlayers].filter(p => p.role === 'student' && p.totalScore > 0).length;

  // Trigger quick responses simulations
  useEffect(() => {
    if (gameState.status === 'question_active') {
      const delay = setTimeout(() => {
        simulateOtherPlayersAnswering();
      }, 1800); // simulate delay for other students answers coming in

      return () => clearTimeout(delay);
    }
  }, [gameState.status, gameState.currentQuestionId]);

  // Clean form fields
  const clearForm = () => {
    setQId('');
    setQText('');
    setQType('mcq');
    setOpts(['', '', '', '']);
    setCorrectIdx(0);
    setQPoints(100);
    setQDuration(15);
    setQRound(1);
    setMediaUrl('');
  };

  // Submit handler
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || opts.some(o => !o.trim())) {
      alert('Please complete the question text and all four options!');
      return;
    }

    const newQ: Question = {
      id: qId.trim() || String(questions.length + 1),
      text: qText.trim(),
      type: qType,
      options: opts.map(o => o.trim()),
      correctIndex: correctIdx,
      points: qPoints,
      duration: qDuration,
      round: qRound,
      mediaUrl: mediaUrl.trim() || undefined,
    };

    onAddCustomQuestion(newQ);
    clearForm();
    setActiveTab('flow');
  };

  // Click edit handler
  const handlePopulateEdit = (q: Question) => {
    setQId(q.id);
    setQText(q.text);
    setQType(q.type);
    setOpts([...q.options]);
    setCorrectIdx(q.correctIndex);
    setQPoints(q.points);
    setQDuration(q.duration);
    setQRound(q.round);
    setMediaUrl(q.mediaUrl || '');
    setActiveTab('editor');
  };

  // Action Scheduler for Destructive Resets (10-second Undo loop)
  const scheduleDestructiveAction = (actionId: string, label: string) => {
    if (undoTimer) {
      clearInterval(undoTimer);
    }

    setUndoActionId(actionId);
    setUndoCountdown(10);

    const interval = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setUndoActionId(null);
          // Perform actual action
          if (actionId === 'reset') {
            onResetSimulation();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setUndoTimer(interval);
  };

  const handleCancelUndo = () => {
    if (undoTimer) {
      clearInterval(undoTimer);
      setUndoTimer(null);
    }
    setUndoActionId(null);
    setUndoCountdown(0);
  };

  return (
    <div id="admin-module" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-sm self-start">
      
      {/* Undo Countdown Alert banner */}
      {undoActionId && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Destructive event queued: resets scores in <b>{undoCountdown}s</b></span>
          </div>
          <button 
            onClick={handleCancelUndo}
            className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-md font-bold transition font-mono uppercase text-[10px] cursor-pointer"
          >
            Cancel / Undo
          </button>
        </div>
      )}

      {/* Real-time stats board */}
      <section className="grid grid-cols-4 gap-2.5 mb-5 bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl text-center">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Total Logins</span>
          <span className="text-md font-extrabold text-white font-mono">{totalUsersCount}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Admins count</span>
          <span className="text-md font-extrabold text-white font-mono">1</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Active players</span>
          <span className="text-md font-extrabold text-indigo-400 font-mono">{activeStudentsCount}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">My responses</span>
          <span className="text-md font-extrabold text-emerald-400 font-mono">{responses.length}</span>
        </div>
      </section>

      {/* tab navigation */}
      <nav id="admin-tabs" className="flex border-b border-zinc-800/80 mb-4 text-xs gap-1">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-2 font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            activeTab === 'flow' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Quiz Flow Controls
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            activeTab === 'editor' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Question Editor
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`px-4 py-2 font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            activeTab === 'danger' ? 'border-amber-500/80 text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-400'
          }`}
        >
          ⚠️ Danger Deck
        </button>
      </nav>

      {/* Section body */}
      <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1 text-zinc-300 text-xs text-left scrollbar-thin">
        
        {/* TAB 1: QUIZ FLOW */}
        {activeTab === 'flow' && (
          <div className="space-y-4">
            
            {/* Quick system stage buttons */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2.5">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono block">STAGE BROADCAST CONTROLS</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onShowLeaderboard}
                  disabled={gameState.status === 'idle'}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <Eye className="w-3.5 h-3.5" /> Render Board results
                </button>

                <button
                  onClick={onTransitionToRound2}
                  disabled={gameState.round === 2}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <Layers className="w-3.5 h-3.5" /> Form Round 2 Teams (top 16)
                </button>
              </div>
            </div>

            {/* Questions lists grouped by Round */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
                <h4 className="font-extrabold text-white uppercase text-[11px] font-sans tracking-wide">
                  Round {gameState.round} questions catalog
                </h4>
                <span className="text-[9px] font-mono text-zinc-500">
                  Total Questions: {questions.filter(q => q.round === gameState.round).length}
                </span>
              </div>

              <div id="admin-questions-list" className="space-y-2">
                {questions
                  .filter((q) => q.round === gameState.round)
                  .map((q) => {
                    const isActive = gameState.currentQuestionId === q.id && gameState.status === 'question_active';
                    
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border transition-all flex justify-between items-start gap-4 ${
                          isActive
                            ? 'bg-indigo-500/10 border-indigo-500'
                            : 'bg-zinc-950/45 border-zinc-850 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[9px] text-zinc-400 font-bold">
                              ID: {q.id}
                            </span>
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] uppercase">
                              {q.type}
                            </span>
                            <span className="font-mono text-[9px] text-indigo-400">
                              {q.points} PTS • {q.duration}s
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-zinc-200 line-clamp-2 leading-relaxed">
                            {q.text}
                          </p>
                        </div>

                        {/* Question actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onLaunchQuestion(q.id)}
                            disabled={isActive}
                            className={`p-2 rounded-lg transition flex items-center justify-center cursor-pointer ${
                              isActive 
                                ? 'bg-indigo-500 text-white cursor-not-allowed opacity-90' 
                                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-white'
                            }`}
                            title="Launch active presentation on stage"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handlePopulateEdit(q)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                            title="Edit fields"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => onDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: EDITOR */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSaveQuestion} className="space-y-3 p-1">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-zinc-800 pb-1 mb-2">
              {qId ? `Modifying question ID ${qId}` : 'Add custom quiz item'}
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Question ID</label>
                <input
                  type="text"
                  value={qId}
                  onChange={(e) => setQId(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Quiz Round</label>
                <select
                  value={qRound}
                  onChange={(e) => setQRound(Number(e.target.value) as 1 | 2)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white"
                >
                  <option value={1}>Round 1 (Solo)</option>
                  <option value={2}>Round 2 (Team)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Asset Format</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as 'mcq' | 'image' | 'audio')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white"
                >
                  <option value="mcq">Standard MCQ</option>
                  <option value="image">Image Based</option>
                  <option value="audio">Audio Based</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Question String prompt</label>
              <textarea
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Type the question query..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white leading-normal"
              />
            </div>

            {qType !== 'mcq' && (
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Media asset URL (HTTPS)</label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={qType === 'image' ? 'https://images.unsplash.com/...' : 'https://www.soundhelix.com/...'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 block">Provide 4 answers choices</label>
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 font-mono text-[11px] text-zinc-500 font-bold">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...opts];
                      updated[i] = e.target.value;
                      setOpts(updated);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white text-[11px]"
                  />
                  <input
                    type="radio"
                    checked={correctIdx === i}
                    onChange={() => setCorrectIdx(i)}
                    className="accent-indigo-500 shrink-0 cursor-pointer"
                    title="Mark correct option"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Points Weight</label>
                <input
                  type="number"
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Duration (Seconds limit)</label>
                <input
                  type="number"
                  value={qDuration}
                  onChange={(e) => setQDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-800 justify-end">
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-semibold transition cursor-pointer"
              >
                Clear fields
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition flex items-center gap-1 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" /> Save catalog item
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: DANGER DECK */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-200">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-red-400">
                <AlertTriangle className="w-4 h-4" /> DANGER ZONE CONTROLS
              </p>
              These actions reset simulated participant statistics, custom trivia files, and game rounds immediately.
            </div>

            <div className="space-y-2">
              <h5 className="font-extrabold text-zinc-400 text-[10px] uppercase tracking-wider">HARD LOCK SYSTEM ACTIONS</h5>
              
              <button
                onClick={() => scheduleDestructiveAction('reset', 'Hard-Reset Simulator')}
                disabled={undoActionId !== null}
                className="w-full px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin duration-[4s]" /> Reset game state & player scores
              </button>
              
              <p className="text-[10px] text-zinc-500 leading-normal px-1">
                Note: Clicking the button activates a <b>10-second undo window</b> before firing. You can safely intercept and cancel if clicked on accident.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
