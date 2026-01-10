"use client";

import { useState } from "react";

export default function SurveyBanner() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [price, setPrice] = useState("$10/mo");
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/api/survey", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    interested: true,
                    willing_price: price,
                    feedback,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                }, 3000);
            }
        } catch (error) {
            console.error("Survey submission failed:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 font-medium"
            >
                🚀 Help us improve!
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-semibold">Share your feedback</h3>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-4">
                {submitted ? (
                    <div className="text-center py-6">
                        <div className="text-blue-600 bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-900">Thank you!</p>
                        <p className="text-sm text-gray-500">Your feedback helps us build a better Resume Tailor.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <p className="text-sm text-gray-600">
                            We&apos;re going public soon! Would you pay for a subscription?
                        </p>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Willing price (Monthly)</label>
                            <select
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                            >
                                <option value="$10/mo">$10 / month</option>
                                <option value="$20/mo">$20 / month</option>
                                <option value="$50/mo">$50 / month</option>
                                <option value="Other">Other / One-time</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Any suggestions or questions?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-20 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-md"
                        >
                            {loading ? "Sending..." : "Submit Feedback"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
