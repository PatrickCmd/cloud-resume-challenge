import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Experience } from "@/sections/Experience";
import { Projects } from "@/sections/Projects";
import { Certifications } from "@/sections/Certifications";
import { Writing } from "@/sections/Writing";
import { Contact } from "@/sections/Contact";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Certifications />
      <Writing />
      <Contact />
    </div>
  );
}
