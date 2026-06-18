import json

members = [
  {
    "name": "Hyeon Woo Kim",
    "category": "Postdoc",
    "role": "Postdoctoral Researcher",
    "affiliation": "LAMP, Ajou University",
    "email": "khw93@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "Ph.D. in Materials Science and Engineering, Hanyang University (Advisor: Yongjae Jung)"
    ],
    "research": [
      "Functional semiconductor and display materials R&D.",
      "Nuclear-generation simulation workflows."
    ]
  },
  {
    "name": "Han Uk Lee",
    "category": "Ph.D.",
    "role": "Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "lhu@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "Ph.D. program, Energy Systems Research, Ajou University"
    ],
    "research": [
      "First-principles modeling for functional semiconductors and solid-state electrolytes.",
      "Machine-learning-driven molecular dynamics for nuclear generation."
    ]
  },
  {
    "name": "Min Sung Kang",
    "category": "Ph.D.",
    "role": "Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "kkkb2573@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "Ph.D. program, Energy Systems Research, Ajou University"
    ],
    "research": [
      "Energy harvester, semiconductor device, and battery process simulations.",
      "Multiscale nuclear-generation simulation."
    ]
  },
  {
    "name": "Dong Won Jeon",
    "category": "Ph.D.",
    "role": "Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "jdwjyl2007@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "Ph.D. program, Energy Systems Research, Ajou University",
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "Solid-state electrolyte batteries and electronic materials simulations.",
      "NLP-based synthesis workflow text mining."
    ]
  },
  {
    "name": "Juhyeon Ha",
    "category": "Integrated Ph.D.",
    "role": "Integrated Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "hajujuha@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "Integrated Ph.D. program, Energy Systems Research, Ajou University",
      "B.S., Materials Systems Engineering, Pukyong National University"
    ],
    "research": [
      "NLP-based literature mining.",
      "ALD process prediction."
    ]
  },
  {
    "name": "Jeu Shin",
    "category": "Integrated Ph.D.",
    "role": "Integrated Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "colorcircle33@gmail.com",
    "website": "https://qwerqwer33-3.github.io/J.Shin/#/",
    "photo": "/images/members/?�제??증명?�진.jpg",
    "education": [
      "2026.03 - Present: Integrated Ph.D. course, Energy Systems Research, Ajou University",
      "2020.03 - 2024.08: B.S., Mechanical Engineering, Hanbat National University"
    ],
    "research": [
      "Finite element analysis of battery materials and processes.",
      "First-principles calculations for battery material stability.",
      "Multiscale workflows for battery manufacturing."
    ]
  },
  {
    "name": "Jonghun Seo",
    "category": "Integrated Ph.D.",
    "role": "Integrated Ph.D. Candidate",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "hoon990819@naver.com",
    "photo": "/images/placeholder.svg",
    "education": [
      "Integrated Ph.D. program, Energy Systems Research, Ajou University",
      "B.S., Materials Science and Engineering, Kumoh National Institute of Technology"
    ],
    "research": [
      "Semiconductor device simulations."
    ]
  },
  {
    "name": "Junhyuk Kang",
    "category": "Masters",
    "role": "Master's Student",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "rkdwnsgur1@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "M.S. in Advanced Materials Science and Engineering, Ajou University",
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "Solid-state electrolyte battery and semiconductor device simulations."
    ]
  },
  {
    "name": "Ji Hoon Hong",
    "category": "Masters",
    "role": "Master's Student",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "blueper2000@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "M.S. in Energy Systems Research, Ajou University",
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "Oxide semiconductor modeling.",
      "Natural language-based literature learning."
    ]
  },
  {
    "name": "Jimin Kim",
    "category": "Masters",
    "role": "Master's Student",
    "affiliation": "Energy Systems Research, Ajou University",
    "email": "kjmkjm7230@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "M.S. in Energy Systems Research, Ajou University",
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "First-principles and molecular dynamics-based nuclear generation research.",
      "Ferroelectric materials for semiconductors."
    ]
  },
  {
    "name": "Jindong Hwang",
    "category": "Masters",
    "role": "Master's Student",
    "affiliation": "AI and Advanced Materials Science, Ajou University",
    "email": "wlsehd949@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "M.S. in Artificial Intelligence, Ajou University",
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "Battery material modeling with first-principles and molecular dynamics.",
      "Ferroelectric research using NLP."
    ]
  },
  {
    "name": "Jaeseok Hwang",
    "category": "Undergrad",
    "role": "Undergraduate Research Assistant",
    "affiliation": "Advanced Materials Science and Engineering, Ajou University",
    "email": "issac2002@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "First-principles and molecular dynamics for nuclear generation research.",
      "NLP for materials science."
    ]
  },
  {
    "name": "Seojun Moon",
    "category": "Undergrad",
    "role": "Undergraduate Research Assistant",
    "affiliation": "Advanced Materials Science and Engineering, Ajou University",
    "email": "intellmoon@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "First-principles and molecular dynamics for nuclear generation."
    ]
  },
  {
    "name": "Seongjun Kim",
    "category": "Undergrad",
    "role": "Undergraduate Research Assistant",
    "affiliation": "Advanced Materials Science and Engineering, Ajou University",
    "email": "kimsj1017@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "First-principles calculations for interconnect materials."
    ]
  },
  {
    "name": "Jaeseon Yoo",
    "category": "Undergrad",
    "role": "Undergraduate Research Assistant",
    "affiliation": "Advanced Materials Science and Engineering, Ajou University",
    "email": "aasdfp00372@ajou.ac.kr",
    "photo": "/images/placeholder.svg",
    "education": [
      "B.S., Advanced Materials Science and Engineering, Ajou University"
    ],
    "research": [
      "First-principles calculations for interconnect materials."
    ]
  },
  {
    "name": "Donghyun Cho",
    "category": "Alumni",
    "role": "Ph.D. Graduate (2023)",
    "affiliation": "Samsung Advanced Institute of Technology",
    "email": "cho.donghyun@sait.com",
    "photo": "/images/placeholder.svg",
    "education": [
      "Ph.D. in Advanced Materials Science and Engineering, Ajou University",
      "B.S. in Materials Science, Ajou University"
    ],
    "research": [
      "Advanced ceramics for thermal management.",
      "Machine-learning assisted structure prediction."
    ]
  }
]

with open('data/members.json','w',encoding='utf8') as f:
    json.dump(members,f,ensure_ascii=False,indent=2)
