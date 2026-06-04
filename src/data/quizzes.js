// Seed quiz questions used by the Quiz System (REQ-12 to REQ-15).
export const QUIZZES = [
  {
    id: 'q-web',
    title: 'Web Fundamentals',
    questions: [
      {
        id: 1,
        text: 'Which protocol does the Smart Study Planner use for communication?',
        options: ['FTP', 'HTTP/HTTPS', 'SMTP', 'SSH'],
        answerIndex: 1,
      },
      {
        id: 2,
        text: 'What does UI stand for?',
        options: ['User Internet', 'Unified Input', 'User Interface', 'Universal Index'],
        answerIndex: 2,
      },
      {
        id: 3,
        text: 'Which is a valid web browser mentioned in the SRS?',
        options: ['Photoshop', 'Chrome', 'Excel', 'Slack'],
        answerIndex: 1,
      },
    ],
  },
  {
    id: 'q-cloud',
    title: 'Cloud & Databases',
    questions: [
      {
        id: 1,
        text: 'A database is primarily a system for...',
        options: ['Rendering images', 'Storing data', 'Sending email', 'Compiling code'],
        answerIndex: 1,
      },
      {
        id: 2,
        text: 'Which storage model scales without managing servers?',
        options: ['Bare metal', 'Serverless', 'On-premise rack', 'Floppy disk'],
        answerIndex: 1,
      },
      {
        id: 3,
        text: 'Responsive design means the app works on...',
        options: ['Only desktops', 'Only phones', 'Multiple device sizes', 'Only tablets'],
        answerIndex: 2,
      },
    ],
  },
]
