import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Type as TypeIcon, 
  Camera as CameraIcon, 
  Send, 
  Download, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Languages,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera } from './components/Camera';
import { analyzeText } from './services/geminiService';
import { AnalysisResult } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'prompt' | 'camera'>('prompt');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showMatching, setShowMatching] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!textInput && !selectedImage) {
      alert("Please provide text or an image.");
      return;
    }

    setIsProcessing(true);
    try {
      const data = await analyzeText(textInput, selectedImage || undefined);
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze content. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('English_Learning_Guide.pdf');
  };

  const downloadDocx = async () => {
    if (!result) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: "English Learning Guide", heading: HeadingLevel.HEADING_1 }),
          
          new Paragraph({ text: "Vocabulary", heading: HeadingLevel.HEADING_2 }),
          ...result.vocabulary.flatMap(v => [
            new Paragraph({
              children: [
                new TextRun({ text: `${v.word}: `, bold: true }),
                new TextRun(v.meaning),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Antonym: ${v.antonym} (${v.antonymMeaning})`, italics: true }),
              ]
            })
          ]),

          new Paragraph({ text: "Sentence Breakdown", heading: HeadingLevel.HEADING_2 }),
          ...result.sentences.flatMap(s => [
            new Paragraph({ children: [new TextRun({ text: s.original, bold: true })] }),
            new Paragraph({ text: `Subject: ${s.subject}, Verb: ${s.verb}` }),
            new Paragraph({ text: `Phrases: ${s.phrases.join(', ')}` }),
            new Paragraph({ children: [new TextRun({ text: `Translation: ${s.translation}`, italics: true })] }),
          ]),

          new Paragraph({ text: "Questions & Answers", heading: HeadingLevel.HEADING_2 }),
          ...result.qa.flatMap(q => [
            new Paragraph({ children: [new TextRun({ text: `Q: ${q.question}`, bold: true })] }),
            new Paragraph({ text: `A: ${q.answer}` }),
          ]),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'English_Learning_Guide.docx';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 md:p-8 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 text-center">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4"
        >
          English Learning Pro
        </motion.h1>
        <p className="text-slate-400 text-lg">Class 3 to 12 English Mastery Tool</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transform-gpu perspective-1000 hover:rotate-x-1 hover:rotate-y-1 transition-transform duration-500">
            <div className="flex bg-slate-900/50 rounded-2xl p-1 mb-6">
              {[
                { id: 'prompt', icon: TypeIcon, label: 'Text' },
                { id: 'upload', icon: Upload, label: 'Upload' },
                { id: 'camera', icon: CameraIcon, label: 'Camera' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'prompt' && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste or type your English text here..."
                    className="w-full h-48 bg-slate-900/50 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-slate-200 placeholder:text-slate-600"
                  />
                </motion.div>
              )}

              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors cursor-pointer relative overflow-hidden"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {selectedImage ? (
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Upload className="text-slate-500 mb-2" size={32} />
                      <p className="text-slate-400">Click or drag image to upload</p>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'camera' && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl bg-slate-900/30"
                >
                  {selectedImage ? (
                    <div className="relative w-full h-full p-2">
                      <img src={selectedImage} alt="Captured" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-1 bg-red-500 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCameraOpen(true)}
                      className="flex flex-col items-center text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <CameraIcon size={48} className="mb-2" />
                      <p>Open Camera</p>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
            >
              {isProcessing ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              {isProcessing ? 'Analyzing...' : 'Generate Guide'}
            </button>
          </div>

          {/* User Notes */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Info size={20} />
              <h3 className="font-bold">User Instructions</h3>
            </div>
            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
              <li>Upload a clear image of your English textbook page.</li>
              <li>Or paste text directly into the prompt box.</li>
              <li>Use the Camera to capture text in portrait mode.</li>
              <li>The tool will generate meanings, antonyms, and translations.</li>
              <li>Interactive exercises like matching and blanks are included.</li>
              <li>Download the final guide as PDF or DOCX for printing.</li>
            </ul>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7">
          {!result && !isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
              <BookOpen size={64} className="mb-4 opacity-20" />
              <p className="text-xl">Your learning guide will appear here</p>
            </div>
          )}

          {isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-emerald-400 font-medium animate-pulse">Gemini is analyzing your text...</p>
            </div>
          )}

          {result && (
            <div className="space-y-8 pb-12">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button 
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  <Download size={18} /> PDF
                </button>
                <button 
                  onClick={downloadDocx}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all"
                >
                  <FileText size={18} /> DOCX
                </button>
              </div>

              {/* Printable Area */}
              <div ref={printRef} className="space-y-8 bg-white text-slate-900 p-8 rounded-3xl shadow-2xl overflow-hidden">
                <div className="border-b-2 border-slate-100 pb-4 mb-8">
                  <h2 className="text-3xl font-bold text-slate-800">English Learning Guide</h2>
                  <p className="text-slate-500">Comprehensive Analysis & Exercises</p>
                </div>

                {/* Vocabulary Card */}
                <section className="bg-amber-50 rounded-2xl p-6 border border-amber-100 transform-gpu hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-2 text-amber-700 mb-4">
                    <BookOpen size={24} />
                    <h3 className="text-xl font-bold">Vocabulary (শব্দার্থ ও বিপরীত শব্দ)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.vocabulary.map((v, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg text-amber-900">{v.word}</span>
                          <span className="text-amber-600 font-medium">{v.meaning}</span>
                        </div>
                        <div className="text-sm text-slate-500 italic">
                          Antonym: <span className="text-red-500 font-medium">{v.antonym}</span> ({v.antonymMeaning})
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Sentence Breakdown Card */}
                <section className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 transform-gpu hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-2 text-emerald-700 mb-4">
                    <Languages size={24} />
                    <h3 className="text-xl font-bold">Sentence Analysis (বাক্য বিশ্লেষণ ও অনুবাদ)</h3>
                  </div>
                  <div className="space-y-6">
                    {result.sentences.map((s, i) => (
                      <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
                        <p className="font-bold text-slate-800 mb-3 text-lg">"{s.original}"</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
                          <div className="bg-slate-50 p-2 rounded">
                            <span className="block text-xs text-slate-400 uppercase font-bold">Subject</span>
                            {s.subject}
                          </div>
                          <div className="bg-slate-50 p-2 rounded">
                            <span className="block text-xs text-slate-400 uppercase font-bold">Verb</span>
                            {s.verb}
                          </div>
                          <div className="bg-slate-50 p-2 rounded">
                            <span className="block text-xs text-slate-400 uppercase font-bold">Phrases</span>
                            {s.phrases.join(', ')}
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-200">
                          <span className="block text-xs text-emerald-600 uppercase font-bold mb-1">Translation</span>
                          <p className="text-emerald-900 font-medium">{s.translation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Q&A Section */}
                <section className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100 transform-gpu hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-2 text-cyan-700 mb-4">
                    <HelpCircle size={24} />
                    <h3 className="text-xl font-bold">Questions & Answers (প্রশ্ন ও উত্তর)</h3>
                  </div>
                  <div className="space-y-4">
                    {result.qa.map((q, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-cyan-100">
                        <p className="font-bold text-slate-800 mb-2">Q: {q.question}</p>
                        <p className="text-slate-600">A: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Matching Table */}
                <section className="bg-purple-50 rounded-2xl p-6 border border-purple-100 transform-gpu hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-purple-700">
                      <ArrowRightLeft size={24} />
                      <h3 className="text-xl font-bold">Matching Table (মিলকরণ)</h3>
                    </div>
                    <button 
                      onClick={() => setShowMatching(!showMatching)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        showMatching ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-700'
                      }`}
                    >
                      {showMatching ? 'Hide Match' : 'Show Match'}
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-purple-200 bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-100">
                          <th className="p-4 font-bold text-purple-900 border-r border-purple-200">Part A</th>
                          <th className="p-4 font-bold text-purple-900">Part B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.matching.map((m, i) => (
                          <tr key={i} className="border-t border-purple-100">
                            <td className="p-4 border-r border-purple-100">{m.left}</td>
                            <td className="p-4">
                              {showMatching ? (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 font-medium">
                                  {m.right}
                                </motion.span>
                              ) : (
                                <span className="text-slate-300 italic">???</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Fill in the Blanks */}
                <section className="bg-rose-50 rounded-2xl p-6 border border-rose-100 transform-gpu hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-rose-700">
                      <CheckCircle2 size={24} />
                      <h3 className="text-xl font-bold">Fill in the Blanks (শূন্যস্থান পূরণ)</h3>
                    </div>
                    <button 
                      onClick={() => setShowAnswers(!showAnswers)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        showAnswers ? 'bg-rose-600 text-white' : 'bg-rose-200 text-rose-700'
                      }`}
                    >
                      {showAnswers ? 'Hide Answers' : 'Show Answers'}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {result.blanks.map((b, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-rose-100">
                        <p className="text-slate-800">
                          {i + 1}. {b.sentence.split('____').map((part, idx, arr) => (
                            <React.Fragment key={idx}>
                              {part}
                              {idx < arr.length - 1 && (
                                <span className="inline-block min-w-[80px] border-b-2 border-slate-300 mx-2 text-center text-emerald-600 font-bold">
                                  {showAnswers ? b.answer : ''}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Notes & Importance Section */}
      <section className="max-w-6xl mx-auto mt-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800/40 border border-white/5 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <Info size={24} /> এ্যাপটির বৈশিষ্ট্য ও গুরুত্ব
            </h3>
            <div className="space-y-4 text-slate-300">
              <p>১. <strong>নির্ভুল বিশ্লেষণ:</strong> প্রতিটি শব্দের অর্থ এবং বিপরীত শব্দ সহ পূর্ণাঙ্গ তালিকা প্রদান করে।</p>
              <p>২. <strong>বাক্য বিশ্লেষণ:</strong> ইংরেজি বাক্যকে কর্তা, ক্রিয়া এবং ফ্রেজ অনুযায়ী ভেঙ্গে অনুবাদ করার ফলে ছাত্রছাত্রীরা সহজেই গ্রামার বুঝতে পারে।</p>
              <p>৩. <strong>ইন্টারেক্টিভ লার্নিং:</strong> অটো-জেনারেটেড প্রশ্ন-উত্তর, ম্যাচিং টেবিল এবং শূন্যস্থান পূরণ অনুশীলনের মাধ্যমে শেখা আরও মজাদার হয়।</p>
              <p>৪. <strong>প্রফেশনাল এক্সপোর্ট:</strong> সরাসরি A4 সাইজে PDF এবং DOCX ফাইল ডাউনলোড করে প্রিন্ট করার সুবিধা।</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800/40 border border-white/5 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BookOpen size={24} /> কিভাবে ব্যবহার করবেন (User Note)
            </h3>
            <div className="space-y-4 text-slate-300">
              <p>১. প্রথমে আপনার ইংরেজি বইয়ের পৃষ্ঠার ছবি তুলুন অথবা টেক্সট কপি করে প্রম্পট বক্সে দিন।</p>
              <p>২. 'Generate Guide' বাটনে ক্লিক করুন এবং কিছুক্ষণ অপেক্ষা করুন।</p>
              <p>৩. জেনারেট হওয়া কন্টেন্টগুলো স্ক্রিনে দেখতে পাবেন। উত্তর দেখার জন্য টগল বাটন ব্যবহার করুন।</p>
              <p>৪. সবশেষে PDF বা DOCX বাটনে ক্লিক করে আপনার স্টাডি গাইডটি সেভ করে নিন।</p>
            </div>
          </motion.div>
        </div>
      </section>

      {isCameraOpen && (
        <Camera 
          onCapture={(base64) => {
            setSelectedImage(base64);
            setActiveTab('camera');
          }} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
    </div>
  );
}
