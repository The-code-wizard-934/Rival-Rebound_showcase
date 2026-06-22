import { Question, UserProfile, Team } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "1",
    text: "Which of the following describes the key mechanism used in Rival Rebound to synchronize screens across all users in real-time?",
    type: "mcq",
    options: [
      "HTTP polling every 500 milliseconds",
      "WebSocket pooling with custom heartbeat packets",
      "Firestore onSnapshot listeners subscribing to game_state",
      "Manual page reloads triggered by browser push notifications"
    ],
    correctIndex: 2,
    points: 100,
    duration: 15,
    round: 1
  },
  {
    id: "2",
    text: "Identify the engineering logo associated with this cutting-edge framework shown below:",
    type: "image",
    options: [
      "React JS Framework",
      "Firestore Real-time DB",
      "Vite Bundling Tool",
      "Tailwind CSS Utility"
    ],
    correctIndex: 2,
    mediaUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&auto=format&fit=crop&q=60", // representing build systems
    points: 100,
    duration: 15,
    round: 1
  },
  {
    id: "3",
    text: "Listen closely to the frequency. In an audio-based round, what triggers the play/pause actions on the auditorium speakers?",
    type: "audio",
    options: [
      "The student presses play on their phone",
      "The administrator controls it from the Admin Console",
      "A cron server triggers it at exactly 12:00 UTC",
      "The browser guesses when the reader is finished"
    ],
    correctIndex: 1,
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    points: 100,
    duration: 20,
    round: 1
  },
  {
    id: "4",
    text: "What is the team scoring penalty in Round 2 when a team member submits an incorrect answer?",
    type: "mcq",
    options: [
      "No penalty is applied in Round 2",
      "A deduction of 10% of total team points",
      "A fraction of points (points/4) is deducted from team total",
      "The user is immediately kicked from the team"
    ],
    correctIndex: 2,
    points: 200,
    duration: 15,
    round: 2
  },
  {
    id: "5",
    text: "Who participates in the live 'Audience Poll' on the main projector display during Round 2?",
    type: "mcq",
    options: [
      "Only the 4 members of the Neon Ninjas",
      "Any registered student who didn't qualify in the top 16",
      "The event administrator and judges exclusively",
      "Only spectators who are physically outside the auditorium"
    ],
    correctIndex: 1,
    points: 150,
    duration: 15,
    round: 2
  }
];

export const MOCK_OTHER_PLAYERS: UserProfile[] = [
  { uid: "p1", displayName: "Aarav Sharma", photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 245, round2Score: 0, teamId: null },
  { uid: "p2", displayName: "Zara Patel", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 230, round2Score: 0, teamId: null },
  { uid: "p3", displayName: "Kabir Mehta", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 220, round2Score: 0, teamId: null },
  { uid: "p4", displayName: "Diya Iyer", photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 215, round2Score: 0, teamId: null },
  { uid: "p5", displayName: "Rohan Das", photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 195, round2Score: 0, teamId: null },
  { uid: "p6", displayName: "Ananya Rao", photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 180, round2Score: 0, teamId: null },
  { uid: "p7", displayName: "Arjun Nair", photoURL: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 175, round2Score: 0, teamId: null },
  { uid: "p8", displayName: "Isha Gupta", photoURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 160, round2Score: 0, teamId: null },
  { uid: "p9", displayName: "Aditya Roy", photoURL: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 155, round2Score: 0, teamId: null },
  { uid: "p10", displayName: "Meera Sen", photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 150, round2Score: 0, teamId: null },
  { uid: "p11", displayName: "Dev Joshi", photoURL: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 145, round2Score: 0, teamId: null },
  { uid: "p12", displayName: "Riya Verma", photoURL: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 140, round2Score: 0, teamId: null },
  { uid: "p13", displayName: "Vihaan Kapoor", photoURL: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 135, round2Score: 0, teamId: null },
  { uid: "p14", displayName: "Kavya Reddy", photoURL: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 130, round2Score: 0, teamId: null },
  { uid: "p15", displayName: "Siddharth Malhotra", photoURL: "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 125, round2Score: 0, teamId: null },
  { uid: "p16", displayName: "Pooja Hegde", photoURL: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face", role: "student", totalScore: 110, round2Score: 0, teamId: null }
];

export const DEFAULT_TEAMS_INFO = [
  { id: "team_1", name: "CYBER KNIGHTS", color: "from-blue-500 to-indigo-600" },
  { id: "team_2", name: "NEON NINJAS", color: "from-green-400 to-emerald-600" },
  { id: "team_3", name: "PIXEL PREDATORS", color: "from-purple-500 to-pink-600" },
  { id: "team_4", name: "CODE CRUSHERS", color: "from-orange-500 to-red-600" }
];
