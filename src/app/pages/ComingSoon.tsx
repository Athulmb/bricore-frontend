import React from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PageHeader } from '../components/common/PageHeader';
import { LayoutPanelLeft, ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router';

export function ComingSoon() {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col">
            <PageHeader
                title="Module Under Development"
                description="We're currently building this operational feature for you."
            />

            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="max-w-lg w-full p-10 text-center space-y-8 bg-white border-2 border-dashed border-gray-200 shadow-none">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="p-6 bg-blue-50 rounded-2xl">
                                <Construction className="h-16 w-16 text-blue-600 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-lg shadow-lg">
                                <LayoutPanelLeft className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Coming Soon!</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            This module is part of our upcoming release. Our team is working hard
                            to bring you the best-in-class operational tools.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Go Back
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => navigate('/')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Back to Dashboard
                        </Button>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex justify-center gap-8 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-ping" />
                            <span>In Active Development</span>
                        </div>
                        <div>ETA: Q2 2026</div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
