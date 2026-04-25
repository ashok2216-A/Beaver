'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { Mail, MessageSquare, MapPin, Send, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-32">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left Side: Contact Info */}
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                  Get in Touch
                </div>
                <h1 className="text-6xl font-bold tracking-tight leading-[0.9]">
                  Let's talk <br />
                  <span className="text-muted-foreground">Agents.</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                  Have questions about scaling your API integrations? Our team of engineers is here to help.
                </p>
              </div>

              <div className="space-y-8 pt-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Email us</h4>
                    <p className="text-muted-foreground mb-1">Our team typically responds in 2 hours.</p>
                    <p className="text-primary font-bold">hello@beaver.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Live Chat</h4>
                    <p className="text-muted-foreground mb-1">Available Mon-Fri, 9am - 6pm EST.</p>
                    <p className="text-primary font-bold">Launch Messenger</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Office</h4>
                    <p className="text-muted-foreground">123 AI Boulevard, Suite 400<br />San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <Card className="p-10 border-none bg-card shadow-2xl rounded-[3rem] relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
              
              <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <input 
                      placeholder="Jane Doe" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Work Email</label>
                    <input 
                      type="email"
                      placeholder="jane@company.com" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject</label>
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none">
                    <option>General Inquiry</option>
                    <option>Sales & Enterprise</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                  <textarea 
                    rows={5}
                    placeholder="Tell us about your project..." 
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                  />
                </div>

                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-glow group/btn">
                  Send Message <Send className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  By clicking send, you agree to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
                </p>
              </form>
            </Card>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
