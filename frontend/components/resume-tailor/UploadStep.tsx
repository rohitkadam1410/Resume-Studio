import React from 'react';

interface UploadStepProps {
    file: File | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    disabled: boolean;
}

export const UploadStep: React.FC<UploadStepProps> = ({ file, onFileChange, fileInputRef, disabled }) => {
    return (
        <div className={`transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center mb-4">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">1</span>
                <label className="text-lg font-semibold text-slate-800">Upload Resume (PDF)</label>
            </div>

            <div className="relative group">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    file:transition-colors
                    hover:file:bg-indigo-100
                    cursor-pointer"
                />
                {!file && (
                    <p className="mt-2 text-sm text-slate-400 pl-2">Max file size: 10MB</p>
                )}
                {file && (
                    <p className="mt-2 text-sm text-green-600 pl-2 font-medium">✓ {file.name}</p>
                )}
            </div>
        </div>
    );
};
