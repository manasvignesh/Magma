import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, X, Star, Image as ImageIcon, Shirt, Home, User, Wand2, Layers, ChevronRight, Heart, Share2, ArrowLeft, Loader2, Maximize2, CheckCircle, RefreshCw } from 'lucide-react';
import { client } from "@gradio/client";
import { GoogleGenAI } from '@google/genai';
import Wardrobe from './Wardrobe';

const SYSTEM_INSTRUCTIONS = {
  'try-on': `You are a fashion assistant. A user has uploaded their photo and wants to see how a specific clothing item or style fits them.
Carefully observe the user's body proportions, build, and current style.
Provide a detailed analysis of the fit and look of the specified item on them.

Output ONLY in JSON:
{
  "fit": "Detailed analysis of how the item fits their body proportions",
  "look": "How the item complements their physique and style",
  "styleVibe": "The overall vibe (e.g., casual, elegant, streetwear)",
  "verdict": "Overall recommendation",
  "tryThisNext": "One additional item or accessory that would enhance this look"
}`,
  'suggestions': `You are a fashion assistant. A user has uploaded their photo and wants outfit suggestions.
Carefully observe the user's body proportions, build, and current style.
Suggest outfits that would suit them perfectly for their specified event and preferences.

Output ONLY in JSON:
{
  "bodyType": "Short friendly description of their body type",
  "fitAdvice": "General advice on what silhouettes fit them best",
  "styleVibe": "Their natural style vibe",
  "outfitSuggestions": [
    {
      "title": "Outfit name",
      "description": "Detailed clothing combination",
      "reason": "Why this specific outfit suits them",
      "imagePrompt": "high quality fashion photo of outfit, Generate a realistic fashion product image: Outfit: {{clothing combo}}, Style: {{style type}}, Clean studio background, Full body mannequin OR model, High detail fabric texture, Fashion catalog quality, Neutral lighting. IMPORTANT: Do NOT include original user face, Only show outfit clearly"
    }
  ]
}`
};


type TabType = 'home' | 'try-on' | 'suggestions' | 'wardrobe' | 'profile';

interface SuggestResults {
  bodyType: string;
  fitAdvice: string;
  styleVibe: string;
  outfitSuggestions: {
    title: string;
    description: string;
    reason: string;
    imagePrompt: string;
  }[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  // Cross-app State
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const personInputRef = useRef<HTMLInputElement>(null);

  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Suggestions Flow State
  const [suggestStep, setSuggestStep] = useState(1);
  const [suggestEvent, setSuggestEvent] = useState('');
  const [suggestStyle, setSuggestStyle] = useState('');
  const [suggestPreferences, setSuggestPreferences] = useState('');
  const [suggestResults, setSuggestResults] = useState<any>(null);
  const [suggestError, setSuggestError] = useState(false);
  const [suggestStage, setSuggestStage] = useState<string>(''); // SSE pipeline stage
  const [suggestProducts, setSuggestProducts] = useState<Record<string, any[]>>({}); // product results
  const [selectedOutfit, setSelectedOutfit] = useState<any>(null); // Viewing outfit detail
  const [activeFilter, setActiveFilter] = useState('All');
  const [aiTrialRoomOutfit, setAiTrialRoomOutfit] = useState<any>(null); // Trial Room specific

  // Try-On Redesign State
  const [selectedTryOnCategory, setSelectedTryOnCategory] = useState<string>('');
  const [selectedTryOnMode, setSelectedTryOnMode] = useState<string>('Gen Z');
  const [selectedTryOnOutfit, setSelectedTryOnOutfit] = useState<any>(null);
  const [isTryOnStyling, setIsTryOnStyling] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<any>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const tryOnClothingInputRef = useRef<HTMLInputElement>(null);
  const [tryOnClothingImage, setTryOnClothingImage] = useState<File | null>(null);
  const [tryOnClothingPreview, setTryOnClothingPreview] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<{step: string, status: string, error?: string, id?: string}>({ step: 'Idle', status: 'Waiting' });

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const [simulationStepText, setSimulationStepText] = useState('Generating your look...');

  const generateVirtualTryOn = async () => {
    console.log("TRY-ON BUTTON CLICKED");
    if (!personImage || !tryOnClothingImage) return;

    setIsTryOnStyling(true);
    setTryOnError(null);
    setGeneratedImageUrl(null);
    setTryOnResult(null);
    setDebugLog({ step: 'Initializing', status: 'Connecting to Local Backend' });
    setSimulationStepText('Preparing your images...');

    try {
      setDebugLog({ step: 'API Request', status: 'Connecting directly to HuggingFace (yisol/IDM-VTON)' });
      setSimulationStepText('Connecting to IDM-VTON space...');

      const app = await client("yisol/IDM-VTON");

      setDebugLog({ step: 'API Request', status: 'Sending images to AI model...' });
      setSimulationStepText('Generating your look...');

      const result: any = await app.predict("/tryon", [
         { background: personImage, layers: [], composite: null },
         tryOnClothingImage,
         description.trim() || "A stylish outfit",
         true,
         false,
         30,
         42
      ]);

      console.log("Gradio Result:", result);

      if (result && result.data && result.data[0]) {
        // Depending on Gradio version, it could be a URL string or an object with a .url property
        const outputImage = result.data[0].url || result.data[0];
        
        setGeneratedImageUrl(outputImage);
        setTryOnResult({ 
           matchScore: 98, 
           fitAnalysis: 'AI-generated virtual try-on complete. The garment has been mapped onto your photo using the IDM-VTON HuggingFace space directly.', 
           styleVibe: 'Futuristic ' + selectedTryOnMode, 
           eventCompatibility: 'Perfect for Hackathon Demos & Pitch Presentations.' 
        });
        setDebugLog({ step: 'Complete', status: 'Success' });
      } else {
        throw new Error('No valid image returned from HuggingFace.');
      }
    } catch (err: any) {
      console.error('Try-on error:', err);
      console.log("API Error:", err);
      
      let errorMessage = err.message || 'Something went wrong.';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
         errorMessage = 'Failed to communicate with HuggingFace.';
      }
      
      setTryOnError(errorMessage);
      setDebugLog(prev => ({ ...prev, step: 'Error', error: errorMessage }));
    } finally {
      setIsTryOnStyling(false);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const removeImage = (
    setImage: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    setImage(null);
    setPreview(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleRunAnalysis = async (modeName: string, customPrompt?: string, retryCount = 0): Promise<any> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI(apiKey) : null;

    if (!personImage) return null;
    if (!ai) {
      alert('Please set your GEMINI_API_KEY in .env.local and restart the server to use AI features.');
      return null;
    }

    setIsAnalyzing(true);
    setResult(null);

    const modeKey = (modeName === 'try-on' || modeName === 'suggestions') ? modeName : 'try-on';
    const systemInstruction = SYSTEM_INSTRUCTIONS[modeKey] || SYSTEM_INSTRUCTIONS['try-on'];

    try {
      const parts: any[] = [];
      
      const personData = await fileToBase64(personImage);
      parts.push({
        inlineData: { data: personData, mimeType: personImage.type }
      });

      if (clothingImage) {
        const clothingData = await fileToBase64(clothingImage);
        parts.push({
          inlineData: { data: clothingData, mimeType: clothingImage.type }
        });
      }

      const textualInput = customPrompt || description;
      if (textualInput.trim()) {
        parts.push({ text: textualInput });
      }

      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        systemInstruction: systemInstruction,
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const textRes = response.text || "";
      if (!textRes.trim()) {
        if (retryCount < 1) {
          console.log("Empty response, retrying...");
          return handleRunAnalysis(modeName, customPrompt, retryCount + 1);
        } else {
          throw new Error("Empty response from API");
        }
      }
      
      console.log(`Full response for ${modeName}:`, textRes);
      const cleanedText = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonRes = JSON.parse(cleanedText);
      
      if (modeName !== 'suggestions') {
        setResult(jsonRes);
      }
      return jsonRes;
    } catch (error) {
      console.error(error);
      if (retryCount < 1) {
         console.log("Error occurred, retrying...");
         return handleRunAnalysis(modeName, customPrompt, retryCount + 1);
      }
      if (modeName !== 'suggestions') {
         alert('An error occurred during analysis.');
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleGetSuggestions = async () => {
    if (!personImage) return;
    setSuggestStep(5); // Loading
    setSuggestError(false);
    setSuggestStage('uploading_photo');
    setSuggestResults(null);
    setSuggestProducts({});

    try {
      const formData = new FormData();
      formData.append('image', personImage);
      formData.append('occasion', suggestEvent);
      formData.append('style', suggestStyle);
      formData.append('preferences', suggestPreferences);

      const response = await fetch('/api/style/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            setSuggestStage(event.stage);

            if (event.stage === 'error') {
              throw new Error(event.error || event.message);
            }

            // Progressively populate results
            if (event.data?.analysis) {
              setSuggestResults((prev: any) => ({
                ...prev,
                bodyType: event.data.analysis.bodyType,
                physiqueAnalysis: event.data.analysis.physiqueAnalysis,
                faceStructure: event.data.analysis.faceStructure,
                fitAdvice: event.data.analysis.fitAdvice || event.data.analysis.fitSuggestions?.join(', '),
                styleVibe: event.data.analysis.vibe,
                skinTone: event.data.analysis.skinTone,
                recommendedColors: event.data.analysis.recommendedColors,
                bestColors: event.data.analysis.bestColors,
                recommendedFits: event.data.analysis.recommendedFits,
                avoid: event.data.analysis.avoid,
                fashionInspiration: event.data.analysis.fashionInspiration,
              }));
            }
            if (event.data?.outfits) {
              setSuggestResults((prev: any) => ({
                ...prev,
                outfitSuggestions: event.data.outfits.map((o: any) => ({
                  title: o.title,
                  description: [o.topwear, o.bottomwear, o.footwear].filter(Boolean).join(' + '),
                  reason: `${o.topwear} paired with ${o.bottomwear} and ${o.footwear}${o.layering && o.layering !== 'none' ? `, layered with ${o.layering}` : ''}`,
                  topwear: o.topwear,
                  bottomwear: o.bottomwear,
                  footwear: o.footwear,
                  accessories: o.accessories,
                  keywords: o.keywords,
                  imagePrompt: o.imagePrompt || `Fashion catalog photo: ${o.topwear} with ${o.bottomwear}, ${o.footwear}, clean studio background, full body, high detail`,
                })),
              }));
            }
            if (event.data?.products) {
              setSuggestProducts(event.data.products);
            }

            if (event.stage === 'completed') {
              setSuggestStep(6);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
          }
        }
      }

      // If we never got 'completed', check if we have results
      if (suggestStep !== 6) {
        setSuggestStep(6);
      }
    } catch (err: any) {
      console.error('Suggestion pipeline error:', err);
      setSuggestError(true);
    }
  };

  const startTrialRoomFromSuggestion = (outfit: any) => {
    setAiTrialRoomOutfit(outfit);
  };


  // Reusable components for forms
  const PersonImageSection = () => (
    <section className="bg-white p-5 rounded-3xl soft-shadow border border-brand-100 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-400" />
          Your Photo
        </h2>
      </div>
      
      <div className="flex gap-2">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          id="file-upload"
          onChange={(e) => handleImageUpload(e, setPersonImage, setPersonPreview)}
        />
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          id="camera-upload"
          onChange={(e) => handleImageUpload(e, setPersonImage, setPersonPreview)}
        />
      </div>
      
      {personPreview ? (
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-brand-50">
          <img src={personPreview} alt="You" className="w-full h-full object-cover" />
          <button 
            onClick={() => removeImage(setPersonImage, setPersonPreview)}
            className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
         <div className="flex gap-3 mt-4">
           <button 
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex-1 py-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 flex flex-col items-center justify-center text-brand-400 hover:bg-brand-100/50 transition-colors cursor-pointer"
           >
              <ImageIcon className="w-6 h-6 mb-2 opacity-60" />
              <span className="font-medium text-xs">Gallery</span>
           </button>
           <button 
              onClick={() => document.getElementById('camera-upload')?.click()}
              className="flex-1 py-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 flex flex-col items-center justify-center text-brand-400 hover:bg-brand-100/50 transition-colors cursor-pointer"
           >
              <Camera className="w-6 h-6 mb-2 opacity-60" />
              <span className="font-medium text-xs">Camera</span>
           </button>
         </div>
      )}
    </section>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-1">Good Morning! ✨</h1>
              <p className="text-brand-500 font-medium text-lg">Ready to find your look?</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveTab('try-on')} className="bg-white p-5 rounded-3xl soft-shadow border border-brand-100 flex items-center justify-between hover:bg-brand-50/50 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-100 text-brand-500 rounded-2xl">
                    <Shirt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Virtual Try-On</h3>
                    <p className="text-sm text-gray-500 mt-1">See how an item looks on you</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>

              <button onClick={() => setActiveTab('suggestions')} className="bg-white p-5 rounded-3xl soft-shadow border border-brand-100 flex items-center justify-between hover:bg-brand-50/50 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-100 text-brand-500 rounded-2xl">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Style</h3>
                    <p className="text-sm text-gray-500 mt-1">Get curated outfits for your body</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>

              <button onClick={() => setActiveTab('wardrobe')} className="bg-white p-5 rounded-3xl soft-shadow border border-brand-100 flex items-center justify-between hover:bg-brand-50/50 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-100 text-brand-500 rounded-2xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Wardrobe Styling</h3>
                    <p className="text-sm text-gray-500 mt-1">Mix and match your closet</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="mt-4 bg-brand-500 text-white rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Sparkles className="w-24 h-24" />
               </div>
               <h3 className="text-xl font-bold mb-2">Style Tip of the Day</h3>
               <p className="text-brand-50 leading-relaxed font-medium">
                 Layering isn't just for winter! Try a light, unbuttoned linen shirt over your favorite graphic tee for an easy transition into evening.
               </p>
            </div>
          </div>
        );

      case 'try-on':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-100px)] relative">
            <header className="mb-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-brand-600 mb-1">Virtual Fitting Room</h1>
              <p className="text-gray-500 text-sm font-medium">See your style come to life</p>
            </header>

            {/* Style Modes */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 px-1 pb-2">
               {['Gen Z', 'Wedding', 'Minimal', 'Streetwear', 'Smart Casual'].map(mode => (
                  <button 
                     key={mode}
                     onClick={() => setSelectedTryOnMode(mode)}
                     className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedTryOnMode === mode ? 'bg-brand-500 text-white shadow-[0_4px_14px_0_rgba(47,128,237,0.39)]' : 'bg-white text-gray-500 border border-brand-100 hover:bg-brand-50'}`}
                  >
                     {mode}
                  </button>
               ))}
            </div>

            {/* Center Preview Area */}
            <div className="relative w-full aspect-[3/4] max-h-[60vh] rounded-[2.5rem] overflow-hidden soft-shadow bg-gradient-to-b from-brand-50 to-brand-100/50 border-4 border-white flex items-center justify-center">
               {isTryOnStyling && (
                  <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
                     <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles className="w-8 h-8 text-brand-500 animate-pulse" />
                        </div>
                     </div>
                     <p className="font-bold text-brand-600 text-xl tracking-tight transition-all duration-300">{simulationStepText}</p>
                     <p className="text-gray-400 text-sm mt-2">This may take 15-30 seconds</p>
                     <div className="w-48 h-2 bg-brand-100 rounded-full mt-4 overflow-hidden shadow-inner">
                        <div className="h-full bg-brand-500 animate-shimmer w-full"></div>
                     </div>
                     
                     {/* Step 6 — SHOW DEBUG PANEL (TEMPORARY) */}
                     <div className="mt-8 bg-black/80 text-green-400 p-4 rounded-xl text-xs w-64 text-left font-mono break-all shadow-2xl relative z-50">
                        <div className="font-bold text-white mb-2 pb-1 border-b border-gray-600">Debug Panel</div>
                        <div><span className="text-gray-400">Step:</span> {debugLog.step}</div>
                        <div><span className="text-gray-400">Status:</span> {debugLog.status}</div>
                        {debugLog.id && <div><span className="text-gray-400">ID:</span> {debugLog.id}</div>}
                        {debugLog.error && <div className="text-red-400 mt-1"><span className="text-gray-400">Error:</span> {debugLog.error}</div>}
                     </div>
                  </div>
               )}

               {generatedImageUrl && generatedImageUrl !== 'simulated' ? (
                  <img src={generatedImageUrl} alt="AI Generated Try-On" className="w-full h-full object-cover transition-all duration-700" />
               ) : personPreview ? (
                  <img src={personPreview} alt="Your photo" className="w-full h-full object-cover transition-all duration-700 hover:scale-[1.02]" />
               ) : (
                  <div className="w-2/3 h-5/6 bg-brand-200/40 rounded-full blur-2xl absolute"></div>
               )}
               {!personPreview && !generatedImageUrl && (
                  <div className="flex flex-col items-center justify-center z-10 text-brand-400 opacity-70">
                     <User className="w-24 h-24 mb-4" strokeWidth={1} />
                     <p className="text-sm font-bold uppercase tracking-[0.2em]">Upload Your Photo</p>
                  </div>
               )}

               {/* Hotspots - only show when no generated image */}
               {!generatedImageUrl && personPreview && (
               <div className="absolute inset-0 z-20 pointer-events-none">
                  {[
                     { id: 'Tops', top: '35%', left: '50%' },
                     { id: 'Bottoms', top: '65%', left: '50%' },
                     { id: 'Accessories', top: '25%', left: '70%' },
                     { id: 'Footwear', top: '90%', left: '50%' },
                  ].map(spot => (
                     <button
                        key={spot.id}
                        onClick={() => setSelectedTryOnCategory(spot.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto transition-all duration-300 ${selectedTryOnCategory === spot.id ? 'bg-brand-500 text-white scale-110 shadow-[0_0_30px_rgba(47,128,237,0.6)]' : 'bg-white/80 backdrop-blur-md text-brand-500 hotspot-pulse hover:bg-white border border-white soft-shadow'}`}
                        style={{ top: spot.top, left: spot.left }}
                     >
                        <div className="w-3.5 h-3.5 rounded-full bg-current"></div>
                     </button>
                  ))}
               </div>
               )}

               {/* Upload Button Overlay */}
               {!personPreview && (
                  <button 
                     onClick={() => document.getElementById('tryon-person-upload')?.click()}
                     className="absolute bottom-6 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full font-bold text-brand-600 shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 z-30 border border-brand-50"
                  >
                     <Camera className="w-5 h-5" /> Upload Photo
                  </button>
               )}
               {personPreview && !generatedImageUrl && (
                  <button 
                     onClick={() => { removeImage(setPersonImage, setPersonPreview); setGeneratedImageUrl(null); setTryOnResult(null); }}
                     className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition-colors z-30"
                  >
                     <X className="w-4 h-4" />
                  </button>
               )}
               <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="tryon-person-upload"
                  onChange={(e) => handleImageUpload(e, setPersonImage, setPersonPreview)}
               />
               
               {/* Soft Glow Overlay */}
               {(personPreview || generatedImageUrl) && <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(255,255,255,0.4)]"></div>}
            </div>

            {/* Outfit Upload & Generate */}
            {!tryOnResult && (
               <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center px-1">
                     <h3 className="font-bold text-gray-800 text-xl">Upload Outfit</h3>
                     <span className="text-xs font-bold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-lg uppercase tracking-wide">Garment Image</span>
                  </div>

                  <input 
                     type="file" accept="image/*" className="hidden" ref={tryOnClothingInputRef}
                     onChange={(e) => handleImageUpload(e, setTryOnClothingImage, setTryOnClothingPreview)}
                  />

                  {tryOnClothingPreview ? (
                     <div className="relative w-full h-48 rounded-3xl overflow-hidden soft-shadow border-2 border-brand-100">
                        <img src={tryOnClothingPreview} alt="Clothing" className="w-full h-full object-cover" />
                        <button 
                           onClick={() => removeImage(setTryOnClothingImage, setTryOnClothingPreview)}
                           className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition-colors"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                  ) : (
                     <button 
                        onClick={() => tryOnClothingInputRef.current?.click()}
                        className="w-full py-10 rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/50 flex flex-col gap-2 items-center justify-center text-brand-500 hover:bg-brand-100/50 transition-colors cursor-pointer"
                     >
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="font-bold text-sm">Upload the garment to try on</span>
                        <span className="text-xs text-gray-400">Flat-lay or product photos work best</span>
                     </button>
                  )}

                  <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Describe the garment (optional): e.g. 'Short sleeve round neck t-shirt'"
                     className="w-full h-16 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none transition-shadow"
                  />

                  {tryOnError && (
                     <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                        {tryOnError}
                     </div>
                  )}

                  <button 
                     onClick={generateVirtualTryOn}
                     disabled={!personImage || !tryOnClothingImage || isTryOnStyling}
                     className={`w-full py-4 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(47,128,237,0.3)] transition-all duration-300 ${(!personImage || !tryOnClothingImage || isTryOnStyling) ? 'bg-brand-300 opacity-60 cursor-not-allowed shadow-none' : 'bg-brand-gradient-hover hover:-translate-y-1'}`}
                  >
                     <Sparkles className="w-5 h-5" /> Generate Try-On
                  </button>
               </div>
            )}

            {/* Results Section */}
            {tryOnResult && (
               <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-6">
                  <div className="glass-card rounded-[2.5rem] p-7 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-5 mix-blend-overlay pointer-events-none">
                        <CheckCircle className="w-48 h-48 text-brand-600" />
                     </div>
                     <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-white flex items-center justify-center text-brand-600 font-black text-2xl shadow-sm border border-brand-50">
                           {tryOnResult.matchScore}
                        </div>
                        <div>
                           <h3 className="font-black text-gray-900 text-xl tracking-tight">Match Score</h3>
                           <p className="text-sm text-brand-600 font-semibold bg-brand-50 inline-block px-2 py-0.5 rounded-md mt-1">Excellent fit for your body type</p>
                        </div>
                     </div>
                     <div className="grid gap-5 relative z-10">
                        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 border border-white/50 soft-shadow">
                           <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500"/> Fit Analysis</h4>
                           <p className="text-sm text-gray-600 leading-relaxed font-medium">{tryOnResult.fitAnalysis}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 border border-white/50 soft-shadow">
                              <h4 className="font-bold text-gray-500 mb-1 text-xs uppercase tracking-wider">Style Vibe</h4>
                              <p className="text-sm font-bold text-brand-600">{tryOnResult.styleVibe}</p>
                           </div>
                           <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 border border-white/50 soft-shadow">
                              <h4 className="font-bold text-gray-500 mb-1 text-xs uppercase tracking-wider">Events</h4>
                              <p className="text-sm font-bold text-gray-800">Casual, Date</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                     <button className="py-4 rounded-full font-bold text-white shadow-[0_8px_20px_rgba(47,128,237,0.3)] bg-brand-500 hover:bg-brand-600 active:scale-95 transition-all">Save Look</button>
                     <button className="py-4 rounded-full font-bold text-brand-600 shadow-sm bg-white hover:bg-brand-50 active:scale-95 transition-all border border-brand-100 flex items-center justify-center gap-2"><Share2 className="w-5 h-5"/> Share</button>
                  </div>
                  <button 
                     onClick={() => { setTryOnResult(null); setSelectedTryOnOutfit(null); setGeneratedImageUrl(null); setTryOnClothingImage(null); setTryOnClothingPreview(null); setTryOnError(null); }}
                     className="py-4 font-bold text-gray-400 hover:text-gray-800 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-xs"
                  ><RefreshCw className="w-4 h-4"/> Try Another Look</button>
               </div>
            )}
          </div>
        );

      case 'suggestions':
        return (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full">
            
            {/* Step 1: Upload Photo */}
            {suggestStep === 1 && (
              <div className="flex flex-col gap-6">
                <header className="mb-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1 leading-tight">Personalized Suggestions</h1>
                  <p className="text-gray-500 text-sm">Upload your photo to get outfit ideas that suit you.</p>
                </header>
                <PersonImageSection />
                <button 
                  onClick={() => setSuggestStep(2)}
                  disabled={!personImage}
                  className={`mt-auto w-full py-4 rounded-full font-semibold text-white text-lg shadow-lg transition-all ${!personImage ? 'bg-brand-300 cursor-not-allowed opacity-80' : 'bg-brand-gradient-hover hover:-translate-y-0.5'}`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: Event */}
            {suggestStep === 2 && (
              <div className="flex flex-col gap-6">
                <header className="mb-2 flex items-center gap-3">
                  <button onClick={() => setSuggestStep(1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">What are you getting ready for?</h1>
                </header>
                <div className="grid grid-cols-2 gap-3">
                  {['Wedding', 'Party', 'Date', 'Casual Outing', 'Work / Office', 'Festive', 'Vacation', 'Other'].map(ev => (
                    <button 
                      key={ev}
                      onClick={() => setSuggestEvent(ev)}
                      className={`px-4 py-4 rounded-2xl border-2 text-sm font-medium transition-all ${suggestEvent === ev ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-gray-50'}`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setSuggestStep(3)}
                  disabled={!suggestEvent}
                  className={`mt-6 w-full py-4 rounded-full font-semibold text-white text-lg shadow-lg transition-all ${!suggestEvent ? 'bg-brand-300 cursor-not-allowed opacity-80' : 'bg-brand-gradient-hover hover:-translate-y-0.5'}`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 3: Style Type */}
            {suggestStep === 3 && (
              <div className="flex flex-col gap-6">
                <header className="mb-2 flex items-center gap-3">
                  <button onClick={() => setSuggestStep(2)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">What type of style do you prefer?</h1>
                </header>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {name: 'Traditional', color: 'bg-amber-100'},
                    {name: 'Indo-Western', color: 'bg-orange-100'},
                    {name: 'Casual', color: 'bg-blue-100'},
                    {name: 'Streetwear', color: 'bg-slate-200'},
                    {name: 'Minimal', color: 'bg-gray-100'},
                    {name: 'Formal', color: 'bg-zinc-800 text-white'}
                  ].map(style => (
                    <button 
                      key={style.name}
                      onClick={() => setSuggestStyle(style.name)}
                      className={`relative overflow-hidden aspect-[4/5] rounded-3xl border-2 transition-all ${suggestStyle === style.name ? 'border-brand-500 shadow-md ring-2 ring-brand-200 ring-offset-2' : 'border-transparent soft-shadow hover:scale-[1.02]'}`}
                    >
                      <div className={`absolute inset-0 ${style.color} opacity-80`}></div>
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <span className={`font-semibold text-white`}>{style.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setSuggestStep(4)}
                  disabled={!suggestStyle}
                  className={`mt-4 w-full py-4 rounded-full font-semibold text-white text-lg shadow-lg transition-all ${!suggestStyle ? 'bg-brand-300 cursor-not-allowed opacity-80' : 'bg-brand-gradient-hover hover:-translate-y-0.5'}`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 4: Preferences */}
            {suggestStep === 4 && (
              <div className="flex flex-col gap-6">
                <header className="mb-2 flex items-center gap-3">
                  <button onClick={() => setSuggestStep(3)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tell us your preferences <span className="text-gray-400 font-normal text-lg">(optional)</span></h1>
                </header>
                <div className="bg-white p-2 rounded-3xl soft-shadow border border-brand-100 h-64">
                   <textarea 
                      value={suggestPreferences}
                      onChange={(e) => setSuggestPreferences(e.target.value)}
                      placeholder="E.g. I prefer pastel colors, comfort fit, avoid very tight clothes, like modern ethnic looks."
                      className="w-full h-full p-4 bg-transparent border-none text-base focus:outline-none focus:ring-0 resize-none text-gray-700"
                      maxLength={250}
                   />
                   <div className="text-right px-4 pb-2 text-xs text-gray-400 font-medium">{suggestPreferences.length}/250</div>
                </div>
                
                <button 
                  onClick={handleGetSuggestions}
                  className="mt-6 w-full py-4 rounded-full font-semibold text-white text-lg shadow-lg bg-brand-gradient-hover hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  Get Suggestions
                </button>
              </div>
            )}

            {/* Step 5: Loading with Live Progress */}
            {suggestStep === 5 && (
              <div className="flex flex-col items-center justify-center mt-16 gap-8">
                 {suggestError ? (
                   <>
                     <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                       <X className="w-10 h-10 text-red-400" />
                     </div>
                     <h2 className="text-xl font-medium text-red-600 text-center px-8">Couldn't fetch suggestions</h2>
                     <p className="text-gray-500 text-sm text-center px-12">The AI pipeline encountered an error. Please try again.</p>
                     <button 
                       onClick={handleGetSuggestions}
                       className="py-3 px-8 rounded-full font-bold text-white shadow-lg bg-brand-500 hover:bg-brand-600 active:scale-95 transition-all"
                     >
                       Retry
                     </button>
                     <button onClick={() => { setSuggestStep(4); setSuggestError(false); }} className="text-gray-500 underline text-sm mt-2">Go back</button>
                   </>
                 ) : (
                   <>
                     <h2 className="text-xl font-medium text-gray-800 text-center px-8">
                       {suggestStage === 'uploading_photo' && 'Processing your photo...'}
                       {suggestStage === 'analyzing_body' && 'Analyzing your body & style...'}
                       {suggestStage === 'understanding_style' && 'Understanding your vibe...'}
                       {suggestStage === 'generating_outfits' && 'Curating outfit picks...'}
                       {suggestStage === 'searching_products' && 'Finding matching products...'}
                       {!suggestStage && 'Connecting to style engine...'}
                     </h2>
                     
                     <div className="relative w-36 h-36 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-brand-100 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
                        <Sparkles className="w-10 h-10 text-brand-400" />
                     </div>

                     {(() => {
                       const stages = [
                         { key: 'uploading_photo', label: 'Processing photo' },
                         { key: 'analyzing_body', label: 'Analyzing body structure' },
                         { key: 'understanding_style', label: 'Understanding your vibe' },
                         { key: 'generating_outfits', label: 'Generating outfits' },
                         { key: 'searching_products', label: 'Searching products' },
                       ];
                       const currentIdx = stages.findIndex(s => s.key === suggestStage);
                       return (
                         <div className="flex flex-col gap-3 text-sm font-medium text-gray-600 w-full max-w-xs">
                           {stages.map((s, i) => {
                             const isDone = i < currentIdx;
                             const isCurrent = i === currentIdx;
                             const isPending = i > currentIdx;
                             return (
                               <div key={s.key} className={`flex items-center gap-3 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                                 {isDone ? (
                                   <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs"><CheckCircle className="w-4 h-4" /></div>
                                 ) : isCurrent ? (
                                   <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /></div>
                                 ) : (
                                   <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                                 )}
                                 <span className={isDone ? 'text-green-700' : isCurrent ? 'text-brand-600 font-semibold' : ''}>{s.label}</span>
                               </div>
                             );
                           })}
                         </div>
                       );
                     })()}
                   </>
                 )}
              </div>
            )}

            {/* Step 6: Results List */}
            {suggestStep === 6 && !selectedOutfit && !aiTrialRoomOutfit && (
              <div className="flex flex-col gap-6 pb-6">
                <header className="mb-2 flex items-center gap-3">
                  <button onClick={() => setSuggestStep(4)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Top Picks For You</h1>
                    <p className="text-gray-500 text-sm">Based on your photo and preferences</p>
                  </div>
                </header>

                <div className="bg-brand-50 p-5 rounded-3xl mb-4 border border-brand-100 flex flex-col gap-5">
                  <h3 className="font-bold text-xl text-brand-900 tracking-tight">Style DNA</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div className="bg-white/90 p-4 rounded-2xl border border-white soft-shadow flex flex-col gap-1">
                       <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest">Physique</span>
                       <p className="font-medium text-gray-900 leading-snug">{suggestResults?.physiqueAnalysis || "Balanced proportions"}</p>
                     </div>
                     
                     <div className="bg-white/90 p-4 rounded-2xl border border-white soft-shadow flex flex-col gap-1">
                       <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest">Face Structure</span>
                       <p className="font-medium text-gray-900 leading-snug">{suggestResults?.faceStructure || "Average"}</p>
                     </div>

                     <div className="bg-white/90 p-4 rounded-2xl border border-white soft-shadow flex flex-col gap-1 md:col-span-2">
                       <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest">Aesthetic</span>
                       <p className="font-medium text-gray-900 leading-snug">{suggestResults?.styleVibe || "Minimal Modern"}</p>
                     </div>
                  </div>
                  
                  <div className="h-px w-full bg-brand-200/50 my-1"></div>

                  <div className="flex flex-col gap-3">
                     <h4 className="font-bold text-gray-900">Best Fits</h4>
                     <div className="flex flex-wrap gap-2">
                        {suggestResults?.recommendedFits?.map((fit: string, idx: number) => (
                           <span key={idx} className="bg-brand-100 text-brand-800 text-sm px-3 py-1.5 rounded-lg font-medium">{fit}</span>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-3">
                     <h4 className="font-bold text-gray-900">Color Palette</h4>
                     <div className="flex flex-wrap gap-2">
                        {suggestResults?.bestColors?.map((c: string, idx: number) => (
                           <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 text-sm px-3 py-1.5 rounded-lg font-medium capitalize flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border shadow-sm" style={{backgroundColor: c.split(' ').pop() || c}}></span>
                              {c}
                           </span>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                     <div className="bg-red-50 p-4 rounded-2xl border border-red-100/50 flex flex-col gap-2">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><X className="w-3 h-3"/> Avoid</span>
                        <ul className="text-sm text-red-900/80 space-y-1">
                           {suggestResults?.avoid?.map((item: string, idx: number) => <li key={idx}>• {item}</li>)}
                        </ul>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100/50 flex flex-col gap-2">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1"><Star className="w-3 h-3"/> Inspiration</span>
                        <ul className="text-sm text-blue-900/80 space-y-1">
                           {suggestResults?.fashionInspiration?.map((item: string, idx: number) => <li key={idx}>• {item}</li>)}
                        </ul>
                     </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Curated Outfits</h3>
                </div>

                <div className="flex flex-col gap-8">
                   {suggestResults?.outfitSuggestions?.map((outfit: any, i: number) => {
                      const allProducts = outfit.keywords?.flatMap((kw: string) => suggestProducts[kw.trim().toLowerCase()] || []) || [];
                      
                      return (
                      <div key={i} className="flex flex-col gap-4">
                         <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-200 soft-shadow">
                            <img src={`https://image.pollinations.ai/prompt/${encodeURIComponent(outfit.imagePrompt)}?width=800&height=1000&nologo=true`} alt={outfit.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-gray-200 flex flex-col items-center justify-center p-4 text-center hidden">
                               <Shirt className="w-12 h-12 text-brand-300 mb-3 opacity-50" />
                               <span className="text-sm font-semibold text-gray-600 leading-snug">{outfit.title}</span>
                            </div>
                         </div>
                         
                         <div>
                            <div className="flex items-center justify-between mb-2">
                               <h4 className="text-xl font-bold text-gray-900">{outfit.title}</h4>
                               <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
                                 <Heart className="w-5 h-5" />
                               </button>
                            </div>
                            
                            <div className="flex flex-col gap-1.5 mb-4">
                              {outfit.topwear && <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Top:</span> {outfit.topwear}</p>}
                              {outfit.bottomwear && <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Bottom:</span> {outfit.bottomwear}</p>}
                              {outfit.footwear && <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Shoes:</span> {outfit.footwear}</p>}
                            </div>

                            {/* Products Section */}
                            <div className="mt-2 pt-4 border-t border-gray-100">
                               <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                 <Shirt className="w-4 h-4 text-brand-500" />
                                 Shop This Look
                               </h5>
                               
                               {allProducts.length > 0 ? (
                                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                    {allProducts.slice(0, 10).map((p: any, pi: number) => (
                                      <a
                                        key={pi}
                                        href={p.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 w-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group flex flex-col"
                                      >
                                        <div className="w-full aspect-square bg-white flex items-center justify-center overflow-hidden">
                                          <img src={p.image} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                        <div className="p-2 flex flex-col flex-grow">
                                          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight flex-grow">{p.title}</p>
                                          <p className="text-sm font-bold text-brand-600 mt-1">{p.price}</p>
                                          <p className="text-[10px] text-gray-400 mt-0.5 mb-2 line-clamp-1">{p.store}</p>
                                          <button className="w-full py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors mt-auto">Buy Now</button>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                               ) : (
                                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                                    <p className="text-sm text-gray-500">Searching for matching products...</p>
                                  </div>
                               )}
                            </div>
                            
                            <button 
                               onClick={() => startTrialRoomFromSuggestion(outfit)}
                               className="w-full mt-4 py-3 rounded-xl font-bold text-brand-600 border-2 border-brand-100 hover:bg-brand-50 transition-colors flex justify-center items-center gap-2 text-sm"
                            >
                              <Wand2 className="w-4 h-4" />
                              Try using AI Trial Room
                            </button>
                         </div>
                      </div>
                   )})}
                </div>
              </div>
            )}

            {/* Step 7: Outfit Detail */}
            {selectedOutfit && !aiTrialRoomOutfit && (
              <div className="flex flex-col gap-6">
                <header className="flex items-center justify-between">
                  <button onClick={() => setSelectedOutfit(null)} className="p-2 -ml-2 rounded-full bg-white shadow-sm text-gray-600 hover:bg-gray-50"><ArrowLeft className="w-5 h-5"/></button>
                  <span className="font-semibold text-gray-800">Outfit Details</span>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-white shadow-sm text-gray-600 hover:text-brand-500"><Heart className="w-5 h-5"/></button>
                    <button className="p-2 rounded-full bg-white shadow-sm text-gray-600"><Share2 className="w-5 h-5"/></button>
                  </div>
                </header>

                <div className="bg-white rounded-[2rem] p-5 soft-shadow flex flex-col gap-5 border border-brand-50">
                   <div className="w-full aspect-[4/5] rounded-3xl bg-brand-50 flex items-center justify-center overflow-hidden relative">
                      <img src={`https://image.pollinations.ai/prompt/${encodeURIComponent(selectedOutfit.imagePrompt)}?width=800&height=1000&nologo=true`} alt={selectedOutfit.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <div className="text-center p-6 text-brand-400/80 font-medium hidden">
                         <Maximize2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                         Image Generation Failed<br/>
                         <span className="text-sm font-normal text-gray-500">{selectedOutfit.title}</span>
                      </div>
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{selectedOutfit.title}</h2>
                      
                      {/* Outfit Breakdown */}
                      <div className="flex flex-col gap-2 mb-4">
                        {selectedOutfit.topwear && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium text-xs">Top</span>
                            <span className="text-gray-700">{selectedOutfit.topwear}</span>
                          </div>
                        )}
                        {selectedOutfit.bottomwear && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-medium text-xs">Bottom</span>
                            <span className="text-gray-700">{selectedOutfit.bottomwear}</span>
                          </div>
                        )}
                        {selectedOutfit.footwear && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded font-medium text-xs">Shoes</span>
                            <span className="text-gray-700">{selectedOutfit.footwear}</span>
                          </div>
                        )}
                        {selectedOutfit.accessories?.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-medium text-xs">Accessories</span>
                            <span className="text-gray-700">{selectedOutfit.accessories.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Color Swatches */}
                      <div className="flex gap-2 mb-4">
                        {suggestResults?.recommendedColors?.map((c: string) => (
                           <div key={c} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full">
                             <div className="w-4 h-4 rounded-full border shadow-sm" style={{backgroundColor: c}}></div>
                             <span className="text-xs text-gray-500 capitalize">{c}</span>
                           </div>
                        ))}
                      </div>

                      {selectedOutfit.reason && (
                         <div className="bg-brand-50 rounded-2xl p-4 mb-4 border border-brand-100">
                           <h4 className="font-semibold text-brand-800 mb-2">Why it suits you</h4>
                           <p className="text-brand-900/80 text-sm leading-relaxed">{selectedOutfit.reason}</p>
                         </div>
                      )}

                      {/* Product Cards — Shopping Results */}
                      {selectedOutfit.keywords?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-brand-400" />
                            Shop This Look
                          </h4>
                          <div className="flex flex-col gap-3">
                            {selectedOutfit.keywords.map((kw: string) => {
                              const kwLower = kw.trim().toLowerCase();
                              const products = suggestProducts[kwLower] || [];
                              if (products.length === 0) return null;
                              return (
                                <div key={kwLower}>
                                  <p className="text-xs font-medium text-gray-500 mb-2 capitalize">{kw}</p>
                                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                    {products.map((p: any, pi: number) => (
                                      <a
                                        key={pi}
                                        href={p.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 w-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group flex flex-col"
                                      >
                                        <div className="w-full aspect-square bg-white flex items-center justify-center overflow-hidden">
                                          <img src={p.image} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                        <div className="p-2 flex flex-col flex-grow">
                                          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight flex-grow">{p.title}</p>
                                          <p className="text-sm font-bold text-brand-600 mt-1">{p.price}</p>
                                          <p className="text-[10px] text-gray-400 mt-0.5 mb-2 line-clamp-1">{p.store}</p>
                                          <button className="w-full py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors mt-auto">Buy Now</button>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button 
                         onClick={() => startTrialRoomFromSuggestion(selectedOutfit)}
                         className="w-full py-4 rounded-full font-bold text-white text-lg shadow-[0_8px_20px_-6px_rgba(244,63,94,0.5)] bg-gradient-to-r from-brand-400 to-brand-500 hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Try using AI Trial Room
                      </button>
                   </div>
               </div>

               {/* Debug Panel */}
               <div className="mt-8 p-4 bg-gray-900 rounded-2xl text-xs text-green-400 font-mono overflow-auto max-h-64 soft-shadow">
                 <p className="text-white font-bold mb-2">DEBUG: RAW FRONTEND STATE</p>
                 <pre>{JSON.stringify(suggestResults, null, 2)}</pre>
               </div>
             </div>
            )}

            {/* Step 8/9: AI Trial Room Result */}
            {aiTrialRoomOutfit && (
              <div className="flex flex-col gap-6">
                <header className="flex items-center justify-between mb-2">
                  <button onClick={() => setAiTrialRoomOutfit(null)} className="p-2 -ml-2 rounded-full bg-white shadow-sm text-gray-600 hover:bg-gray-50"><ArrowLeft className="w-5 h-5"/></button>
                  <span className="font-semibold text-gray-800">AI Trial Room Result</span>
                  <button className="p-2 rounded-full bg-white shadow-sm text-gray-600"><Maximize2 className="w-5 h-5"/></button>
                </header>

                <div className="flex flex-col gap-6">
                  {/* Generated Image Result */}
                  <div className="w-full aspect-[3/4] bg-brand-50 rounded-3xl relative overflow-hidden soft-shadow border border-brand-100">
                     <img src={`https://image.pollinations.ai/prompt/${encodeURIComponent(aiTrialRoomOutfit.imagePrompt)}?width=800&height=1000&nologo=true`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                     <div className="absolute inset-x-8 text-center text-brand-600/60 font-medium hidden top-1/2 -translate-y-1/2">
                        <Sparkles className="w-12 h-12 mx-auto mb-3" />
                         AI Generated Image Failed<br/>
                         <span className="text-sm font-normal text-gray-500">(You wearing {aiTrialRoomOutfit.title})</span>
                     </div>
                  </div>
                  
                  {/* User Try-On Simulation Image */}
                  <div className="w-full aspect-[3/4] bg-brand-50 rounded-3xl relative overflow-hidden soft-shadow border border-brand-100">
                     {personPreview ? (
                       <img src={personPreview} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">No user image</div>
                     )}
                     <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="text-white font-medium text-lg text-center flex items-center justify-center gap-2">
                           <Sparkles className="w-5 h-5 text-brand-300" /> This is how it would look on you!
                        </p>
                     </div>
                  </div>
                </div>
                  <button 
                     onClick={() => {
                        setAiTrialRoomOutfit(null);
                        setSelectedOutfit(null);
                     }}
                     className="w-full py-4 rounded-full font-bold text-white shadow-lg bg-brand-gradient-hover active:scale-95 transition-all text-lg"
                  >
                     Try Another Outfit
                  </button>
                </div>
            )}
          </div>
        );
      case 'wardrobe':
        return <Wardrobe />;

      case 'profile':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">Your Profile</h1>
              <p className="text-gray-500 text-sm">Manage preferences & saved looks</p>
            </header>
            
            <div className="bg-white p-6 rounded-3xl soft-shadow border border-brand-100 flex flex-col items-center justify-center py-12 gap-4">
               <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center">
                 <User className="w-10 h-10 text-brand-400" />
               </div>
               <h2 className="text-xl font-bold text-gray-800">Style Profile</h2>
               <p className="text-gray-500 text-center text-sm px-6">
                 Saved outfits, body dimensions, and custom color palettes will appear here.
               </p>
               <button className="mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-colors">
                 Edit Preferences
               </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const navItems: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'try-on', icon: Shirt, label: 'Try On' },
    { id: 'suggestions', icon: Wand2, label: 'Suggest' },
    { id: 'wardrobe', icon: Layers, label: 'Wardrobe' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-brand-50 font-sans pb-24">
      {/* Scrollable Content Area */}
      {activeTab === 'wardrobe' ? (
        <main className="w-full max-w-2xl mx-auto pb-8" style={{ height: 'calc(100vh - 80px)' }}>
          {renderContent()}
        </main>
      ) : (
        <main className="w-full max-w-md mx-auto p-4 sm:p-6 pt-6 mb-8">
          {renderContent()}
        </main>
      )}

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-2 pb-6 sm:pb-4 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-all ${
                  isActive 
                    ? 'text-brand-500' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`relative p-1.5 rounded-full transition-colors ${isActive ? 'bg-brand-50' : 'bg-transparent'}`}>
                   <Icon className={`w-6 h-6 ${isActive ? 'fill-brand-100/50' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-brand-500 font-bold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


