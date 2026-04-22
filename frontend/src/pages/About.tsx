import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Users, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Heart
} from "lucide-react";

const values = [
  { icon: ShieldCheck, title: "Security First", desc: "We believe privacy and security are fundamental. We never store your API data and provide tools like Endpoint Locking to keep you in control." },
  { icon: Sparkles, title: "Radical Simplicity", desc: "Integration shouldn't take weeks. We aim for a '2-minute setup' for every agent, no matter how complex the backend." },
  { icon: Globe, title: "Mission Driven", desc: "Our goal is to bridge the gap between static REST APIs and the future of Agentic AI, making sophisticated tools accessible to everyone." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for the future of APIs</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Beaver was born out of a simple problem: AI agents are hard to build, and APIs are even harder to integrate. We're here to change that.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden mb-24 border border-border">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-00fd8e0c9048?auto=format&fit=crop&q=80&w=1200" 
              alt="Team collaboration" 
              className="w-full aspect-[21/9] object-cover"
            />
          </div>

          <div className="grid gap-12 md:grid-cols-3 mb-24">
            {values.map((v, i) => (
              <div key={i} className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center p-12 rounded-3xl bg-gradient-card border border-border">
             <Heart className="h-8 w-8 text-primary mx-auto mb-6" />
             <h2 className="text-3xl font-bold mb-4">Join the journey</h2>
             <p className="text-lg text-muted-foreground mb-8">
               We're just getting started. If you're passionate about the intersection of APIs and LLMs, we'd love to hear from you.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:opacity-90">View Careers</button>
               <button className="rounded-xl border border-border px-8 py-3 font-semibold hover:bg-secondary transition-base">Contact Us</button>
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
