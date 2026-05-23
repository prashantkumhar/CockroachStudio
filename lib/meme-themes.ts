export type MemeTheme = {
  id: string;
  category: "indian" | "corporate" | "genz" | "reddit" | "universal";
  name: string;
  culturalContext: string;
  triggers: string[];
  exampleCaptions: {
    templateId: string;
    texts: string[];
    tone: string;
  }[];
};

export const memeThemes: MemeTheme[] = [
  // ── INDIAN LIFE ────────────────────────────────────────────────────────────
  {
    id: "sharma-ji-ka-beta",
    category: "indian",
    name: "Sharma Ji Ka Beta",
    culturalContext:
      "The mythical overachieving neighbour's kid used as a benchmark for everyone else's failures. Sharma Ji Ka Beta got 99%, went to IIT, and is now a doctor and an engineer somehow.",
    triggers: ["exam paper", "report card", "marks", "result", "studying", "disappointed parent"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Me explaining my 72%", "Sharma ji ka beta: 99.8% and also learning guitar"],
        tone: "self-deprecating",
      },
    ],
  },
  {
    id: "kitna-kamaate-ho",
    category: "indian",
    name: "Kitna Kamaate Ho",
    culturalContext:
      "Nosy relatives who ask about salary, job, marriage at every family gathering. No personal question is off-limits at an Indian function.",
    triggers: ["family gathering", "wedding", "relatives", "formal clothes", "awkward smile", "function"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when you attend a family function", "and survive 47 'beta shaadi kab karoge' questions"],
        tone: "relatable chaos",
      },
    ],
  },
  {
    id: "jugaad",
    category: "indian",
    name: "Jugaad Mode",
    culturalContext:
      "The Indian art of improvisation — making something work with whatever's available. Duct tape, rubber bands, and pure willpower over proper solutions.",
    triggers: ["improvised setup", "DIY fix", "cable management chaos", "makeshift", "creative solution"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Western engineering: spend $200 on the right part", "Indian engineering (jugaad):"],
        tone: "proud chaos",
      },
    ],
  },
  {
    id: "ghar-ka-khana",
    category: "indian",
    name: "Ghar Ka Khana",
    culturalContext:
      "The Indian obsession with home-cooked food. Restaurant food is suspicious, outside food is never as good, and mom's dal is a cure for everything.",
    triggers: ["tiffin box", "cafeteria food", "restaurant food", "lunch box", "homemade food"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: You opened your tiffin at school and the entire class turned around"],
        tone: "nostalgic",
      },
    ],
  },
  {
    id: "mere-zamaane-mein",
    category: "indian",
    name: "Mere Zamaane Mein",
    culturalContext:
      "Parents comparing their generation — walked 10km to school, no calculators, studied by candlelight, and somehow got 95%.",
    triggers: ["parent explaining", "old photo", "generation gap", "advice", "lecture"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Me: Dad I'm tired", "Dad: Mere zamaane mein hum 15km paidal chalke school jaate the"],
        tone: "affectionate sarcasm",
      },
    ],
  },
  {
    id: "ist-time",
    category: "indian",
    name: "Indian Stretchable Time",
    culturalContext:
      "IST — Indian Stretchable Time. When someone says 'coming in 5 minutes' they mean 45. Party starts at 8 means first guest arrives at 10.",
    triggers: ["clock", "waiting", "late arrival", "party", "meeting", "delayed"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when the invitation says 7pm sharp", "but you know IST means 9:30 minimum"],
        tone: "knowing",
      },
    ],
  },
  {
    id: "board-exam-pressure",
    category: "indian",
    name: "Board Exam Pressure",
    culturalContext:
      "10th and 12th board exams in India — treated like the literal end of the world. Your entire career, marriage prospects, and family honour rest on these marks.",
    triggers: ["textbook", "late night studying", "exam hall", "notes", "multiple books stacked", "study desk"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Society: It's just an exam, don't stress", "Me preparing for boards:"],
        tone: "dramatic",
      },
    ],
  },

  // ── CORPORATE INDIA / IT LIFE ──────────────────────────────────────────────
  {
    id: "as-per-last-email",
    category: "corporate",
    name: "As Per My Last Email",
    culturalContext:
      "The most passive-aggressive phrase in corporate India. 'As per my last email' means 'I already told you this, please read before you reply.'",
    triggers: ["laptop", "email open", "office", "tired office face", "work setup", "monitor"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["As per my last email,", "which you clearly did not read"],
        tone: "passive-aggressive",
      },
    ],
  },
  {
    id: "loop-stakeholders",
    category: "corporate",
    name: "Please Loop In Stakeholders",
    culturalContext:
      "Corporate meetings that breed more meetings. 'Let's loop in the stakeholders' means this simple task now needs 12 people in CC and 4 more alignment calls.",
    triggers: ["meeting room", "zoom call", "calendar", "conference room", "video call setup"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when you ask one simple question", "and get invited to 3 alignment meetings and a workshop"],
        tone: "exhausted",
      },
    ],
  },
  {
    id: "appraisal-season",
    category: "corporate",
    name: "Appraisal Season",
    culturalContext:
      "Annual performance reviews in Indian IT companies where your variable component mysteriously disappears and you get rated 'Meets Expectations' despite exceeding every target.",
    triggers: ["spreadsheet", "suit", "nervous smile", "formal attire", "office formal"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: It's appraisal season and your manager just said 'you're doing great but...'"],
        tone: "dread",
      },
    ],
  },
  {
    id: "freshers-arc",
    category: "corporate",
    name: "Freshers Disillusionment Arc",
    culturalContext:
      "The classic corporate India arc: Day 1 fresher walks in full of dreams and a LinkedIn post ready. Day 180: hollow eyes, no LinkedIn posts, and mastery of Alt+Tab.",
    triggers: ["office ID card", "new employee", "day one", "excited face", "fresh graduate"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Day 1: I'm going to change this company", "Day 180:"],
        tone: "disillusionment",
      },
    ],
  },
  {
    id: "linkedin-humblebrag",
    category: "corporate",
    name: "LinkedIn Hustle Post",
    culturalContext:
      "'Excited to share...' posts that are just thinly veiled showing off. 'Humbled and honoured' to announce getting a raise. LinkedIn is the resume you write for people you don't like.",
    triggers: ["LinkedIn visible on screen", "professional pose", "office celebration", "award", "promotion"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Humbled and honoured and grateful and blessed to announce:", "I got a pay raise (LinkedIn post incoming)"],
        tone: "satirical",
      },
    ],
  },
  {
    id: "wfh-chaos",
    category: "corporate",
    name: "WFH Productivity",
    culturalContext:
      "Working from home was supposed to unlock peak productivity. Instead: cat on keyboard, family interruptions mid-call, wearing formal shirt with pyjamas, and 4pm becoming the new 9am.",
    triggers: ["messy home desk", "laptop at home", "home office chaos", "bed setup", "casual home attire"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when you said WFH would make you more productive", "and it's 2pm and you're still in bed on a Teams call"],
        tone: "relatable",
      },
    ],
  },
  {
    id: "bench-life",
    category: "corporate",
    name: "IT Bench Life",
    culturalContext:
      "TCS/Infosys/Wipro employees waiting for a project to be allocated. Technically employed, not working, attending mandatory trainings, and slowly losing their mind.",
    triggers: ["empty desk", "bored expression", "office canteen", "training screen", "idle work setup"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: Month 3 on bench, completing your 47th online certification"],
        tone: "hollow",
      },
    ],
  },
  {
    id: "deadline-11pm",
    category: "corporate",
    name: "11:58 PM Deadline",
    culturalContext:
      "Submitting assignments, deliverables, or forms at the last possible second. The adrenaline of uploading at 11:59:47 is a universal Indian student/employee experience.",
    triggers: ["clock showing late time", "dark room", "frantic typing", "night time screen glow", "stressed face late"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["The assignment was due at midnight", "Me at 11:58:43 PM:"],
        tone: "chaos energy",
      },
    ],
  },

  // ── GEN Z INDIA ────────────────────────────────────────────────────────────
  {
    id: "cgpa-vs-skills",
    category: "genz",
    name: "CGPA vs Actual Skills",
    culturalContext:
      "'Grades don't define you' — the mantra of every engineering student sitting on a 6.2 CGPA who ships side projects, has 3 internships, and gets better offers than the 9-pointer.",
    triggers: ["marks sheet", "laptop with code", "certificate", "skill badges", "portfolio", "resume"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["My CGPA: 6.4", "My Github: 47 repos, 3 internships, 2 open source contributions"],
        tone: "justified",
      },
    ],
  },
  {
    id: "engineer-to-creator",
    category: "genz",
    name: "Studied Engineering, Became Content Creator",
    culturalContext:
      "The classic Gen Z plot twist. 4 years of engineering, lakhs in fees, and you end up making Instagram reels or a YouTube channel. Parents still tell relatives 'software engineer hai.'",
    triggers: ["engineering textbook", "ring light", "camera setup", "content creation setup", "phone on tripod"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Parents: 4 years of engineering ho gaye, ab kya karoge?", "Me: introducing my new YouTube channel"],
        tone: "chaotic neutral",
      },
    ],
  },
  {
    id: "hustle-burnout",
    category: "genz",
    name: "Hustle Culture Burnout",
    culturalContext:
      "The 5am club, grind mentality, 'sleep is for the weak' crowd — secretly running on empty. Gen Z discovered the burnout arc faster than any generation before them.",
    triggers: ["productive morning setup", "dark circles", "energy drink", "multiple tabs open", "late night grind"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when you wake up at 5am for your 'morning routine'", "but the routine is just lying there having a crisis"],
        tone: "honest",
      },
    ],
  },
  {
    id: "doomscroll-2am",
    category: "genz",
    name: "Doomscrolling at 2am",
    culturalContext:
      "Can't sleep, phone screen illuminating your face, three hours of Instagram reels, memes, and news. You know you should sleep. You are not sleeping.",
    triggers: ["dark room", "phone glow", "tired face at night", "bed with phone", "screen at night"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: It's 2:37am, you have 8am class, and you're watching cooking videos of food you'll never make"],
        tone: "resigned",
      },
    ],
  },
  {
    id: "delulu-energy",
    category: "genz",
    name: "Delulu is the Solulu",
    culturalContext:
      "Delusional self-confidence as a legitimate survival strategy. Manifesting outcomes that make no sense statistically. Delulu is the new optimism.",
    triggers: ["confident pose", "ridiculous situation", "bold expression", "unbothered look"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["0 qualifications, 0 experience, 0 connections", "applying for the job anyway because delulu is the solulu:"],
        tone: "unhinged optimism",
      },
    ],
  },
  {
    id: "main-character",
    category: "genz",
    name: "Main Character Syndrome",
    culturalContext:
      "Treating your mundane everyday life as if it's a coming-of-age movie montage. The grocery run is actually a character arc. The commute has a soundtrack.",
    triggers: ["dramatic pose", "ordinary setting", "cinematic angle", "walking shot", "staring into distance"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: You're the main character and this is your 'things are about to change' moment"],
        tone: "cinematic delusion",
      },
    ],
  },
  {
    id: "manifestation-fail",
    category: "genz",
    name: "Manifestation + Hard Work = ???",
    culturalContext:
      "Made a vision board, meditated, journaled, visualised success, did everything right — still didn't get the internship. The universe is not responding to the vibrations.",
    triggers: ["vision board", "journal", "motivational poster", "affirmation", "crystal", "aesthetic setup"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Me: I manifested this opportunity", "The opportunity:"],
        tone: "betrayed",
      },
    ],
  },
  {
    id: "neet-jee-drop",
    category: "genz",
    name: "NEET/JEE Drop Year",
    culturalContext:
      "The gap year taken to crack NEET or JEE the next time. Isolation, Kota coaching vibes, questioning all life choices, and an identity entirely built around the rank.",
    triggers: ["books stacked high", "coaching material", "stressed studying", "reference books", "formula sheets"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Day 1 of drop year: I will crack JEE this time, I am focused", "Day 247:"],
        tone: "existential",
      },
    ],
  },

  // ── REDDIT ─────────────────────────────────────────────────────────────────
  {
    id: "programmer-humor",
    category: "reddit",
    name: "r/ProgrammerHumor",
    culturalContext:
      "The universal experience of software engineers: code that works on your machine but not in prod, Stack Overflow as a religion, and 'it's not a bug it's a feature' as a coping mechanism.",
    triggers: ["computer screen", "code on screen", "laptop", "keyboard", "terminal", "IDE visible", "monitor with code"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Works on my machine", "Production at 3am:"],
        tone: "programmer solidarity",
      },
    ],
  },
  {
    id: "mildly-infuriating",
    category: "reddit",
    name: "r/mildlyinfuriating",
    culturalContext:
      "A tiny inconvenience presented as if it's a catastrophic injustice. The label that's slightly off-centre. The door that opens the wrong way. Perfectly calibrated rage.",
    triggers: ["slight misalignment", "almost right", "small annoyance", "close but wrong", "nearly perfect"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["This is not okay. I don't care if no one else sees it.", "I see it."],
        tone: "disproportionate rage",
      },
    ],
  },
  {
    id: "nobody-absolutely-nobody",
    category: "reddit",
    name: "Nobody: / Absolutely nobody:",
    culturalContext:
      "The Reddit meme format that highlights unprompted, unsolicited, inexplicable behaviour. Nobody asked. Nobody needed this. And yet here we are.",
    triggers: ["doing something random", "unexpected action", "silly pose", "unprompted behaviour"],
    exampleCaptions: [
      {
        templateId: "nobody-nobody",
        texts: ["Nobody:", "Absolutely nobody:", "Me at 2am:"],
        tone: "unhinged",
      },
    ],
  },
  {
    id: "tifu",
    category: "reddit",
    name: "Today I F***ed Up",
    culturalContext:
      "r/tifu energy — the art of describing your own disaster with dramatic flair. The longer the setup, the bigger the payoff. Always ends with 'so that's how I [consequence].'",
    triggers: ["aftermath of mistake", "embarrassed expression", "disaster scene", "uh oh face", "oops"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["TIFU by thinking this was a good idea", "UPDATE: it was not a good idea"],
        tone: "self-aware disaster",
      },
    ],
  },
  {
    id: "shower-thoughts",
    category: "reddit",
    name: "Shower Thoughts",
    culturalContext:
      "Deep philosophical observations about completely mundane things. The kind of thought that sounds profound at 11pm and absolutely insane at 9am.",
    triggers: ["thoughtful expression", "staring into distance", "contemplative pose", "thinking face"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["Shower thought:", "Every 'before' photo was someone's 'after' photo once"],
        tone: "accidentally profound",
      },
    ],
  },
  {
    id: "antiwork-energy",
    category: "reddit",
    name: "r/antiwork Energy",
    culturalContext:
      "The quiet resentment of being expected to give maximum effort for minimum wage. 'Quiet quitting,' 'bare minimum Mondays,' and counting down to 5:01pm.",
    triggers: ["clock watching", "bored at work", "Monday morning", "work from office", "mandatory overtime"],
    exampleCaptions: [
      {
        templateId: "when-you",
        texts: ["when they ask you to 'go above and beyond'", "for the same salary since 2022"],
        tone: "done with it",
      },
    ],
  },
  {
    id: "linkedin-lunatics",
    category: "reddit",
    name: "LinkedIn Lunatics",
    culturalContext:
      "The r/LinkedInLunatics version of professional culture — where getting a parking ticket becomes a lesson in resilience, and every mundane event warrants a 400-word post about growth.",
    triggers: ["professional setting", "corporate pose", "conference", "award ceremony", "achievement pose"],
    exampleCaptions: [
      {
        templateId: "caption-above",
        texts: ["I recently got rejected from a job.", "Here's what that taught me about LEADERSHIP and RESILIENCE (thread):"],
        tone: "delusional professionalism",
      },
    ],
  },

  // ── UNIVERSAL ──────────────────────────────────────────────────────────────
  {
    id: "this-is-fine",
    category: "universal",
    name: "This Is Fine",
    culturalContext:
      "Everything is clearly on fire and falling apart, but we are choosing to smile and say it's fine. The defining vibe of modern existence.",
    triggers: ["chaos", "things going wrong", "forced smile", "disaster in background", "calm amid crisis"],
    exampleCaptions: [
      {
        templateId: "bottom-only",
        texts: ["This is fine."],
        tone: "denial",
      },
    ],
  },
  {
    id: "expectations-vs-reality",
    category: "universal",
    name: "Expectations vs Reality",
    culturalContext:
      "The gap between what you imagined and what actually happened. A universal human experience compressed into two panels.",
    triggers: ["before and after", "disappointed expression", "result vs expectation", "plan gone wrong"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["What I thought this would look like:", "What it actually looks like:"],
        tone: "universal disappointment",
      },
    ],
  },
  {
    id: "monday-energy",
    category: "universal",
    name: "Monday Energy",
    culturalContext:
      "The universal transition between weekend mode and work mode. Friday 5pm and Monday 9am are two completely different people.",
    triggers: ["morning", "tired face", "office arrival", "coffee", "beginning of the day"],
    exampleCaptions: [
      {
        templateId: "pov",
        texts: ["POV: It's Monday morning and you have to convince your body you're a functional adult"],
        tone: "solidarity",
      },
    ],
  },
  {
    id: "everyone-vs-me",
    category: "universal",
    name: "Everyone vs Me",
    culturalContext:
      "When literally everyone else seems to have figured something out that you are still struggling with. The loneliest meme format.",
    triggers: ["crowd", "group vs individual", "outnumbered", "alone vs group"],
    exampleCaptions: [
      {
        templateId: "top-bottom",
        texts: ["Everyone: [doing the normal thing]", "Me:"],
        tone: "relatable isolation",
      },
    ],
  },
];

export function buildCulturalContext(): string {
  return memeThemes
    .map(
      (t) =>
        `[${t.id}] (${t.category}) ${t.name}: ${t.culturalContext}\n  Triggers: ${t.triggers.slice(0, 4).join(", ")}\n  Example (${t.exampleCaptions[0].templateId}): "${t.exampleCaptions[0].texts.join(" / ")}"`
    )
    .join("\n\n");
}
