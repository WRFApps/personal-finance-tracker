import React, { useState, ChangeEvent, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { AppContext } from '../App.tsx';
import { ScannedReceiptData, TransactionType } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

// Declare Tesseract if using CDN directly without types package
declare var Tesseract: any;

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose }) => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ScannedReceiptData>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Tesseract processing
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatus, setOcrStatus] = useState<string>('');

  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false); // Gemini processing
  const [aiError, setAiError] = useState<string | null>(null);

  const API_KEY = process.env.API_KEY;
  let ai: GoogleGenAI | null = null;
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } else {
    console.warn("Gemini API Key not found. AI OCR enhancement will be disabled.");
  }


  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setSelectedImage(null);
      setImageFile(null);
      setRawText('');
      setParsedData({});
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatus('');
      setIsAiProcessing(false);
      setAiError(null);
    }
  }, [isOpen]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setRawText(''); 
      setParsedData({});
      setAiError(null);
    }
  };

  const parseOcrText = (text: string): ScannedReceiptData => {
    const data: ScannedReceiptData = { rawText: text };
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const dateRegex = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b[a-z]*[\s,.]+\d{1,2}(?:st|nd|rd|th)?(?:[\s,.]+\d{2,4})?)/i;
    for (const line of lines) {
        const dateMatch = line.match(dateRegex);
        if (dateMatch && dateMatch[0]) {
            try {
                let parsedDate = new Date(dateMatch[0].replace(/\.$/, '')); 
                if (!isNaN(parsedDate.getTime())) {
                    data.date = parsedDate.toISOString().split('T')[0]; 
                    break; 
                }
            } catch (e) { /* ignore */ }
        }
    }
    
    const amountRegex = /(?:total|amount due|subtotal|payment|cash|credit)\s*:?\s*[$€£¥රු]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))|\b[$€£¥රු]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\b/i;
    let potentialAmounts: number[] = [];
    for (const line of lines) {
        const amountMatch = line.match(amountRegex);
        if (amountMatch) {
            const amountStr = (amountMatch[1] || amountMatch[2])?.replace(/,/g, ''); 
            if (amountStr) {
                 const numericAmount = parseFloat(amountStr);
                 if (!isNaN(numericAmount)) potentialAmounts.push(numericAmount);
            }
        }
    }
    if (potentialAmounts.length > 0) {
      data.amount = Math.max(...potentialAmounts).toFixed(2);
    }

    if (lines.length > 0) {
        let merchantCandidate = lines[0]; 
        const commonBusinessTerms = ['ltd', 'inc', 'llc', 'store', 'shop', 'market', 'pharmacy', 'restaurant', 'cafe', 'supermarket', 'foods', 'corner'];
        for (let i = 0; i < Math.min(lines.length, 5); i++) { 
            const lineLower = lines[i].toLowerCase();
            if (commonBusinessTerms.some(term => lineLower.includes(term))) {
                 merchantCandidate = lines[i];
                 break;
            }
            if (!/\d/.test(lines[i]) && lines[i].length > 3 && lines[i].length < 50 && lines[i].split(' ').length < 7) {
                merchantCandidate = lines[i];
                if (i > 0 && merchantCandidate.length > lines[0].length) merchantCandidate = lines[0];
                break;
            }
        }
        const artifacts = ["receipt", "invoice", "tax invoice", "cash sale", "thank you"];
        if (artifacts.some(art => merchantCandidate.toLowerCase().includes(art))) {
            if(lines.length > 1 && !artifacts.some(art => lines[1].toLowerCase().includes(art))) merchantCandidate = lines[1];
            else merchantCandidate = ""; 
        }
        data.merchant = merchantCandidate.replace(/[*#_~]+/g, '').trim(); 
    }
    return data;
  };

  const handleProcessReceipt = async () => {
    if (!imageFile) {
      context?.notifyError('Please select an image first.');
      return;
    }
    setIsProcessing(true);
    setRawText('');
    setParsedData({});
    setOcrProgress(0);
    setOcrStatus('Initializing OCR...');
    setAiError(null);

    try {
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'eng', 
        {
          logger: m => { 
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
            setOcrStatus(m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...');
          }
        }
      );
      setRawText(text);
      setParsedData(parseOcrText(text));
      context?.notifySuccess('Receipt processed with Tesseract OCR!');
    } catch (error) {
      console.error('OCR Error:', error);
      context?.notifyError('Failed to process receipt with Tesseract. Please try again or use a clearer image.');
      setRawText('Error during Tesseract OCR processing.');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatus('');
    }
  };

  const handleEnhanceWithAi = async () => {
    if (!rawText) {
        context?.notifyWarning("Please process the receipt with standard OCR first to get raw text.");
        return;
    }
    if (!ai) {
        context?.notifyError("Gemini AI client is not initialized. API Key might be missing.");
        setAiError("AI client not initialized.");
        return;
    }
    setIsAiProcessing(true);
    setAiError(null);
    context?.notifyInfo("Enhancing with AI... This may take a moment.");

    const prompt = `From the following OCR text of a receipt, extract the merchant name, the transaction date, and the total amount.
- For the merchant, find the most likely store or company name.
- For the date, identify any date and format it as YYYY-MM-DD.
- For the amount, prioritize the value labeled as 'total', 'grand total', or 'amount due'. If not found, use the largest numerical value on the receipt.

--- OCR TEXT ---
${rawText}
--- END OCR TEXT ---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant: {
                            type: Type.STRING,
                            description: "The name of the merchant or store.",
                        },
                        date: {
                            type: Type.STRING,
                            description: "The transaction date in YYYY-MM-DD format.",
                        },
                        amount: {
                            type: Type.STRING,
                            description: "The total amount of the transaction as a string of numbers.",
                        },
                    },
                },
            },
        });
        
        const aiResult = JSON.parse(response.text) as { merchant?: string | null; date?: string | null; amount?: string | null };

        setParsedData(prevData => ({
            ...prevData, // Keep existing rawText
            merchant: aiResult.merchant || prevData.merchant,
            date: aiResult.date || prevData.date,
            amount: aiResult.amount || prevData.amount,
        }));
        context?.notifySuccess("Receipt data enhanced with AI!");

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        setAiError(`AI Enhancement Failed: ${e.message || "Unknown error"}`);
        context?.notifyError(`AI Enhancement Failed: ${e.message || "Unknown error"}`);
    } finally {
        setIsAiProcessing(false);
    }
  };
  
  const handleCreateTransaction = () => {
    if (!parsedData.amount && !parsedData.date && !parsedData.merchant && !rawText) { // Check rawText too
        context?.notifyWarning("No data extracted or entered. Please process a receipt or ensure data was extracted.");
        return;
    }
    // Use parsedData fields if available, otherwise fallback for safety, though ideally they should be populated.
    const transactionData = {
        merchant: parsedData.merchant || '', 
        date: parsedData.date || new Date().toISOString().split('T')[0],
        amount: parsedData.amount || '',
        rawText: rawText // Pass raw text in case user wants to see it in notes or similar later
    };

    navigate('/transactions/new', { 
      state: { 
        scannedData: { // Ensure this matches TransactionFormLocationState
            ...transactionData,
            type: TransactionType.EXPENSE // Default to expense
        } 
      } 
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Receipt with OCR" size="xl">
      <div className="space-y-4">
        <Input
          type="file"
          label="Upload Receipt Image"
          accept="image/*"
          onChange={handleImageChange}
          containerClassName="mb-0"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/80 dark:file:text-white hover:file:bg-primary/20"
        />

        {selectedImage && (
          <div className="mt-4 p-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-hidden flex justify-center bg-gray-50 dark:bg-gray-700">
            <img src={selectedImage} alt="Receipt Preview" className="max-h-full object-contain" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
            <Button 
                onClick={handleProcessReceipt} 
                disabled={!selectedImage || isProcessing || isAiProcessing} 
                isLoading={isProcessing} 
                variant="secondary" 
                className="w-full sm:flex-1" 
                leftIcon={<i className="fas fa-cogs"></i>}
            >
            {isProcessing ? `Processing (${ocrProgress}%) - ${ocrStatus}` : 'Process with Tesseract'}
            </Button>
            {ai && rawText && ( // Only show AI button if AI is initialized and rawText is available
                 <Button 
                    onClick={handleEnhanceWithAi} 
                    disabled={isProcessing || isAiProcessing || !rawText} 
                    isLoading={isAiProcessing} 
                    variant="primary" 
                    className="w-full sm:flex-1" 
                    leftIcon={<i className="fas fa-magic"></i>}
                >
                    {isAiProcessing ? 'Enhancing with AI...' : 'Enhance with AI (Gemini)'}
                </Button>
            )}
        </div>
        {aiError && <p className="text-xs text-danger dark:text-red-400 text-center">{aiError}</p>}


        {(rawText || Object.keys(parsedData).length > 0 && parsedData.rawText === undefined ) && (
            <div className="mt-4 space-y-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Extracted Data:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">
                    <div><strong className="text-gray-500 dark:text-gray-400">Merchant:</strong> <span className="text-gray-800 dark:text-gray-100">{parsedData.merchant || 'N/A'}</span></div>
                    <div><strong className="text-gray-500 dark:text-gray-400">Date:</strong> <span className="text-gray-800 dark:text-gray-100">{parsedData.date || 'N/A'}</span></div>
                    <div><strong className="text-gray-500 dark:text-gray-400">Amount:</strong> <span className="text-gray-800 dark:text-gray-100">{parsedData.amount ? context?.formatCurrency(parseFloat(parsedData.amount)) : 'N/A'}</span></div>
                </div>
                 <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary">View Raw OCR Text</summary>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                        {rawText || 'No raw text available.'}
                    </pre>
                </details>
            </div>
        )}
        {(rawText || parsedData.merchant || parsedData.date || parsedData.amount) && ( // Enable button if any data is present
            <Button onClick={handleCreateTransaction} variant="primary" className="w-full mt-3" leftIcon={<i className="fas fa-plus-circle"></i>} disabled={isProcessing || isAiProcessing}>
                Create Transaction from Scan
            </Button>
        )}

      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="light" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default ReceiptScannerModal;