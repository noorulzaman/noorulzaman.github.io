// All site content, taken from the CV. Edit here to update the site.

export const profile = {
  name: 'Muhammad Noor Ul Zaman',
  roles: ['Data Scientist', 'Machine Learning Engineer', 'Computer Vision Engineer'],
  location: 'Nice, France',
  email: 'noorulzamantariq@gmail.com',
  phone: '+33 7 45 67 89 48',
  linkedin: 'https://www.linkedin.com/in/mnoorulzaman',
  linkedinLabel: 'linkedin.com/in/mnoorulzaman',
  cv: 'Muhammad_Noor_Ul_Zaman_CV__.pdf',
  summary:
    'Data Scientist with a Bachelor of Science (B.Sc.) in Data Science and one year of professional experience at ZeroBS (Germany, remote). Built Long Short-Term Memory (LSTM) models for time series anomaly detection and delivered a Flask admin dashboard that improved data readability by 70%. Developed VISIONARY, an end-to-end AI smart city surveillance platform that integrates multiple deep learning models (YOLO, LSTM) into one real-time pipeline with over 95% reported performance. Built Large Language Model (LLM) applications, including Retrieval-Augmented Generation (RAG) and AI agents, and real-time object detection systems. Experienced in the full machine learning lifecycle: data preprocessing, model training and tuning, backend services, and deployment as web applications.',
};

export const impact = [
  { value: 95, suffix: '%+', label: 'reported performance', context: 'VISIONARY smart city surveillance' },
  { value: 94, suffix: '%', label: 'mAP', context: 'Real-time weapon detection, YOLOv8' },
  { value: 92, suffix: '%', label: 'answer accuracy', context: 'Enterprise RAG knowledge engine' },
  { value: 88, suffix: '%', label: 'model accuracy', context: 'Airline tweet sentiment, 34% lift' },
  { value: 70, suffix: '%', label: 'less screening work', context: 'Intelligent ATS for recruiters' },
  { value: 70, suffix: '%', label: 'better data readability', context: 'Flask admin dashboard at ZeroBS' },
  { value: 60, suffix: '%', label: 'faster HR ticket resolution', context: 'StaffViz agent, 200+ employees' },
  { value: 14000, suffix: '', label: 'tweets analysed', context: 'Six major airlines' },
];

export const skillGroups = [
  { name: 'Programming Languages', short: 'Languages', color: '#38bdf8',
    items: ['Python', 'R', 'SQL', 'Java'] },
  { name: 'Machine Learning & Deep Learning', short: 'ML & DL', color: '#a78bfa',
    items: ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'LSTM', 'Time Series Analysis',
      'Time Series Anomaly Detection', 'Regression', 'Model Training', 'Model Optimisation', 'Hyperparameter Tuning'] },
  { name: 'Computer Vision', short: 'Vision', color: '#f472b6',
    items: ['Computer Vision', 'Object Detection', 'OpenCV', 'YOLO', 'YOLOv5', 'YOLOv8', 'Real-Time Video Analytics'] },
  { name: 'LLM & Generative AI', short: 'LLM & GenAI', color: '#34d399',
    items: ['Large Language Models', 'Generative AI', 'RAG', 'LangChain', 'OpenAI API', 'GPT-4o', 'FAISS', 'Pinecone',
      'ChromaDB', 'Vector Search', 'Embeddings', 'AI Agents'] },
  { name: 'Data Analysis', short: 'Analysis', color: '#fbbf24',
    items: ['Pandas', 'NumPy', 'Seaborn', 'Data Cleaning', 'Data Preprocessing', 'NLP', 'Sentiment Analysis', 'SPSS',
      'SAS', 'Excel', 'Google Analytics'] },
  { name: 'Data Visualisation', short: 'Dataviz', color: '#fb923c',
    items: ['Tableau', 'Power BI'] },
  { name: 'Backend & Deployment', short: 'Backend', color: '#f87171',
    items: ['Flask', 'FastAPI', 'Streamlit', 'Docker', 'Redis', 'REST API', 'Domain-Driven Design', 'Automation'] },
  { name: 'Tools', short: 'Tools', color: '#cbd5e1',
    items: ['Git', 'GitHub', 'Selenium', 'Version Control', 'DevOps'] },
];

export const experience = [
  {
    role: 'Data Scientist',
    company: 'ZeroBS',
    location: 'Kiel, Germany (Remote)',
    period: 'January 2025 – December 2025',
    bullets: [
      'Developed machine learning models for time series anomaly detection using LSTM, in collaboration with the client.',
      'Built and deployed an interactive Flask admin dashboard that improved data readability and understanding by 70% and streamlined system management.',
      'Applied Domain-Driven Design (DDD) architecture to improve code readability, simplify debugging, and strengthen error handling.',
      'Supported DevOps tasks, version control, and collaborative development using GitHub.',
      'Supported Python development including automation, data preprocessing, and backend services.',
      'Collaborated with cross-functional teams to deliver scalable and maintainable solutions.',
    ],
    tech: ['Python', 'LSTM', 'Flask', 'DDD', 'GitHub', 'DevOps'],
  },
];

// Project domains, used for card colours and filters.
export const lanes = [
  { id: 'ml', label: 'ML & Analytics', color: '#fbbf24' },
  { id: 'cv', label: 'Computer Vision', color: '#f472b6' },
  { id: 'llm', label: 'LLM & Agents', color: '#34d399' },
];

// start/end are 'YYYY-MM'. kind 'work' entries are not shown in the project grid.
export const projects = [
  {
    id: 'staffviz', title: 'StaffViz', subtitle: 'Autonomous HR AI Agent', lane: 'llm',
    start: '2025-09', end: '2025-12', period: 'September 2025 – December 2025',
    tech: ['OpenAI GPT-4o', 'LangChain', 'ChromaDB', 'Selenium', 'FastAPI'],
    metric: { value: 60, display: '60%', label: 'faster HR ticket resolution' },
    bullets: [
      'Built an agentic HR assistant (team project with a colleague) capable of autonomous web browsing, answering policy queries, and managing leave workflows using LangChain tool use.',
      'Reduced HR ticket resolution time by 60% at a company of 200+ employees.',
    ],
  },
  {
    id: 'ats', title: 'Intelligent ATS', subtitle: 'AI-Powered Resume Screening Engine', lane: 'llm',
    start: '2025-07', end: '2025-08', period: 'July 2025 – August 2025',
    tech: ['OpenAI', 'FAISS', 'LangChain', 'FastAPI', 'Pandas'],
    metric: { value: 70, display: '70%', label: 'less recruiter screening workload' },
    bullets: [
      'Built an enterprise applicant tracking system using OpenAI embeddings and vector search to score, rank, and explain candidate-job fit with explainable AI output.',
      'Reduced recruiter screening workload by 70% through structured ranking reports.',
    ],
  },
  {
    id: 'rag', title: 'Enterprise RAG System', subtitle: 'Multi-Source Knowledge Engine', lane: 'llm',
    start: '2025-04', end: '2025-06', period: 'April 2025 – June 2025',
    tech: ['LangChain', 'Pinecone', 'FAISS', 'OpenAI', 'FastAPI', 'Redis'],
    metric: { value: 92, display: '92%', label: 'answer accuracy' },
    bullets: [
      'Built a production RAG pipeline ingesting PDFs, databases, and APIs into a hybrid vector and keyword search system.',
      'Implemented re-ranking, query expansion, and contextual compression, achieving 92% answer accuracy.',
    ],
  },
  {
    id: 'zerobs', kind: 'work', title: 'ZeroBS', subtitle: 'Data Scientist (Remote, Germany)', lane: 'ml',
    start: '2025-01', end: '2025-12', period: 'January 2025 – December 2025',
    tech: ['Python', 'LSTM', 'Flask', 'DDD', 'GitHub'],
    metric: { value: 70, display: '70%', label: 'better data readability (Flask dashboard)' },
    bullets: [
      'LSTM models for time series anomaly detection, built with the client.',
      'Interactive Flask admin dashboard that improved data readability and understanding by 70%.',
    ],
  },
  {
    id: 'weapon', title: 'Smart Security System', subtitle: 'Real-Time Weapon Detection', lane: 'cv',
    start: '2024-12', end: '2025-01', period: 'December 2024 – January 2025',
    tech: ['YOLOv8', 'OpenCV', 'FastAPI', 'Python', 'Docker'],
    metric: { value: 94, display: '94%', label: 'mAP on a custom dataset' },
    bullets: [
      'Developed a standalone real-time AI weapon detection system using YOLOv8, deployed via FastAPI with an alert notification pipeline (derived from the weapon detection work in VISIONARY).',
      'Achieved 94% mAP on a custom dataset designed for high-risk environment deployment.',
    ],
  },
  {
    id: 'visionary', title: 'VISIONARY', subtitle: 'AI-Powered Smart City Surveillance System', lane: 'cv',
    start: '2023-09', end: '2024-08', period: 'September 2023 – August 2024',
    tech: ['YOLO', 'LSTM', 'OpenCV', 'Flask', 'Python'],
    metric: { value: 95, display: '95%+', label: 'reported performance' },
    bullets: [
      'Built an end-to-end AI surveillance platform that detects, analyses, and reports urban safety and infrastructure incidents from video footage, achieving over 95% reported performance.',
      'Developed YOLO-based detection modules for fire and smoke, potholes, wrong-way vehicles, waste, and violence, with automated security alerts.',
      'Implemented an LSTM-based temporal analysis module to detect accidents from sequential video patterns that single frames cannot reliably show.',
      'Improved individual models through dataset preparation, training, evaluation, tuning, and performance optimisation.',
      'Integrated multiple specialised models into a single real-time pipeline that processes footage, detects events, and generates alerts.',
      'Built a Flask monitoring dashboard giving a central view of AI predictions, detected incidents, and surveillance information.',
    ],
  },
  {
    id: 'agegender', title: 'Age & Gender Detection', subtitle: 'Deep Learning Web App', lane: 'cv',
    start: '2023-05', end: '2023-05', period: 'May 2023',
    tech: ['PyTorch', 'Streamlit', 'Python'],
    metric: null,
    bullets: [
      'Developed a PyTorch deep learning model for age and gender prediction from facial images, trained on a Kaggle dataset.',
      'Deployed with Streamlit as an interactive web app where users upload images and receive instant predictions.',
    ],
  },
  {
    id: 'sentiment', title: 'Sentiment Analysis on Tweets', subtitle: 'Airline Customer Feedback', lane: 'ml',
    start: '2023-02', end: '2023-02', period: 'February 2023',
    tech: ['R', 'RStudio', 'Regression', 'Machine Learning'],
    metric: { value: 88, display: '88%', label: 'accuracy, 34% lift' },
    bullets: [
      'Ran sentiment analysis on 14,000 tweets reviewing six major airlines; cleaned and analysed text data to identify the main complaints for each airline.',
      'Applied regression and machine learning to produce a final model with 88% accuracy and 34% lift.',
    ],
  },
];

export const education = {
  degree: 'Bachelor of Science (B.Sc.) in Data Science',
  school: 'GIFT University',
  location: 'Gujranwala, Pakistan',
  period: 'November 2020 – September 2024',
};

// CEFR levels mapped 1–6 (A1..C2); 7 = native.
export const languages = [
  { name: 'English', level: 'Advanced', skills: [
    { label: 'Listening', cefr: 'C1', score: 5 },
    { label: 'Reading', cefr: 'C1', score: 5 },
    { label: 'Writing', cefr: 'B2', score: 4 },
    { label: 'Speaking', cefr: 'B2', score: 4 },
  ] },
  { name: 'Urdu', level: 'Native', skills: [{ label: 'Native speaker', cefr: 'Native', score: 7 }] },
];

// Stations of the 3D journey pipeline, in order. `emblem` picks the 3D model built for that station,
// `scene` describes what the model shows, `project` links to a project card.
export const journey = [
  { date: 'Nov 2020', title: 'Started B.Sc. Data Science', sub: 'GIFT University · Gujranwala, Pakistan', emblem: 'books', color: '#22d3ee',
    text: 'Began a Bachelor of Science in Data Science, running November 2020 to September 2024.',
    scene: 'a stack of coursework orbited by sparks of curiosity' },
  { date: 'Feb 2023', title: 'Sentiment Analysis on Tweets', sub: 'R · regression · machine learning', emblem: 'sentiment', color: '#fbbf24', project: 'sentiment',
    text: '14,000 tweets about six major airlines cleaned, analysed and classified to surface each airline\'s main complaints.',
    metric: '88% accuracy · 34% lift', scene: 'a cloud of tweets sorting itself into positive, neutral and negative clusters' },
  { date: 'May 2023', title: 'Age & Gender Detection', sub: 'PyTorch · Streamlit', emblem: 'face', color: '#f472b6', project: 'agegender',
    text: 'A PyTorch model that predicts age and gender from facial images, served as a Streamlit app with instant predictions.',
    metric: 'Live interactive web app', scene: 'a face mesh being scanned, landmarks located and predictions rising' },
  { date: 'Sep 2023', title: 'VISIONARY', sub: 'AI-powered smart city surveillance', emblem: 'camera', color: '#f472b6', project: 'visionary',
    text: 'YOLO detectors for fire and smoke, potholes, wrong-way vehicles, waste and violence, plus an LSTM that spots accidents across frames, all in one real-time pipeline.',
    metric: '95%+ reported performance', scene: 'a city camera sweeping the street while detectors box each incident' },
  { date: 'Sep 2024', title: 'Graduated', sub: 'B.Sc. in Data Science · GIFT University', emblem: 'cap', color: '#22d3ee',
    text: 'Completed the Bachelor of Science in Data Science.',
    scene: 'a graduation cap in a shower of confetti' },
  { date: 'Dec 2024', title: 'Smart Security System', sub: 'Real-time weapon detection', emblem: 'radar', color: '#f472b6', project: 'weapon',
    text: 'A standalone YOLOv8 weapon detector served through FastAPI, with an alert notification pipeline.',
    metric: '94% mAP', scene: 'a scanner sweeping the scene, locking onto a threat and raising an alert' },
  { date: 'Jan 2025', title: 'Data Scientist at ZeroBS', sub: 'Kiel, Germany (remote) · Jan – Dec 2025', emblem: 'signal', color: '#a78bfa',
    text: 'LSTM models for time series anomaly detection with the client, and a Flask admin dashboard, built with Domain-Driven Design.',
    metric: '70% better data readability', scene: 'a live time series with an anomaly spike caught, above a dashboard' },
  { date: 'Apr 2025', title: 'Enterprise RAG System', sub: 'Multi-source knowledge engine', emblem: 'rag', color: '#34d399', project: 'rag',
    text: 'PDFs, databases and APIs ingested into hybrid vector and keyword search, with re-ranking, query expansion and contextual compression.',
    metric: '92% answer accuracy', scene: 'documents chunked into a vector lattice; the best matches beam into an answer' },
  { date: 'Jul 2025', title: 'Intelligent ATS', sub: 'AI-powered resume screening', emblem: 'ats', color: '#34d399', project: 'ats',
    text: 'OpenAI embeddings and vector search score, rank and explain how well each candidate fits a job.',
    metric: '70% less screening workload', scene: 'resumes re-ranking themselves against a job description' },
  { date: 'Sep 2025', title: 'StaffViz', sub: 'Autonomous HR AI agent', emblem: 'agent', color: '#34d399', project: 'staffviz',
    text: 'An agentic HR assistant (team project) that browses the web, answers policy questions and manages leave through LangChain tool use.',
    metric: '60% faster HR tickets · 200+ employees', scene: 'an agent core dispatching requests to its tools and back' },
  { date: 'Today', title: 'Based in Nice, France', sub: 'Data Scientist · ML Engineer · Computer Vision Engineer', emblem: 'beacon', color: '#22d3ee',
    text: 'The pipeline keeps running. The next station could be your team.',
    scene: 'a beacon marking where the journey is now', cta: true },
];
