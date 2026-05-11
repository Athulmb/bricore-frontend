import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
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
                <Card className="p-6 bg-white border-gray-200 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Phone Number</p>
                            <p className="text-sm text-gray-600 mt-1">2349162687000</p>
                            <p className="text-xs text-gray-400 mt-1">Available Mon-Fri, 9am - 6pm</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Email Address</p>
                            <p className="text-sm text-gray-600 mt-1">info@gmeinterchange.com</p>
                            <p className="text-xs text-gray-400 mt-1">Response within 24 hours</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                            <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Headquarters</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Behind FRSC Interchange Emergency Clinic,<br />
                                Sagamu Road, Ogun State, Nigeria.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Our Facilities</p>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-sm font-medium text-gray-900">Interchange Facility, Sagamu</p>
                                <p className="text-xs text-gray-600 mt-1">Processing, Testing & Export Solutions</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Form */}
                <Card className="lg:col-span-2 p-6 bg-white border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Let’s Start a Conversation</h3>
                    <p className="text-sm text-gray-600 mb-6">Whether you’re a miner, exporter, buyer, or investor, we’re here to guide you.</p>

                    <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="Enter your name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="email@example.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" placeholder="How can we help you?" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Write your message here..."
                                rows={6}
                            />
                        </div>

                        <Button className="w-full md:w-auto gap-2 bg-[#203727] hover:bg-[#2d4d39]">
                            <Send className="h-4 w-4" />
                            Send Message
                        </Button>
                    </form>
                </Card>
            </div>

            {/* Map Placeholder */}
            <Card className="p-1 px-1 bg-gray-100 border-gray-200 h-[300px] flex items-center justify-center overflow-hidden">
                <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-3">
                        <Navigation className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Interactive Map Coming Soon</p>
                    <p className="text-xs text-gray-400">Sagamu Road Facility Presence</p>
                </div>
            </Card>
        </div>
    );
}
