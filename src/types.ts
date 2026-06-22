/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'mcq' | 'image' | 'audio';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctIndex: number;
  mediaUrl?: string;
  points: number;
  duration: number;
  round: 1 | 2;
}

export type GameStatus = 'idle' | 'question_active' | 'showing_results' | 'round_transition' | 'game_over';

export interface GameState {
  status: GameStatus;
  currentQuestionId: string | null;
  round: 1 | 2;
  startTime: number | null; // epoch ms
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'student';
  totalScore: number;
  round2Score: number;
  teamId: string | null;
  rank?: number;
}

export interface Team {
  id: string;
  name: string;
  memberUids: string[];
  totalScore: number;
}

export interface ResponseDoc {
  userId: string;
  questionId: string;
  selectedIndex: number;
  timeTaken: number;
  pointsEarned: number;
  timestamp: string;
  isAudience: boolean;
}

export interface SimulatorContextType {
  gameState: GameState;
  questions: Question[];
  profile: UserProfile;
  teams: Team[];
  responses: ResponseDoc[];
  otherPlayers: UserProfile[];
  
  // Simulation methods
  setGameState: (state: GameState) => void;
  setProfile: (profile: UserProfile) => void;
  setTeams: (teams: Team[]) => void;
  setResponses: (responses: ResponseDoc[]) => void;
  setOtherPlayers: (players: UserProfile[]) => void;
  
  launchQuestion: (qId: string) => void;
  submitAnswer: (selectedIndex: number, timeTaken: number) => void;
  showLeaderboard: () => void;
  transitionToRound2: () => void;
  resetSimulation: () => void;
  addCustomQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
}
