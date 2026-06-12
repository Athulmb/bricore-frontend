import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Phone, Mail, MapPin, Send, Clock, Globe, Navigation } from 'lucide-react';

export function ContactUs() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Contact Us"
                description="We value every inquiry and partnership opportunity. Our team is here to provide expert support."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info Cards */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#E8491F]/15 border border-[#E8491F]/20 flex items-center justify-center shrink-0 shadow-lg shadow-[#E8491F]/10">
                            <Phone className="h-5 w-5 text-[#E8491F]" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/45 uppercase tracking-wider">Phone Number</p>
                            <p className="text-sm font-semibold text-white/95 mt-1">+234 (0) 800 BRICORE</p>
                            <p className="text-xs text-white/35 mt-1">Available Mon-Fri, 9am - 6pm</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#E8491F]/15 border border-[#E8491F]/20 flex items-center justify-center shrink-0 shadow-lg shadow-[#E8491F]/10">
                            <Mail className="h-5 w-5 text-[#E8491F]" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/45 uppercase tracking-wider">Email Address</p>
                            <p className="text-sm font-semibold text-white/95 mt-1">partnerships@bricoreresources.com</p>
                            <p className="text-xs text-white/35 mt-1">Response within 24 hours</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#E8491F]/15 border border-[#E8491F]/20 flex items-center justify-center shrink-0 shadow-lg shadow-[#E8491F]/10">
                            <MapPin className="h-5 w-5 text-[#E8491F]" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/45 uppercase tracking-wider">Headquarters</p>
                            <p className="text-sm font-semibold text-white/95 mt-1">
                                Plot 14, Mining District Road Abuja,<br />
                                FCT, Nigeria.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Our Facilities</p>
                        <div className="space-y-4">
                            <div className="p-3 bg-white/[0.04] rounded-lg border border-white/5">
                                <p className="text-sm font-medium text-white/90">Abuja HQ & Logistics Hub</p>
                                <p className="text-xs text-white/40 mt-1">Processing, Testing & Export Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">Let’s Start a Conversation</h3>
                    <p className="text-sm text-white/40 mb-6">Whether you’re a miner, exporter, buyer, or investor, we’re here to guide you.</p>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-white/60">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your name"
                                    className="bg-white/[0.05] border-white/10 text-white/80 placeholder:text-white/20 focus:ring-2 focus:ring-[#E8491F]/30 focus:border-[#E8491F]/40"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/60">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    className="bg-white/[0.05] border-white/10 text-white/80 placeholder:text-white/20 focus:ring-2 focus:ring-[#E8491F]/30 focus:border-[#E8491F]/40"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-white/60">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="How can we help you?"
                                className="bg-white/[0.05] border-white/10 text-white/80 placeholder:text-white/20 focus:ring-2 focus:ring-[#E8491F]/30 focus:border-[#E8491F]/40"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-white/60">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Write your message here..."
                                rows={6}
                                className="bg-white/[0.05] border-white/10 text-white/80 placeholder:text-white/20 focus:ring-2 focus:ring-[#E8491F]/30 focus:border-[#E8491F]/40"
                            />
                        </div>

                        <Button className="w-full md:w-auto gap-2 bg-[#E8491F] hover:bg-[#C93D18] text-white shadow-lg shadow-[#E8491F]/25">
                            <Send className="h-4 w-4" />
                            Send Message
                        </Button>
                    </form>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="p-6 glass-card h-[300px] flex items-center justify-center overflow-hidden">
                <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Navigation className="h-6 w-6 text-white/40" />
                    </div>
                    <p className="text-sm font-semibold text-white/80">Interactive Map Coming Soon</p>
                    <p className="text-xs text-white/30 mt-1">Abuja Mining District Presence</p>
                </div>
            </div>
        </div>
    );
}
