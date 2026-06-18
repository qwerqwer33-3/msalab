import research from "../../data/research.json";
import ResearchShowcase from "./ResearchShowcase";

export const metadata = {
  title: "Research | MSQ Lab",
  description: "MSQ Lab research topics and application areas."
};

const topicBySlug = new Map(research.map((topic) => [topic.slug, topic]));

const theoreticalTopics = [
  {
    slug: "ai-assisted-synthesis-recipes"
  },
  {
    slug: "multiscale-multiphysics",
    title: "Multiscale Modeling"
  },
  {
    slug: "nucleation-theory"
  }
].map((item) => {
  const topic = topicBySlug.get(item.slug);
  if (!topic) {
    return null;
  }

  return {
    ...item,
    title: item.title || topic.title,
    image: topic.image,
    href: `/research/${topic.slug}`
  };
}).filter(Boolean);

const applicationTopics = [
  {
    title: "Oxide Semiconductors",
    image: "/images/Research/semiconductor-materials.png"
  },
  {
    title: "Topological Semimetals",
    image: "/images/Research/topological-semimetals-placeholder.svg"
  },
  {
    title: "Power Semiconductors",
    image: "/images/Research/power-semiconductors-placeholder.svg"
  },
  {
    title: "Ferroelectrics & Dielectrics",
    image: "/images/Research/ferroelectrics-dielectrics-placeholder.svg"
  },
  {
    title: "Battery Electrode & Electrolytes",
    image: "/images/Research/battery-materials.png"
  }
];

const sessions = [
  {
    key: "theoretical",
    index: "01",
    title: "Theoretical Session",
    topics: theoreticalTopics
  },
  {
    key: "application",
    index: "02",
    title: "Application Session",
    topics: applicationTopics
  }
];

export default function ResearchPage() {
  return <ResearchShowcase sessions={sessions} />;
}
