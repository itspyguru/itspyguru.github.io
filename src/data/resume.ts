// Single source of truth for all portfolio content.
// TODO(prajjwal): replace the 3 flagged links with real URLs.
export const LINKS = {
  github: 'https://github.com/itspyguru',
  linkedin: 'https://www.linkedin.com/in/itspyguru/',
  youtube: 'https://www.youtube.com/@itspyguru',
  telegram: 'https://t.me/itspyguru',
  instagram: 'https://www.instagram.com/itspyguru/',
  pinterest: 'https://www.pinterest.ca/itspyguru',
  cybiqon: 'https://cybiqon.in',
  email: 'mailto:prajjwalpathak35@gmail.com',
  udemy: 'https://www.udemy.com/user/itspyguru/', // TODO: real Udemy course URL
  pypi: 'https://pypi.org/project/decrypto/',     // TODO: confirm Decrypto PyPI slug
  tgbot: 'https://t.me/itspyguru',                // TODO: real tg-api bot link
} as const

export interface Experience { role: string; org: string; period: string; bullets: string[] }
export interface Project { id: string; slug: string; type: string; tone: string; ref: string; title: string; desc: string; tech: string[]; link: string }
export interface Stat { label: string; value: number; suffix: string }
export interface Education { degree: string; school: string; period: string }
export interface Cert { title: string; body: string }

export const RESUME = {
  name: 'Prajjwal Pathak',
  alias: 'pyGuru',
  title: 'Software Engineer (SDE-2) · Backend & AI',
  location: 'Varanasi, India',
  email: 'prajjwalpathak35@gmail.com',
  objective: 'Results-driven Software Engineer with 1+ year of specialized experience in backend development and automation. Expertise in Python, FastAPI and API design, with a track record of streamlining operations — 90% reduction in manual workloads and 30% gains in system performance. Builds scalable, reliable solutions that optimize workflows and improve data accuracy.',
  bioShort: 'Prajjwal Pathak (pyGuru) — SDE-2 @ Leadzen.ai. Backend, automation & AI agents. Python instructor with 20k+ on YouTube. Building cybiqon.in.',
  bioLong: "Student, developer & Python instructor. I build AI agents, backend systems and security tooling. I like cryptography, design and photography, self-study theoretical physics, and I'm an Otaku, a melomaniac and a Ruskin Bond fan.",
  stats: [
    { label: 'WORKLOAD_AUTOMATED', value: 90, suffix: '%' },
    { label: 'FASTER_REPORTS', value: 50, suffix: '%' },
    { label: 'YT_SUBSCRIBERS', value: 20, suffix: 'K+' },
    { label: 'UDEMY_ENROLLS', value: 4.5, suffix: 'K+' },
    { label: 'DATA_PTS/DAY', value: 10, suffix: 'K+' },
  ] as Stat[],
  experience: [
    { role: 'Software Development Engineer (SDE-2)', org: 'Leadzen.ai', period: 'Oct 2024 — Present', bullets: [
      'Built an automated system generating dynamic financial documents using AI agents (CrewAI) + generative-AI tooling (LangChain, Hugging Face).',
      'Designed end-to-end backend for Indian public-listed companies: scraping, cleaning, storage, analysis, realtime updates & caching for the company web app.',
      'Ran a full security audit & penetration test of the company website — identified vulnerabilities and helped implement fixes.' ] },
    { role: 'Software Development Engineer (SDE-1)', org: 'Leadzen.ai', period: 'Sep 2023 — Sep 2024', bullets: [
      'Spearheaded a Python + FastAPI financial reporting system — cut report-generation time 50%, improved accuracy 20%.',
      'Automated financial modeling for Indian public companies — reduced manual effort 35% at 95%+ accuracy.',
      'Built document processors, stock-market analyzers & reporting tools — +40% processing efficiency, -25% retrieval time.',
      'Optimized backend, shipped generative-AI solutions & automation scripts — +15% revenue, automated 100% of client requests.' ] },
    { role: 'Software Engineering Intern', org: 'Leadzen.ai', period: 'Feb 2023 — Aug 2023', bullets: [
      'Automation via Google Apps Script — cut manual workloads 90%, +80% task efficiency.',
      'Web scrapers processing 10,000+ data points/day — +35% acquisition speed.',
      'Document validators, bots & APIs in Python/AppScript — 99% accuracy, -85% error rate.',
      'Automated reporting & comms for marketing/ops — saved 30+ hrs/week, +50% productivity.' ] },
    { role: 'Research Intern', org: 'PixelNib', period: 'Sep 2022 — Nov 2022', bullets: [
      'Shipped a full WordPress site for a client end-to-end (setup → payments → deploy) including a security audit.',
      'Built a web/Telegram app translating Bhagavad Gita shlokas in real-time across languages, with GenAI Q&A.',
      'Built a movies Telegram bot serving 3,000+ users.' ] },
    { role: 'Content Creator & Educator', org: 'pyGuru — YouTube & Udemy', period: 'Ongoing', bullets: [
      '20,000+ YouTube subscribers & 10,000+ Telegram members — coding, dev & ethical-hacking content.',
      'Ethical Hacking course on Udemy — 4,500+ enrollments at a 4.7 instructor rating.' ] },
  ] as Experience[],
  projects: [
    { id:'001', slug:'financial-doc-engine', type:'FLAGSHIP', tone:'#ffb4ab', ref:'LEADZEN', title:'AI Financial-Doc Engine',
      desc:'Automated generation of dynamic financial documents for Indian listed companies using CrewAI agents + LangChain & Hugging Face. 50% faster, 95%+ accuracy.',
      tech:['FastAPI','CrewAI','LangChain','HuggingFace'], link:LINKS.github },
    { id:'002', slug:'data-pipeline', type:'BACKEND', tone:'#00e639', ref:'LEADZEN', title:'Company Data Pipeline',
      desc:'End-to-end pipeline for listed companies — scraping, cleaning, storage, analysis, realtime updates & caching powering the company web app.',
      tech:['Python','MongoDB','Redis','FastAPI'], link:LINKS.github },
    { id:'003', slug:'security-audit', type:'SECURITY', tone:'#fbbc00', ref:'AUDIT', title:'Web-App Security Audit',
      desc:'Comprehensive security audit & penetration test of production web apps — found vulnerabilities and drove remediation.',
      tech:['Burp Suite','nmap','sublist3r','Kali'], link:LINKS.github },
    { id:'004', slug:'telegram-bot-api', type:'OPEN-SOURCE', tone:'#00e639', ref:'TG-API', title:'Telegram Bot API',
      desc:'End-to-end Telegram bot + backend APIs bringing LLMs/GenAI apps, movies and a Python code-executor to Telegram for free via reverse engineering. 3,000+ users.',
      tech:['Python','FastAPI','Telegram','LLM'], link:LINKS.tgbot },
    { id:'005', slug:'decrypto', type:'PYPI', tone:'#fbbc00', ref:'PKG', title:'Decrypto',
      desc:'Lightweight Python PyPI package providing state-of-the-art encryption/decryption — simple, easy to use, drop-in for any Python project.',
      tech:['Python','Cryptography','PyPI'], link:LINKS.pypi },
    { id:'006', slug:'gita-translator', type:'GEN-AI', tone:'#00e639', ref:'PIXELNIB', title:'Gita Shloka Translator',
      desc:'Web/Telegram app translating Bhagavad Gita shlokas in real-time across languages, with GenAI-powered interactive Q&A.',
      tech:['Python','GenAI','Telegram'], link:LINKS.github },
    { id:'007', slug:'movies-bot', type:'BOT', tone:'#84967e', ref:'TG', title:'Movies Telegram Bot',
      desc:'Telegram bot delivering the latest movies & web-series to 3,000+ users.',
      tech:['Python','Telegram'], link:LINKS.github },
    { id:'008', slug:'cybiqon', type:'VENTURE', tone:'#84967e', ref:'2026', title:'cybiqon.in',
      desc:'Flagship 2026 venture — building & scaling cybiqon across security & automation.',
      tech:['Web','Security','Product'], link:LINKS.cybiqon },
  ] as Project[],
  topSkills: ['Python','FastAPI','CrewAI','LangChain','Generative AI','Backend Arch','Cybersecurity','Automation'],
  skills: {
    'Languages': ['Python','JavaScript','C#'],
    'Frameworks': ['Flask','FastAPI','LangChain','CrewAI','Redis'],
    'Databases': ['MongoDB','MySQL'],
    'Web': ['HTML','CSS','REST APIs','Generative AI'],
    'Version Control': ['Git','GitHub','BitBucket'],
    'Automation & Scraping': ['Selenium','BeautifulSoup','Apps Script','Telegram Bots'],
    'Ethical Hacking': ['Burp Suite','SilverBullet','nmap','sublist3r','Kali Linux'],
  } as Record<string, string[]>,
  education: [
    { degree:'M.Sc. Computer Science', school:'AKTU University', period:'2021 — 2023' },
    { degree:'B.Sc. Computer Science', school:'CSJM University', period:'2018 — 2021' },
  ] as Education[],
  certs: [
    { title:'Cyber Security & Bug Bounty', body:'IIT Kanpur — hands-on vulnerability identification, reporting & ethical-hacking techniques.' },
    { title:'Geoprocessing using Python', body:'IIRS / ISRO — geospatial data analysis & processing in Python.' },
    { title:'Full-Stack Web Dev with Flask', body:'Packt — dynamic web apps, front+back integration, DB & deployment.' },
    { title:'Unit Testing & TDD with Python', body:'LinkedIn — robust test cases & test-driven development.' },
  ] as Cert[],
  extras: [
    'Write blog posts & video tutorials — 20k+ YouTube, 10k+ Telegram.',
    'Contribute to open-source projects.',
    'Organize The Hacker Meetup (Kanpur Chapter).',
    'Participated & organized college coding competitions & hackathons.',
  ],
}
export type ResumeType = typeof RESUME
